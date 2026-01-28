<script setup lang="ts">
import { Canvg } from 'canvg';
import jsPDF from 'jspdf';
import { getSeatingPlanService } from '~/services/seatingPlanService';

// ------------------------
// Props
// ------------------------
type Props = {
  eventId: number;
  desks: DeskOption[];
};

const props = defineProps<Props>();

// ------------------------
// Data (composable)
// ------------------------
const {
  seatingPlan,
  isRefreshing,
  refreshSeatingPlan,
  isError,
  upsertDeskLayout,
  addItem,
  updateItem,
  deleteItem,
  updateCanvas,
} = await useSeatingPlan(props.eventId, { immediate: true });

const planId = computed(() => seatingPlan.value?.id ?? null);

// ------------------------
// Snapshot (seats/ocupação) — fonte única para seatsLimit
// ------------------------
const { snapshot: seatingSnapshot, refreshSnapshot } =
  await useDeskSeatingSnapshot(props.eventId);

const deskById = computed(() => {
  const map = new Map<number, (typeof seatingSnapshot.value)[number]>();
  for (const d of seatingSnapshot.value ?? []) map.set(d.id, d);
  return map;
});

// ------------------------
// Runtime / responsividade
// ------------------------
const isClient = computed(() => import.meta.client);
const isMobile = ref(false);

let mq: MediaQueryList | null = null;
let onMqChange: ((e: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
  mq = window.matchMedia('(max-width: 1024px)');
  const apply = () => (isMobile.value = !!mq?.matches);
  apply();

  onMqChange = () => apply();
  mq.addEventListener?.('change', onMqChange);
});

onBeforeUnmount(() => {
  if (mq && onMqChange) mq.removeEventListener?.('change', onMqChange);
});

// ------------------------
// Referências DOM
// ------------------------
const svgRef = ref<SVGSVGElement | null>(null);

// ------------------------
// Estado de drag (mesa/item)
// ------------------------
type ActiveDrag =
  | null
  | {
      kind: 'desk';
      deskId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | {
      kind: 'item';
      itemId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    };

const active = ref<ActiveDrag>(null);

// ------------------------
// Patch 1 (UX): controlar que mesas são visíveis no mapa
// ------------------------
const showAddDesk = ref(false);
const visibleDeskIds = ref<Set<number>>(new Set());

const shouldStartEmpty = computed(() => {
  const layouts = seatingPlan.value?.deskLayouts ?? [];
  if (layouts.length < 6) return false;

  const first = layouts[0];
  if (!first) return false;

  const samePosCount = layouts.filter(
    (l) => Math.abs(l.x - first.x) < 1 && Math.abs(l.y - first.y) < 1,
  ).length;

  return samePosCount / layouts.length >= 0.9;
});

const nuxtApp = useNuxtApp();
const seatingPlanService = getSeatingPlanService(nuxtApp.$api);

async function removeDeskFromMap(deskId: number) {
  if (!seatingPlan.value) return;

  const planId = seatingPlan.value.id;

  await seatingPlanService.removeDeskFromMap(planId, deskId);

  // sincronizar frontend
  const next = new Set(visibleDeskIds.value);
  next.delete(deskId);
  visibleDeskIds.value = next;

  await refreshSeatingPlan();
  await refreshSnapshot();
}

watchEffect(() => {
  if (!seatingPlan.value) return;
  if (visibleDeskIds.value.size > 0) return;

  if (shouldStartEmpty.value) {
    visibleDeskIds.value = new Set();
  } else {
    const ids = (seatingPlan.value.deskLayouts ?? []).map((d) => d.deskId);
    visibleDeskIds.value = new Set(ids);
  }
});

const visibleDeskLayouts = computed(() => {
  const layouts = seatingPlan.value?.deskLayouts ?? [];
  const ids = visibleDeskIds.value;
  return layouts.filter((l) => ids.has(l.deskId));
});

const availableDesks = computed(() => {
  const placed = visibleDeskIds.value;
  return props.desks.filter((d) => !placed.has(d.id));
});

function findNextDeskPosition() {
  const existing = visibleDeskLayouts.value;

  const startX = 80;
  const startY = 80;
  const stepX = 190;
  const stepY = 190;
  const cols = 5;

  const i = existing.length;
  const col = i % cols;
  const row = Math.floor(i / cols);

  return {
    x: startX + col * stepX,
    y: startY + row * stepY,
  };
}

async function addDeskToMap(deskMap: {
  deskId: number;
  shape: 'round' | 'rect';
}) {
  if (!seatingPlan.value) return;
  if (isMobile.value) return;

  const { deskId, shape } = deskMap;

  const id = seatingPlan.value.id;
  const pos = findNextDeskPosition();

  const payload: UpsertDeskLayout = {
    x: pos.x,
    y: pos.y,
    rotation: 0,
    shape: shape ?? 'round',
    width: shape === 'rect' ? 220 : 140,
    height: shape === 'rect' ? 120 : 140,
    locked: false,
  };

  await upsertDeskLayout(id, deskId, payload);

  const next = new Set(visibleDeskIds.value);
  next.add(deskId);
  visibleDeskIds.value = next;

  showAddDesk.value = false;
}

// ------------------------
// SVG helpers
// ------------------------
function getSvgPoint(evt: PointerEvent) {
  const svg = svgRef.value;
  if (!svg) return { x: 0, y: 0 };

  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };

  const loc = pt.matrixTransform(ctm.inverse());
  return { x: loc.x, y: loc.y };
}

