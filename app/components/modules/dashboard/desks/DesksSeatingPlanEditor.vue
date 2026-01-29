<script setup lang="ts">
import jsPDF from 'jspdf';
import { useToast } from 'vue-toastification';
import { getSeatingPlanService } from '~/services/seatingPlanService';

/* -------------------------------------------------------------------------- */
/* Types (no topo)                                                            */
/* -------------------------------------------------------------------------- */
type Props = {
  eventId: number;
  desks: DeskOption[];
};

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

type ActionBtn = {
  key: string;
  label: string;
  name: string;
  icon: string;
  onClick: () => void | Promise<void>;
  disabled?: ComputedRef<boolean>;
};

type SeatOccupancy = {
  kind: 'start' | 'cont';
  guestId: number;
  guestName: string;
  peopleCount: number;
  startSeat: number;
  endSeat: number;
};

type SeatPoint = { seat: number; x: number; y: number };

type SvgToPngResult = { blob: Blob; width: number; height: number };

/* -------------------------------------------------------------------------- */
/* Props / stores / services                                                  */
/* -------------------------------------------------------------------------- */
const props = defineProps<Props>();
const { eventSlug } = useEventStore();
const toast = useToast();

const nuxtApp = useNuxtApp();
const seatingPlanService = getSeatingPlanService(nuxtApp.$api);

/* -------------------------------------------------------------------------- */
/* Data (composable)                                                          */
/* -------------------------------------------------------------------------- */
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
// Drag safety guards (CRÍTICO)
// ------------------------
let dragGuardsBound = false;

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    void onPointerUp();
  }
}

function bindDragGuards() {
  if (dragGuardsBound) return;
  dragGuardsBound = true;

  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', onPointerUp);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function unbindDragGuards() {
  if (!dragGuardsBound) return;
  dragGuardsBound = false;

  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
  window.removeEventListener('blur', onPointerUp);
  document.removeEventListener('visibilitychange', onVisibilityChange);
}

/* -------------------------------------------------------------------------- */
/* Snapshot (seats/ocupação) — fonte única para seatsLimit                     */
/* -------------------------------------------------------------------------- */
const { snapshot: seatingSnapshot, refreshSnapshot } =
  await useDeskSeatingSnapshot(props.eventId);

type SeatingSnapshotRow = (typeof seatingSnapshot.value)[number];

const deskById = computed(() => {
  const map = new Map<number, SeatingSnapshotRow>();
  for (const d of seatingSnapshot.value ?? []) map.set(d.id, d);
  return map;
});

/* -------------------------------------------------------------------------- */
/* Runtime / responsividade                                                    */
/* -------------------------------------------------------------------------- */
const isClient = computed(() => import.meta.client);
const isMobile = ref(false);

let mq: MediaQueryList | null = null;
let onMqChange: (() => void) | null = null;

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

/* -------------------------------------------------------------------------- */
/* Referências DOM                                                             */
/* -------------------------------------------------------------------------- */
const svgRef = ref<SVGSVGElement | null>(null);

/* -------------------------------------------------------------------------- */
/* Estado de drag (mesa/item)                                                  */
/* -------------------------------------------------------------------------- */
const active = ref<ActiveDrag>(null);

/* -------------------------------------------------------------------------- */
/* Patch 1 (UX): controlar que mesas são visíveis no mapa                      */
/* -------------------------------------------------------------------------- */
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

function getDeskSeatsLimit(deskId: number) {
  const snap = deskById.value.get(deskId);
  const snapLimit = snap?.seats_Limit ?? snap?.seats_Limit ?? 0;
  if (typeof snapLimit === 'number') return snapLimit;

  return 0;
}

