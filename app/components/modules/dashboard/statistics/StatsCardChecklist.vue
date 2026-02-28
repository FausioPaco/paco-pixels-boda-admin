<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

defineOptions({ name: 'StatsCardChecklist' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const total = computed(() => props.stats?.checklist?.total ?? 0);
const done = computed(() => props.stats?.checklist?.done ?? 0);
const overdue = computed(() => props.stats?.checklist?.overdue ?? 0);
const dueSoon = computed(() => props.stats?.checklist?.dueSoon ?? 0);

const completion = computed(() =>
  Math.max(
    0,
    Math.min(100, Math.round(props.stats?.checklist?.completionRate ?? 0)),
  ),
);

/** Tailwind colors */
const readTailwindColor = (
  className: string,
  cssProp: 'color' | 'backgroundColor' = 'color',
) => {
  if (import.meta.server) return null;

  const el = document.createElement('span');
  el.className = className;
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.top = '-9999px';
  document.body.appendChild(el);

  const value = getComputedStyle(el)[cssProp];
  document.body.removeChild(el);

  return value || null;
};

const palette = ref({
  primary: '#857526',
  primaryLight: '#DAD3AB',
  track: 'rgba(0,0,0,0.08)',
  textStrong: 'rgba(0,0,0,0.85)',
  textMuted: 'rgba(0,0,0,0.65)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    primaryLight:
      readTailwindColor('text-primary-200') ?? palette.value.primaryLight,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    textStrong: readTailwindColor('text-grey-900') ?? palette.value.textStrong,
    textMuted: readTailwindColor('text-grey-600') ?? palette.value.textMuted,
  };
});

const gaugeData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['Concluído', 'Em falta'],
  datasets: [
    {
      data: [completion.value, Math.max(0, 100 - completion.value)],
      backgroundColor: [palette.value.primary, palette.value.primaryLight],
      borderWidth: 0,
      hoverOffset: 0,
    },
  ],
}));

const centerTextPlugin = computed<Plugin<'doughnut'>>(() => ({
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!ctx || !chartArea) return;

    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = palette.value.textStrong;
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${completion.value}%`, cx, cy);
    ctx.restore();
  },
}));

const gaugeOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
    datalabels: { display: false },
  },
}));

const hasData = computed(() => total.value > 0);
</script>

<template>
  <BaseCard title="Cronograma">
    <div class="space-y-4">
      <div class="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
        <div class="bg-primary-50/50 rounded-2xl p-3">
          <div class="flex items-center justify-between">
            <p class="text-grey-900 text-xs font-semibold">Progresso</p>
            <p class="text-grey-600 text-[11px]">tarefas</p>
          </div>

          <div class="mt-2 h-[140px]">
            <ClientOnly>
              <Doughnut
                :data="gaugeData"
                :options="gaugeOptions"
                :plugins="[centerTextPlugin]"
              />
            </ClientOnly>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="border-grey-100/55 rounded-2xl border bg-white px-3 py-2">
            <p class="text-grey-400 text-[11px]">Total</p>
            <p class="text-grey-900 text-sm font-semibold">{{ total }}</p>
          </div>

          <div class="border-grey-100/55 rounded-2xl border bg-white px-3 py-2">
            <p class="text-grey-400 text-[11px]">Concluídas</p>
            <p class="text-grey-900 text-sm font-semibold">{{ done }}</p>
          </div>

          <div class="border-grey-100/55 rounded-2xl border bg-white px-3 py-2">
            <p class="text-grey-400 text-[11px]">Em atraso</p>
            <p class="text-grey-900 text-sm font-semibold">{{ overdue }}</p>
          </div>

          <div class="border-grey-100/55 rounded-2xl border bg-white px-3 py-2">
            <p class="text-grey-400 text-[11px]">A vencer</p>
            <p class="text-grey-900 text-sm font-semibold">{{ dueSoon }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="!hasData"
        class="border-grey-200 bg-grey-50 rounded-2xl border border-dashed px-3 py-3"
      >
        <p class="text-grey-400 text-xs">
          Ainda não tens tarefas na checklist. Quando criares, vais ver o
          progresso aqui.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