function findDeskLayout(deskId: number): DeskLayout | undefined {
  return seatingPlan.value?.deskLayouts?.find((d) => d.deskId === deskId);
}

function findItem(itemId: number): SeatingPlanItem | undefined {
  return seatingPlan.value?.items?.find((i) => i.id === itemId);
}

// ------------------------
// Drag handlers (mesas/itens)
// ------------------------
function onDeskPointerDown(evt: PointerEvent, deskId: number) {
  evt.preventDefault();
  if (isMobile.value) return;

  const layout = findDeskLayout(deskId);
  if (!layout || layout.locked) return;

  const p = getSvgPoint(evt);
  active.value = {
    kind: 'desk',
    deskId,
    startX: p.x,
    startY: p.y,
    originX: layout.x,
    originY: layout.y,
  };

  (evt.target as Element).setPointerCapture?.(evt.pointerId);
}

function onItemPointerDown(evt: PointerEvent, itemId: number) {
  evt.preventDefault();
  if (isMobile.value) return;

  const item = findItem(itemId);
  if (!item || item.locked) return;

  const p = getSvgPoint(evt);
  active.value = {
    kind: 'item',
    itemId,
    startX: p.x,
    startY: p.y,
    originX: item.x,
    originY: item.y,
  };

  (evt.target as Element).setPointerCapture?.(evt.pointerId);
}

function onPointerMove(evt: PointerEvent) {
  if (!active.value || !seatingPlan.value) return;

  const p = getSvgPoint(evt);
  const dx = p.x - active.value.startX;
  const dy = p.y - active.value.startY;

  if (active.value.kind === 'desk') {
    const layout = findDeskLayout(active.value.deskId);
    if (!layout) return;

    layout.x = Math.max(0, active.value.originX + dx);
    layout.y = Math.max(0, active.value.originY + dy);
    return;
  }

  const item = findItem(active.value.itemId);
  if (!item) return;

  item.x = Math.max(0, active.value.originX + dx);
  item.y = Math.max(0, active.value.originY + dy);
}