watchEffect(() => {
  if (!seatingPlan.value) return;
  if (visibleDeskIds.value.size > 0) return;

  if (shouldStartEmpty.value) {
    visibleDeskIds.value = new Set();
    return;
  }

  const ids = (seatingPlan.value.deskLayouts ?? []).map((d) => d.deskId);
  visibleDeskIds.value = new Set(ids);
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

async function removeDeskFromMap(deskId: number) {
  if (!seatingPlan.value) return;

  await seatingPlanService.removeDeskFromMap(seatingPlan.value.id, deskId);

  const next = new Set(visibleDeskIds.value);
  next.delete(deskId);
  visibleDeskIds.value = next;

  await refreshSeatingPlan({ force: true });
  await refreshSnapshot();
}

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

  return { x: startX + col * stepX, y: startY + row * stepY };
}

const isAddingDesk = ref(false);
const addingDeskId = ref<number | null>(null);

async function addDeskToMap(deskMap: {
  deskId: number;
  shape: 'round' | 'rect';
}) {
  try {
    if (!seatingPlan.value) return;
    if (isMobile.value) return;

    const { deskId, shape } = deskMap;
    showAddDesk.value = false;

    isAddingDesk.value = true;
    addingDeskId.value = deskId;

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

    await upsertDeskLayout(seatingPlan.value.id, deskId, payload);

    const next = new Set(visibleDeskIds.value);
    next.add(deskId);
    visibleDeskIds.value = next;
  } catch (err: unknown) {
    toast.error('Erro ao adicionar mesa ao mapa. Por favor, tenta novamente.');
    console.log(err);
  } finally {
    isAddingDesk.value = false;
    addingDeskId.value = null;
    await refreshSeatingPlan();
  }
}

/* -------------------------------------------------------------------------- */
/* SVG helpers                                                                 */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* Drag handlers (mesas/itens)                                                 */
/* -------------------------------------------------------------------------- */
function onDeskPointerDown(evt: PointerEvent, deskId: number) {
  evt.preventDefault();
  if (isMobile.value) return;

  const layout = findDeskLayout(deskId);
  if (!layout || layout.locked) return;

  if (isPersisting.value) return;

  const p = getSvgPoint(evt);
  active.value = {
    kind: 'desk',
    deskId,
    startX: p.x,
    startY: p.y,
    originX: layout.x,
    originY: layout.y,
  };

  (evt.currentTarget as Element).setPointerCapture?.(evt.pointerId);
  bindDragGuards();
}

function onItemPointerDown(evt: PointerEvent, itemId: number) {
  evt.preventDefault();
  if (isMobile.value) return;
  if (isPersisting.value) return;

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

  (evt.currentTarget as Element).setPointerCapture?.(evt.pointerId);
  bindDragGuards();
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

const isPersisting = ref(false);

async function onPointerUp() {
  if (!active.value || !seatingPlan.value) return;

  const drag = active.value; // snapshot
  const planDbId = seatingPlan.value.id;

  // termina drag imediatamente (UX)
  active.value = null;
  unbindDragGuards();

  // evita saves paralelos
  if (isPersisting.value) return;
  isPersisting.value = true;

  try {
    if (drag.kind === 'desk') {
      const layout = findDeskLayout(drag.deskId);
      if (!layout) return;

      await upsertDeskLayout(planDbId, drag.deskId, {
        x: layout.x,
        y: layout.y,
        rotation: layout.rotation ?? 0,
        shape: layout.shape ?? 'round',
        width: layout.width ?? 140,
        height: layout.height ?? 140,
        locked: !!layout.locked,
      });

      return;
    }

    const item = findItem(drag.itemId);
    if (!item) return;

    await updateItem(planDbId, item.id, {
      type: item.type,
      label: item.label ?? null,
      x: item.x,
      y: item.y,
      rotation: item.rotation ?? 0,
      width: item.width ?? 220,
      height: item.height ?? 120,
      zIndex: item.zIndex ?? 1,
      locked: !!item.locked,
    });
  } finally {
    isPersisting.value = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Itens rápidos (palco, DJ, etc.)                                             */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* Presets do canvas                                                           */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* Export helpers (SVG -> PNG/PDF)                                             */
/* -------------------------------------------------------------------------- */
const FONT_REG_URL = '/fonts/PlusJakartaSans-Regular.ttf';
const FONT_BOLD_URL = '/fonts/PlusJakartaSans-Bold.ttf';

const EXPORT_FONT_NAME = 'Plus Jakarta Sans';
const EXPORT_FONT_FAMILY_SVG = `${EXPORT_FONT_NAME}, sans-serif`;
const EXPORT_FONT_FAMILY_CSS = `'${EXPORT_FONT_NAME}', sans-serif`;

let fontCssCache: string | null = null;

async function fetchAsBase64(url: string) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();

  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]!);

  return btoa(binary);
}

async function getInlineFontCss() {
  if (fontCssCache) return fontCssCache;

  const [reg64, bold64] = await Promise.all([
    fetchAsBase64(FONT_REG_URL),
    fetchAsBase64(FONT_BOLD_URL),
  ]);

  fontCssCache = `
@font-face{
  font-family:'${EXPORT_FONT_NAME}';
  src:url(data:font/ttf;base64,${reg64}) format('truetype');
  font-weight:400;
  font-style:normal;
}
@font-face{
  font-family:'${EXPORT_FONT_NAME}';
  src:url(data:font/ttf;base64,${bold64}) format('truetype');
  font-weight:700;
  font-style:normal;
}
text { font-family:${EXPORT_FONT_FAMILY_CSS}; }
`;
  return fontCssCache;
}

async function ensureExportFontLoaded() {
  if (!import.meta.client) return;

  const fonts = document.fonts as FontFaceSet | undefined;
  if (!fonts?.load) return;

  await fonts.load(`400 16px "${EXPORT_FONT_NAME}"`);
  await fonts.load(`700 16px "${EXPORT_FONT_NAME}"`);
  await fonts.ready;

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function exportReadySvgString(svgEl: SVGSVGElement) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // força font no root e nos <text>
  clone.setAttribute('style', `font-family: ${EXPORT_FONT_FAMILY_CSS};`);
  clone.setAttribute('font-family', EXPORT_FONT_FAMILY_SVG);
  clone
    .querySelectorAll('text')
    .forEach((t) => t.setAttribute('font-family', EXPORT_FONT_FAMILY_SVG));

  // xmlns
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // injeta fontes inline (à prova de falhas)
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = await getInlineFontCss();
  clone.insertBefore(style, clone.firstChild);

  // size + viewBox
  const width =
    Number(svgEl.getAttribute('width')) || svgEl.viewBox.baseVal.width || 1600;
  const height =
    Number(svgEl.getAttribute('height')) || svgEl.viewBox.baseVal.height || 900;

  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // fundo branco garantido
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(width));
  bg.setAttribute('height', String(height));
  bg.setAttribute('fill', '#ffffff');

  const firstEl =
    Array.from(clone.childNodes).find((n) => n.nodeType === 1) ?? null;
  clone.insertBefore(bg, firstEl);

  // grid: evita pattern no export
  const gridRect = clone.querySelector<SVGRectElement>(
    'rect[fill="url(#grid)"]',
  );
  if (gridRect) gridRect.setAttribute('fill', '#ffffff');
  clone.querySelector('#grid')?.closest('defs')?.remove();

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

async function svgToPngBlob(scale = 2): Promise<SvgToPngResult | null> {
  if (!import.meta.client) return null;

  const svg = svgRef.value;
  if (!svg) return null;

  const width =
    Number(svg.getAttribute('width')) || svg.viewBox.baseVal.width || 1600;
  const height =
    Number(svg.getAttribute('height')) || svg.viewBox.baseVal.height || 900;

  const svgString = await exportReadySvgString(svg);

  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Falha ao carregar SVG no <img>'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );

    if (!blob) return null;
    return { blob, width, height };
  } catch (err: unknown) {
    toast.error('Erro ao exportar o mapa. Por favor, tenta novamente.');
    console.log(err);
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function exportPng(
  filename = `seating-plan-${eventSlug}.png`,
  scale = 2,
) {
  await ensureExportFontLoaded();
  const res = await svgToPngBlob(scale);
  if (!res) return;
  downloadBlob(res.blob, filename);
}

async function exportPdf(
  filename = `seating-plan-${eventSlug}.pdf`,
  scale = 2,
) {
  await ensureExportFontLoaded();
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

/* -------------------------------------------------------------------------- */
/* Seats (ocupação + pontos)                                                   */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* Seat modal (assign)                                                         */
/* -------------------------------------------------------------------------- */
const showAddGuestToSeat = ref(false);
const selectedSeat = ref<{ deskId: number; seatNumber: number } | null>(null);

function openSeat(deskId: number, seatNumber: number) {
  selectedSeat.value = { deskId, seatNumber };
  showAddGuestToSeat.value = true;
}

/* -------------------------------------------------------------------------- */
/* Cores                                                                       */
/* -------------------------------------------------------------------------- */
const TABLE_COLOR = 'rgb(116,102,33)';
const TABLE_FILL_OP = '0.30';
const TABLE_STROKE_OP = '0.75';

const SEAT_FREE_COLOR = 'rgb(0,0,0)';
const SEAT_FREE_FILL_OP = '0.06';
const SEAT_FREE_STROKE_OP = '0.18';

const SEAT_OCC_COLOR = 'rgb(116,102,33)';
const SEAT_OCC_FILL_OP = '0.30';
const SEAT_OCC_STROKE_OP = '0.55';

const TEXT_PRIMARY = 'rgb(20,20,20)';
const TEXT_PRIMARY_OP = '0.90';
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
            @pointerleave="onPointerUp"
            @lostpointercapture="onPointerUp"
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
                @dblclick.stop="() => planId && deleteItem(planId, item.id)"
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
                  x="80"
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
                  :fill="TABLE_COLOR"
                  :fill-opacity="TABLE_FILL_OP"
                  :stroke="TABLE_COLOR"
                  :stroke-opacity="TABLE_STROKE_OP"
                  stroke-width="2"
                />
                <rect
                  v-else
                  x="0"
                  y="0"
                  :width="layout.width"
                  :height="layout.height"
                  rx="18"
                  :fill="TABLE_COLOR"
                  :fill-opacity="TABLE_FILL_OP"
                  :stroke="TABLE_COLOR"
                  :stroke-opacity="TABLE_STROKE_OP"
                  stroke-width="2"
                />

                <!-- Seats -->
                <template
                  v-for="pt in getSeatPoints(
                    layout,
                    getDeskSeatsLimit(layout.deskId),
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
                          ? SEAT_OCC_COLOR
                          : SEAT_FREE_COLOR
                      "
                      :fill-opacity="
                        seatOccupied(layout.deskId, pt.seat)
                          ? SEAT_OCC_FILL_OP
                          : SEAT_FREE_FILL_OP
                      "
                      :stroke="
                        seatOccupied(layout.deskId, pt.seat)
                          ? SEAT_OCC_COLOR
                          : SEAT_FREE_COLOR
                      "
                      :stroke-opacity="
                        seatOccupied(layout.deskId, pt.seat)
                          ? SEAT_OCC_STROKE_OP
                          : SEAT_FREE_STROKE_OP
                      "
                      stroke-width="1.5"
                    />
                    <text
                      :x="pt.x"
                      :y="pt.y"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      font-size="10"
                      :fill="TEXT_PRIMARY"
                      font-weight="700"
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
                        :fill="TEXT_PRIMARY"
                        font-weight="700"
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
                  :fill="TEXT_PRIMARY"
                  :fill-opacity="TEXT_PRIMARY_OP"
                  font-weight="700"
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
      :is-loading="isAddingDesk"
      :loading-desk-id="addingDeskId"
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
