<script setup lang="ts">
import { Canvg } from 'canvg';
import jsPDF from 'jspdf';

type Props = {
  eventId: number;
  desks: DeskOption[];
};

const props = defineProps<Props>();

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

const isClient = computed(() => import.meta.client);
const isMobile = ref(false);

onMounted(() => {
  const mq = window.matchMedia('(max-width: 1024px)');
  const apply = () => (isMobile.value = mq.matches);
  apply();
  mq.addEventListener?.('change', apply);
});

const svgRef = ref<SVGSVGElement | null>(null);

const active = ref<
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
    }
>(null);

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

function onDeskPointerDown(evt: PointerEvent, deskId: number) {
  evt.preventDefault();

  // mobile: só visualizar/exportar
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
  } else {
    const item = findItem(active.value.itemId);
    if (!item) return;
    item.x = Math.max(0, active.value.originX + dx);
    item.y = Math.max(0, active.value.originY + dy);
  }
}

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
  } else {
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
  }

  active.value = null;
}

async function quickAdd(type: SeatingPlanItemType) {
  if (!seatingPlan.value) return;
  if (isMobile.value) return;

  const payload: UpsertSeatingPlanItem = {
    type,
    label: type === 'stage' ? 'Palco' : type === 'dj' ? 'DJ' : null,
    x: 80,
    y: 80,
    rotation: 0,
    width: type === 'stage' ? 260 : 180,
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

// ------- export helpers

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

async function exportSvg(filename = `seating-plan-${props.eventId}.svg`) {
  if (!import.meta.client) return;
  const svg = svgRef.value;
  if (!svg) return;

  const svgString = getSvgString(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
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
      <div
        v-if="isClient && isMobile"
        class="border-grey-200 rounded-xl border bg-white p-4"
      >
        <div class="text-grey-700 text-sm">
          Este editor está optimizado para desktop. No telemóvel vamos apenas
          permitir visualizar e exportar.
        </div>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button
          class="rounded-lg border px-3 py-1 text-sm"
          @click="quickAdd('stage')"
        >
          + Palco
        </button>
        <button
          class="rounded-lg border px-3 py-1 text-sm"
          @click="quickAdd('dj')"
        >
          + DJ
        </button>
        <button
          class="rounded-lg border px-3 py-1 text-sm"
          @click="quickAdd('dancefloor')"
        >
          + Pista
        </button>
        <button
          class="rounded-lg border px-3 py-1 text-sm"
          @click="quickAdd('buffet')"
        >
          + Buffet
        </button>
        <button
          class="rounded-lg border px-3 py-1 text-sm"
          @click="quickAdd('entrance')"
        >
          + Entrada
        </button>

        <div class="ml-auto flex gap-2">
          <button
            class="rounded-lg border px-3 py-1 text-sm"
            @click="setCanvasPreset('small')"
          >
            Canvas S
          </button>
          <button
            class="rounded-lg border px-3 py-1 text-sm"
            @click="setCanvasPreset('medium')"
          >
            Canvas M
          </button>
          <button
            class="rounded-lg border px-3 py-1 text-sm"
            @click="setCanvasPreset('large')"
          >
            Canvas L
          </button>
        </div>
        <div class="ml-auto flex gap-2">
          <button
            class="rounded-lg border px-3 py-1 text-sm"
            @click="exportSvg()"
          >
            Exportar SVG
          </button>
          <button
            class="rounded-lg border px-3 py-1 text-sm"
            @click="exportPng()"
          >
            Exportar PNG
          </button>
          <button
            class="rounded-lg border px-3 py-1 text-sm"
            @click="exportPdf()"
          >
            Exportar PDF
          </button>
        </div>
      </div>

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

          <!-- Itens (palco, dj, etc.) -->
          <g v-for="item in seatingPlan!.items" :key="item.id">
            <g
              :transform="`translate(${item.x} ${item.y}) rotate(${item.rotation})`"
              style="cursor: grab"
              @pointerdown="(e) => onItemPointerDown(e, item.id)"
              @dblclick="() => deleteItem(seatingPlan!.id, item.id)"
            >
              <rect
                x="0"
                y="0"
                :width="item.width"
                :height="item.height"
                rx="14"
                fill="rgba(0,0,0,0.06)"
                stroke="rgba(0,0,0,0.25)"
              />
              <text x="10" y="22" font-size="14" fill="rgba(0,0,0,0.75)">
                {{ item.label || item.type }}
              </text>
              <text x="10" y="40" font-size="11" fill="rgba(0,0,0,0.45)">
                (duplo clique para remover)
              </text>
            </g>
          </g>

          <!-- Mesas -->
          <g v-for="layout in seatingPlan!.deskLayouts" :key="layout.deskId">
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
                fill="rgba(59, 130, 246, 0.10)"
                stroke="rgba(59, 130, 246, 0.45)"
                stroke-width="2"
              />
              <rect
                v-else
                x="0"
                y="0"
                :width="layout.width"
                :height="layout.height"
                rx="18"
                fill="rgba(59, 130, 246, 0.10)"
                stroke="rgba(59, 130, 246, 0.45)"
                stroke-width="2"
              />
              <text
                :x="layout.width / 2"
                :y="layout.height / 2"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="14"
                fill="rgba(0,0,0,0.75)"
              >
                {{ deskLabel(layout.deskId) }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div class="text-grey-500 mt-2 text-xs">
        Dica: arrasta mesas/itens para posicionar. Duplo clique num item
        (palco/DJ/etc.) remove.
      </div>
    </div>
  </div>
</template>