async function onPointerUp() {
  if (!active.value || !seatingPlan.value) return;

  const id = seatingPlan.value.id;

  try {
    if (active.value.kind === 'desk') {
      const layout = findDeskLayout(active.value.deskId);
      if (!layout) return;

      const payload: UpsertDeskLayout = {
        x: layout.x,
        y: layout.y,
        rotation: layout.rotation ?? 0,
        shape: layout.shape ?? 'round',
        width: layout.width ?? 140,
        height: layout.height ?? 140,
        locked: !!layout.locked,
      };

      await upsertDeskLayout(id, active.value.deskId, payload);
      return;
    }

    const item = findItem(active.value.itemId);
    if (!item) return;

    const payload: UpsertSeatingPlanItem = {
      type: item.type,
      label: item.label ?? null,
      x: item.x,
      y: item.y,
      rotation: item.rotation ?? 0,
      width: item.width ?? 220,
      height: item.height ?? 120,
      zIndex: item.zIndex ?? 1,
      locked: !!item.locked,
    };

    await updateItem(id, item.id, payload);
  } finally {
    active.value = null;
  }
}

// ------------------------
// Itens rápidos (palco, DJ, etc.)
// ------------------------
type ActionBtn = {
  key: string;
  label: string;
  name: string;
  icon: string;
  onClick: () => void | Promise<void>;
  disabled?: ComputedRef<boolean>;
};

const isDesktopOnlyDisabled = computed(() => isMobile.value);

async function quickAdd(type: SeatingPlanItemType) {
  if (!seatingPlan.value) return;
  if (isMobile.value) return;

  const payload: UpsertSeatingPlanItem = {
    type,
    label: type,
    x: 80,
    y: 80,
    rotation: 0,
    width: 180,
    height: 120,
    zIndex: 5,
    locked: false,
  };

  await addItem(seatingPlan.value.id, payload);
}

const quickActions: ActionBtn[] = [
  {
    key: 'stage',
    label: '+ Palco',
    name: 'Palco',
    icon: 'stage',
    onClick: () => quickAdd('Palco'),
    disabled: isDesktopOnlyDisabled,
  },
  {
    key: 'dj',
    label: '+ DJ',
    name: 'DJ',
    icon: 'dj',
    onClick: () => quickAdd('DJ'),
    disabled: isDesktopOnlyDisabled,
  },
  {
    key: 'dance',
    label: '+ Pista',
    name: 'Pista',
    icon: 'dance-floor',
    onClick: () => quickAdd('Pista'),
    disabled: isDesktopOnlyDisabled,
  },
  {
    key: 'buffet',
    label: '+ Buffet',
    name: 'Buffet',
    icon: 'buffet',
    onClick: () => quickAdd('Buffet'),
    disabled: isDesktopOnlyDisabled,
  },
  {
    key: 'entry',
    label: '+ Entrada',
    name: 'Entrada',
    icon: 'entrance',
    onClick: () => quickAdd('Entrada'),
    disabled: isDesktopOnlyDisabled,
  },
];

const getQuickActionByLabel = (name: string) =>
  quickActions.find((a) => a.name === name);

function deskLabel(deskId: number) {
  const d = props.desks.find((x) => x.id === deskId);
  return d?.name ?? `Mesa ${deskId}`;
}

// ------------------------
// Presets do canvas
// ------------------------
async function setCanvasPreset(preset: 'small' | 'medium' | 'large') {
  if (!seatingPlan.value) return;
  if (isMobile.value) return;

  const next: UpdateSeatingPlanCanvas =
    preset === 'small'
      ? { canvasWidth: 1200, canvasHeight: 700 }
      : preset === 'medium'
        ? { canvasWidth: 1600, canvasHeight: 900 }
        : { canvasWidth: 2200, canvasHeight: 1200 };

  await updateCanvas(seatingPlan.value.id, next);
}

const canvasPresets: ActionBtn[] = [
  {
    key: 'small',
    label: 'Sala pequena',
    name: 'Sala pequena',
    icon: 'small-room',
    onClick: () => setCanvasPreset('small'),
    disabled: isDesktopOnlyDisabled,
  },
  {
    key: 'medium',
    label: 'Sala média',
    name: 'Sala média',
    icon: 'medium-room',
    onClick: () => setCanvasPreset('medium'),
    disabled: isDesktopOnlyDisabled,
  },
  {
    key: 'large',
    label: 'Sala grande',
    name: 'Sala grande',
    icon: 'large-room',
    onClick: () => setCanvasPreset('large'),
    disabled: isDesktopOnlyDisabled,
  },
];

