<script setup lang="ts">
import { Canvg } from 'canvg';
import jsPDF from 'jspdf';
import { useDeskSeatingSnapshot } from '~/composables/useDeskSeatingSnapshot';

/**
 * DesksSeatingPlanEditor
 * Editor de mapa (SVG) para:
 * - posicionar mesas (DeskLayouts) e itens (palco, DJ, etc.)
 * - exportar PNG/PDF
 *
 * Nota:
 * já existe aqui a lógica do Patch 1 (mostrar/ocultar mesas e adicionar por botão/modal).
 * Algumas partes (showAddDesk/modal/botão) serão ligadas no template no passo seguinte.
 */

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

const { snapshot: seatingSnapshot } = await useDeskSeatingSnapshot(
  props.eventId,
);

const planId = computed(() => seatingPlan.value?.id ?? null);

// ------------------------
// Responsividade / runtime
// ------------------------
const isClient = computed(() => import.meta.client);
const isMobile = ref(false);

onMounted(() => {
  const mq = window.matchMedia('(max-width: 1024px)');
  const apply = () => (isMobile.value = mq.matches);

  apply();
  mq.addEventListener?.('change', apply);
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
const showAddDesk = ref(false); // será ligado ao modal no template
const visibleDeskIds = ref<Set<number>>(new Set());

/**
 * Heurística:
 * se existirem muitos layouts e quase todos tiverem o mesmo x/y,
 * assumimos que foi auto-place e começamos com o mapa "vazio".
 */
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

/**
 * Inicialização do Set de mesas visíveis.
 * Importante: só inicializa uma vez (para não resetar após adicionares mesas).
 */
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

/**
 * Posição inicial para novas mesas adicionadas ao mapa.
 * Grid simples para evitar sobreposição.
 */
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

/**
 * Adiciona uma mesa ao mapa (persistindo via upsert).
 * Nota: a UI (botão/modal) que chama isto será ligada no template.
 */
async function addDeskToMap(deskId: number) {
  if (!seatingPlan.value) return;
  if (isMobile.value) return;

  const id = seatingPlan.value.id;
  const pos = findNextDeskPosition();

  const payload: UpsertDeskLayout = {
    x: pos.x,
    y: pos.y,
    rotation: 0,
    shape: 'round',
    width: 140,
    height: 140,
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

/**
 * Movimento optimista: actualiza a posição no estado local.
 * Persistência acontece apenas no pointerup.
 */
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

/**
 * No fim do drag, persiste no backend.
 * - Mesa: upsertDeskLayout(planId, deskId, payload)
 * - Item: updateItem(planId, itemId, payload)
 */
async function onPointerUp() {
  if (!active.value || !seatingPlan.value) return;

  const id = seatingPlan.value.id;

  if (active.value.kind === 'desk') {
    const layout = findDeskLayout(active.value.deskId);
    if (layout) {
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
    }

    active.value = null;
    return;
  }

  const item = findItem(active.value.itemId);
  if (item) {
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
  }

  active.value = null;
}

// ------------------------
// Itens rápidos (palco, DJ, etc.)
// ------------------------
async function quickAdd(type: SeatingPlanItemType) {
  if (!seatingPlan.value) return;
  if (isMobile.value) return;

  const payload: UpsertSeatingPlanItem = {
    type,
    label: type,
    x: 80,
    y: 80,
    rotation: 0,
    width: type === 'Palco' ? 260 : 180,
    height: 120,
    zIndex: 5,
    locked: false,
  };

  await addItem(seatingPlan.value.id, payload);
}

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

// ------------------------
// Botões (estrutura de dados)
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
function getSvgString(svgEl: SVGSVGElement) {
  if (!svgEl.getAttribute('xmlns'))
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!svgEl.getAttribute('xmlns:xlink'))
    svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  return new XMLSerializer().serializeToString(svgEl);
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

  const svgString = getSvgString(svg);

  const width =
    Number(svg.getAttribute('width')) || svg.viewBox.baseVal.width || 1600;
  const height =
    Number(svg.getAttribute('height')) || svg.viewBox.baseVal.height || 900;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const v = Canvg.fromString(ctx, svgString, {
    ignoreAnimation: true,
    ignoreMouse: true,
  });
  await v.render();

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

const deskById = computed(() => {
  const map = new Map<number, (typeof seatingSnapshot.value)[number]>();
  for (const d of seatingSnapshot.value ?? []) map.set(d.id, d);
  return map;
});

/**
 * Constrói um mapa seat -> info de ocupação por mesa.
 * Regra: seat por grupo.
 * - start seat mostra label (iniciais + ×N)
 * - seats seguintes são "continuação"
 */

function buildSeatMapForDesk(deskId: number) {
  const desk = deskById.value.get(deskId);
  const seatMap = new Map<number, SeatOccupancy>();

  if (!desk) return { desk: null, seatMap };

  for (const g of desk.guests ?? []) {
    if (!g.seatNumber || g.seatNumber <= 0) continue;

    const start = g.seatNumber;
    const count = Math.max(1, g.people_Count ?? 1);
    const end = start + count - 1;

    for (let s = start; s <= end; s++) {
      // se passar o limite da mesa, ainda assim marcamos para poder sinalizar erro visual
      const occ: SeatOccupancy = {
        kind: s === start ? 'start' : 'cont',
        guestId: g.id,
        guestName: g.name,
        peopleCount: count,
        startSeat: start,
        endSeat: end,
      };

      // Se já existe ocupação, isto é conflito (vamos tratar no render)
      // Mantemos o primeiro e deixamos o conflito sinalizado no render por “collision check”.
      if (!seatMap.has(s)) seatMap.set(s, occ);
      else {
        // marca conflito com um “placeholder” (opcional)
        // Podemos decidir no render: se seatMap tem s e há outro, assinalar vermelho.
        // Por simplicidade aqui, ignoramos o segundo.
      }
    }
  }

  return { desk, seatMap };
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
  const rSeats = rTable + 18; // distancia dos seats fora da mesa

  const pts: SeatPoint[] = [];

  // Começar no topo (-90deg) para ficar “bonito”
  for (let i = 0; i < renderN; i++) {
    const seat = i + 1;

    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / renderN;
    const x = cx + Math.cos(angle) * rSeats;
    const y = cy + Math.sin(angle) * rSeats;

    pts.push({ seat, x, y });
  }

  return pts;
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

                <g v-if="deskById.get(layout.deskId)">
                  <template
                    v-for="pt in getRoundSeatPoints(
                      layout,
                      deskById.get(layout.deskId)!.seats_Limit,
                      12,
                    )"
                    :key="`seat-${layout.deskId}-${pt.seat}`"
                  >
                    <!-- occupancy map por mesa -->
                    <template v-if="true">
                      <!-- vamos calcular no render chamando buildSeatMapForDesk -->
                      <g>
                        <circle
                          :cx="pt.x"
                          :cy="pt.y"
                          r="10"
                          :fill="
                            buildSeatMapForDesk(layout.deskId).seatMap.has(
                              pt.seat,
                            )
                              ? 'rgba(59,130,246,0.28)'
                              : 'rgba(0,0,0,0.06)'
                          "
                          :stroke="
                            buildSeatMapForDesk(layout.deskId).seatMap.has(
                              pt.seat,
                            )
                              ? 'rgba(59,130,246,0.55)'
                              : 'rgba(0,0,0,0.18)'
                          "
                          stroke-width="1.5"
                        />

                        <!-- número do seat (sempre) -->
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

                        <!-- label do grupo apenas no seat start -->
                        <template
                          v-if="
                            buildSeatMapForDesk(layout.deskId).seatMap.get(
                              pt.seat,
                            )?.kind === 'start'
                          "
                        >
                          <text
                            :x="pt.x"
                            :y="pt.y + 18"
                            text-anchor="middle"
                            font-size="10"
                            class="fill-primary-800"
                          >
                            {{
                              initials(
                                buildSeatMapForDesk(layout.deskId).seatMap.get(
                                  pt.seat,
                                )!.guestName,
                              )
                            }}
                            ×{{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.peopleCount
                            }}
                          </text>

                          <title>
                            {{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.guestName
                            }}
                            —
                            {{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.peopleCount
                            }}
                            pessoas (lugares
                            {{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.startSeat
                            }}–{{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.endSeat
                            }})
                          </title>
                        </template>

                        <!-- tooltip para seats continuação -->
                        <template
                          v-else-if="
                            buildSeatMapForDesk(layout.deskId).seatMap.has(
                              pt.seat,
                            )
                          "
                        >
                          <title>
                            {{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.guestName
                            }}
                            — continuação (lugares
                            {{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.startSeat
                            }}–{{
                              buildSeatMapForDesk(layout.deskId).seatMap.get(
                                pt.seat,
                              )!.endSeat
                            }})
                          </title>
                        </template>
                      </g>
                    </template>
                  </template>

                  <!-- Se seats_Limit > 12, mostrar +X -->
                  <text
                    v-if="deskById.get(layout.deskId)!.seats_Limit > 12"
                    :x="layout.width / 2"
                    :y="
                      layout.height / 2 +
                      Math.min(layout.width, layout.height) / 2 +
                      44
                    "
                    text-anchor="middle"
                    font-size="12"
                    fill="rgba(0,0,0,0.55)"
                  >
                    +{{ deskById.get(layout.deskId)!.seats_Limit - 12 }}
                  </text>
                </g>
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

        <div class="text-grey-400 mt-2 text-xs font-semibold">
          Dica: arrasta mesas/itens para posicionar. Duplo clique num item
          (palco/DJ/etc.) remove.
        </div>
      </div>
    </div>

    <LazyDesksAddToMapModal
      :show="showAddDesk"
      :desks="availableDesks"
      @close-modal="showAddDesk = false"
      @select-desk="addDeskToMap"
    />
  </div>
</template>