const exportActions: ActionBtn[] = [
  {
    key: 'png',
    label: 'Exportar PNG',
    name: 'Exportar PNG',
    icon: 'download',
    onClick: () => exportPng(),
  },
  {
    key: 'pdf',
    label: 'Exportar PDF',
    name: 'Exportar PDF',
    icon: 'download',
    onClick: () => exportPdf(),
  },
];

// ------------------------
// Export helpers (SVG -> PNG/PDF)
// ------------------------
function normalizeSvgColor(value: string) {
  const v = (value ?? '').trim();

  // Ex: "rgb(116 102 33 / 0.3)"
  const modernRgb = v.match(
    /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\/\s*([0-9.]+)\s*\)$/i,
  );
  if (modernRgb) {
    const [, r, g, b, a] = modernRgb;
    return `rgba(${r},${g},${b},${a})`;
  }

  // Ex: "rgb(116 102 33)" (sem /alpha)
  const spacedRgb = v.match(
    /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\)$/i,
  );
  if (spacedRgb) {
    const [, r, g, b] = spacedRgb;
    return `rgb(${r},${g},${b})`;
  }

  return v;
}

function exportReadySvgString(svgEl: SVGSVGElement) {
  // clone do SVG
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // remove o grid pattern no export (canvg pode falhar e pintar tudo de preto)
  clone.querySelector('#grid')?.closest('defs')?.remove();

  const gridRect = clone.querySelector<SVGRectElement>(
    'rect[fill="url(#grid)"]',
  );
  if (gridRect) {
    // substitui por branco ou cinza muito leve
    gridRect.setAttribute('fill', '#ffffff');
  }

  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // width/height confiáveis
  const width =
    Number(svgEl.getAttribute('width')) || svgEl.viewBox.baseVal.width || 1600;
  const height =
    Number(svgEl.getAttribute('height')) || svgEl.viewBox.baseVal.height || 900;

  // fundo branco real
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(width));
  bg.setAttribute('height', String(height));
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  // IMPORTANTE: computed styles do ORIGINAL (no DOM), aplicados ao CLONE
  const srcNodes = svgEl.querySelectorAll<SVGElement>('*');
  const dstNodes = clone.querySelectorAll<SVGElement>('*');

  const len = Math.min(srcNodes.length, dstNodes.length);

  for (let i = 0; i < len; i++) {
    const src = srcNodes[i];
    const dst = dstNodes[i];

    if (!src || !dst) continue;

    const cs = getComputedStyle(src);

    const fill = normalizeSvgColor(cs.getPropertyValue('fill'));
    const stroke = normalizeSvgColor(cs.getPropertyValue('stroke'));
    const strokeWidth = cs.getPropertyValue('stroke-width');
    const opacity = cs.getPropertyValue('opacity');

    const fillOpacity = cs.getPropertyValue('fill-opacity');
    const strokeOpacity = cs.getPropertyValue('stroke-opacity');

    if (fillOpacity) dst.setAttribute('fill-opacity', fillOpacity);
    if (strokeOpacity) dst.setAttribute('stroke-opacity', strokeOpacity);

    if (fill && fill !== 'none') dst.setAttribute('fill', fill);
    if (stroke && stroke !== 'none') dst.setAttribute('stroke', stroke);
    if (strokeWidth) dst.setAttribute('stroke-width', strokeWidth);
    if (opacity) dst.setAttribute('opacity', opacity);

    if (dst.tagName.toLowerCase() === 'text') {
      const fontSize = cs.getPropertyValue('font-size');
      const fontWeight = cs.getPropertyValue('font-weight');
      const fontFamily = cs.getPropertyValue('font-family');
      const color = cs.getPropertyValue('fill');

      if (fontSize) dst.setAttribute('font-size', fontSize);
      if (fontWeight) dst.setAttribute('font-weight', fontWeight);
      if (fontFamily) dst.setAttribute('font-family', fontFamily);
      if (color && color !== 'none') dst.setAttribute('fill', color);
    }

    dst.removeAttribute('class');
  }

  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function svgToPngBlob(
  scale = 2,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  if (!import.meta.client) return null;

  const svg = svgRef.value;
  if (!svg) return null;

  const svgString = exportReadySvgString(svg);

  const width =
    Number(svg.getAttribute('width')) || svg.viewBox.baseVal.width || 1600;
  const height =
    Number(svg.getAttribute('height')) || svg.viewBox.baseVal.height || 900;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const v = Canvg.fromString(ctx, svgString, {
    ignoreAnimation: true,
    ignoreMouse: true,
  });

  await v.render();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );

  if (!blob) return null;
  return { blob, width, height };
}

async function exportPng(
  filename = `seating-plan-${props.eventId}.png`,
  scale = 2,
) {
  const res = await svgToPngBlob(scale);
  if (!res) return;
  downloadBlob(res.blob, filename);
}

async function exportPdf(
  filename = `seating-plan-${props.eventId}.pdf`,
  scale = 2,
) {
  const res = await svgToPngBlob(scale);
  if (!res) return;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(res.blob);
  });

  const imgW = pageW;
  const imgH = (res.height / res.width) * imgW;

  let drawW = imgW;
  let drawH = imgH;

  if (drawH > pageH) {
    drawH = pageH;
    drawW = (res.width / res.height) * drawH;
  }

  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;

  pdf.addImage(dataUrl, 'PNG', x, y, drawW, drawH);
  pdf.save(filename);
}

// ------------------------
// Seats (ocupação + pontos)
// ------------------------
type SeatOccupancy = {
  kind: 'start' | 'cont';
  guestId: number;
  guestName: string;
  peopleCount: number;
  startSeat: number;
  endSeat: number;
};

type SeatPoint = { seat: number; x: number; y: number };

const seatMapsByDeskId = computed(() => {
  const map = new Map<number, Map<number, SeatOccupancy>>();

  for (const d of seatingSnapshot.value ?? []) {
    const seatMap = new Map<number, SeatOccupancy>();

    for (const g of d.guests ?? []) {
      if (!g.seatNumber || g.seatNumber <= 0) continue;

      const start = g.seatNumber;
      const count = Math.max(1, g.people_Count ?? 1);
      const end = start + count - 1;

      for (let s = start; s <= end; s++) {
        if (!seatMap.has(s)) {
          seatMap.set(s, {
            kind: s === start ? 'start' : 'cont',
            guestId: g.id,
            guestName: g.name,
            peopleCount: count,
            startSeat: start,
            endSeat: end,
          });
        }
      }
    }

    map.set(d.id, seatMap);
  }

  return map;
});

function seatOcc(deskId: number, seat: number) {
  return seatMapsByDeskId.value.get(deskId)?.get(seat) ?? null;
}

function seatOccupied(deskId: number, seat: number) {
  return seatMapsByDeskId.value.get(deskId)?.has(seat) ?? false;
}

function initials(name: string) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (a + b).toUpperCase();
}

function getRoundSeatPoints(
  layout: DeskLayout,
  seatsLimit: number,
  maxRender = 12,
): SeatPoint[] {
  const n = Math.max(0, seatsLimit);
  if (n === 0) return [];

  const renderN = Math.min(n, maxRender);

  const cx = (layout.width ?? 140) / 2;
  const cy = (layout.height ?? 140) / 2;

  const rTable = Math.min(layout.width ?? 140, layout.height ?? 140) / 2;
  const rSeats = rTable + 18;

  const pts: SeatPoint[] = [];

  for (let i = 0; i < renderN; i++) {
    const seat = i + 1;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / renderN;
    const x = cx + Math.cos(angle) * rSeats;
    const y = cy + Math.sin(angle) * rSeats;
    pts.push({ seat, x, y });
  }

  return pts;
}

function getRectSeatPoints(
  layout: DeskLayout,
  seatsLimit: number,
  maxRender = 12,
): SeatPoint[] {
  const n = Math.max(0, seatsLimit);
  if (n === 0) return [];

  const renderN = Math.min(n, maxRender);

  const w = layout.width ?? 140;
  const h = layout.height ?? 140;

  const pad = 18;
  const left = -pad;
  const top = -pad;
  const right = w + pad;
  const bottom = h + pad;

  const perim = 2 * (w + h) + 8 * pad;
  const pts: SeatPoint[] = [];

  for (let i = 0; i < renderN; i++) {
    const seat = i + 1;
    const t = (i / renderN) * perim;

    let x = 0;
    let y = 0;

    const topLen = right - left;
    const rightLen = bottom - top;
    const bottomLen = topLen;

    if (t < topLen) {
      x = left + t;
      y = top;
    } else if (t < topLen + rightLen) {
      x = right;
      y = top + (t - topLen);
    } else if (t < topLen + rightLen + bottomLen) {
      x = right - (t - (topLen + rightLen));
      y = bottom;
    } else {
      x = left;
      y = bottom - (t - (topLen + rightLen + bottomLen));
    }

    pts.push({ seat, x: Math.max(-40, x), y: Math.max(-40, y) });
  }

  return pts;
}

function getSeatPoints(layout: DeskLayout, seatsLimit: number, maxRender = 12) {
  return layout.shape === 'rect'
    ? getRectSeatPoints(layout, seatsLimit, maxRender)
    : getRoundSeatPoints(layout, seatsLimit, maxRender);
}

// ------------------------
// Seat modal (assign)
// ------------------------
const showAddGuestToSeat = ref(false);
const selectedSeat = ref<{ deskId: number; seatNumber: number } | null>(null);

function openSeat(deskId: number, seatNumber: number) {
  selectedSeat.value = { deskId, seatNumber };
  showAddGuestToSeat.value = true;
}
</script>
<template>
  <div class="w-full">
    <BaseLoading
      v-if="isRefreshing"
      size="lg"
      orientation="vertical"
      class="block md:hidden"
      message="A carregar mapa..."
    />

    <BaseSearchNotFound v-if="isError" @fallback="refreshSeatingPlan">
      Não foi possível carregar o plano.
    </BaseSearchNotFound>

    <div v-else>
      <BaseAlert
        v-if="isClient && isMobile"
        type="informative"
        class="my-6"
        message="Este editor está optimizado para desktop. Por favor, acede a partir de um computador para editar o mapa de mesas."
        show
      />

      <div v-else class="my-6 animate-fadeIn">
        <!-- Main Actions -->
        <div class="mb-3 flex flex-wrap items-start gap-2">
          <!-- Quick add (itens como palco/DJ/etc.) -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="a in quickActions"
              :key="a.key"
              class="hover:border-primary-600 hover:bg-primary-600 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="a.disabled?.value"
              :title="a.label"
              @click="a.onClick"
            >
              <component
                :is="`icon-${a.icon}`"
                :font-controlled="false"
                class="h-4 w-4"
              />
              <span class="whitespace-nowrap">{{ a.label }}</span>
            </button>

            <button
              class="hover:border-primary-600 hover:bg-primary-600 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Adicionar mesa"
              @click="showAddDesk = true"
            >
              <IconDashboardDesks :font-controlled="false" class="h-4 w-4" />
              <span class="whitespace-nowrap">+ Mesa</span>
            </button>
          </div>

          <!-- Right side -->
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <!-- Canvas presets -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in canvasPresets"
                :key="p.key"
                class="hover:border-primary-600 hover:bg-primary-600 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="p.disabled?.value"
                :title="p.label"
                @click="p.onClick"
              >
                <component
                  :is="`icon-${p.icon}`"
                  :font-controlled="false"
                  class="h-4 w-4"
                />
                <span class="whitespace-nowrap">{{ p.label }}</span>
              </button>
            </div>
          </div>

          <!-- Exports -->
          <div class="ml-auto mt-3 flex flex-wrap items-center gap-2">
            <button
              v-for="e in exportActions"
              :key="e.key"
              class="hover:border-primary-600 hover:bg-primary-600 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              :title="e.label"
              @click="e.onClick"
            >
              <component
                :is="`icon-${e.icon}`"
                :font-controlled="false"
                class="h-4 w-4"
              />
              <span class="whitespace-nowrap">{{ e.label }}</span>
            </button>
          </div>
        </div>

        <!-- Canvas -->
        <div class="w-full overflow-auto rounded-2xl border bg-white">
          <svg
            ref="svgRef"
            class="block"
            :width="seatingPlan!.canvasWidth"
            :height="seatingPlan!.canvasHeight"
            :viewBox="`0 0 ${seatingPlan!.canvasWidth} ${seatingPlan!.canvasHeight}`"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <!-- background grid super leve -->
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  stroke-width="1"
                />
              </pattern>
            </defs>

            <rect
              x="0"
              y="0"
              :width="seatingPlan!.canvasWidth"
              :height="seatingPlan!.canvasHeight"
              fill="url(#grid)"
            />

            <!-- Itens (palco, DJ, etc.) -->
            <g v-for="item in seatingPlan!.items" :key="item.id">
              <g
                :transform="`translate(${item.x} ${item.y}) rotate(${item.rotation})`"
                style="cursor: grab"
                @pointerdown="(e) => onItemPointerDown(e, item.id)"
                @dblclick="() => planId && deleteItem(planId, item.id)"
              >
                <rect
                  x="0"
                  y="0"
                  :width="item.width"
                  :height="item.height"
                  rx="24"
                  fill="rgba(0,0,0,0.06)"
                  stroke="rgba(0,0,0,0.35)"
                  stroke-width="2"
                  stroke-dasharray="6 6"
                />

                <component
                  :is="`icon-${getQuickActionByLabel(item.type)?.icon || 'item'}`"
                  :font-controlled="false"
                  x="75"
                  y="16"
                  width="24"
                  height="24"
                  class="text-grey-600"
                  fill="rgba(0,0,0,0.45)"
                />

                <text x="70" y="60" font-size="14" fill="rgba(0,0,0,0.75)">
                  {{ item.label || item.type }}
                </text>

                <text x="20" y="88" font-size="11" fill="rgba(0,0,0,0.45)">
                  duplo clique para remover
                </text>
              </g>
            </g>

            <!-- Mesas -->
            <g v-for="layout in visibleDeskLayouts" :key="layout.deskId">
              <g
                :transform="`translate(${layout.x} ${layout.y}) rotate(${layout.rotation})`"
                style="cursor: grab"
                @pointerdown="(e) => onDeskPointerDown(e, layout.deskId)"
                @dblclick.stop="removeDeskFromMap(layout.deskId)"
              >
                <circle
                  v-if="layout.shape === 'round'"
                  :cx="layout.width / 2"
                  :cy="layout.height / 2"
                  :r="Math.min(layout.width, layout.height) / 2"
                  class="fill-primary-600/30 stroke-primary-700"
                  stroke-width="2"
                />
                <rect
                  v-else
                  x="0"
                  y="0"
                  :width="layout.width"
                  :height="layout.height"
                  rx="18"
                  class="fill-primary-600/30 stroke-primary-700"
                  stroke-width="2"
                />

                <!-- Seats -->
                <template
                  v-for="pt in getSeatPoints(
                    layout,
                    deskById.get(layout.deskId)?.seats_Limit ?? 0,
                    12,
                  )"
                  :key="`seat-${layout.deskId}-${pt.seat}`"
                >
                  <g
                    v-if="(deskById.get(layout.deskId)?.seats_Limit ?? 0) > 0"
                    style="cursor: pointer"
                    @click.stop="openSeat(layout.deskId, pt.seat)"
                  >
                    <circle
                      :cx="pt.x"
                      :cy="pt.y"
                      r="11"
                      :fill="
                        seatOccupied(layout.deskId, pt.seat)
                          ? 'rgb(116,102,33)'
                          : 'rgba(0,0,0,0.06)'
                      "
                      :stroke="
                        seatOccupied(layout.deskId, pt.seat)
                          ? 'rgb(116,102,33, 0.55)'
                          : 'rgba(0,0,0,0.18)'
                      "
                      stroke-width="1.5"
                    />
                    <text
                      :x="pt.x"
                      :y="pt.y"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      font-size="10"
                      class="fill-primary-800 font-semibold"
                    >
                      {{ pt.seat }}
                    </text>

                    <template
                      v-if="seatOcc(layout.deskId, pt.seat)?.kind === 'start'"
                    >
                      <text
                        :x="pt.x"
                        :y="pt.y + 20"
                        text-anchor="middle"
                        font-size="10"
                        class="fill-primary-800 font-semibold"
                      >
                        {{
                          initials(seatOcc(layout.deskId, pt.seat)!.guestName)
                        }}
                        ×{{ seatOcc(layout.deskId, pt.seat)!.peopleCount }}
                      </text>

                      <title>
                        {{ seatOcc(layout.deskId, pt.seat)!.guestName }} —
                        {{ seatOcc(layout.deskId, pt.seat)!.peopleCount }}
                        pessoas (lugares
                        {{ seatOcc(layout.deskId, pt.seat)!.startSeat }}–{{
                          seatOcc(layout.deskId, pt.seat)!.endSeat
                        }})
                      </title>
                    </template>

                    <template v-else-if="seatOccupied(layout.deskId, pt.seat)">
                      <title>
                        {{ seatOcc(layout.deskId, pt.seat)!.guestName }} —
                        continuação (lugares
                        {{ seatOcc(layout.deskId, pt.seat)!.startSeat }}–{{
                          seatOcc(layout.deskId, pt.seat)!.endSeat
                        }})
                      </title>
                    </template>
                  </g>
                </template>

                <text
                  :x="layout.width / 2"
                  :y="layout.height / 2"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-size="14"
                  class="fill-primary-900 font-semibold"
                >
                  {{ deskLabel(layout.deskId) }}
                </text>
              </g>
            </g>
          </svg>
        </div>
        <!-- Dicas -->
        <div class="text-grey-400 mt-2 flex gap-2 text-xs font-semibold">
          <IconInformation
            :font-controlled="false"
            class="text-grey-400 h-4 w-4 flex-shrink-0"
          />
          <span
            >Dica: arrasta mesas/itens para posicionar. Duplo clique num item
            (palco/DJ/etc.) remove. Duplo clique numa mesa remove do mapa (não
            apaga a mesa).</span
          >
        </div>
      </div>
    </div>

    <!-- Modais -->
    <LazyDesksAddToMapModal
      :show="showAddDesk"
      :desks="availableDesks"
      @close-modal="showAddDesk = false"
      @select-desk="addDeskToMap"
    />

    <LazyDesksAddGuestToSeatModal
      :show="showAddGuestToSeat"
      :event-id="props.eventId"
      :desk-id="selectedSeat?.deskId ?? null"
      :desk-name="
        selectedSeat ? (deskById.get(selectedSeat.deskId)?.name ?? null) : null
      "
      :seat-number="selectedSeat?.seatNumber ?? null"
      :current-guest-name="
        seatOcc(selectedSeat?.deskId ?? 0, selectedSeat?.seatNumber ?? 0)
          ?.guestName ?? null
      "
      :desk-guests="
        selectedSeat ? (deskById.get(selectedSeat.deskId)?.guests ?? []) : []
      "
      @close-modal="showAddGuestToSeat = false"
      @assigned="refreshSnapshot()"
    />
  </div>
</template>
