<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

defineOptions({ name: 'StatsCardChecklist' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const completion = computed(() =>
  Math.round(props.stats?.checklist?.completionRate ?? 0),
);

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
  track: 'rgba(0,0,0,0.08)',
  strong: 'rgba(0,0,0,0.85)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    strong: readTailwindColor('text-grey-900') ?? palette.value.strong,
  };
});

const gaugeData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['Concluído', 'Em falta'],
  datasets: [
    {
      data: [completion.value, Math.max(0, 100 - completion.value)],
      backgroundColor: [palette.value.primary, palette.value.track],
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
    ctx.fillStyle = palette.value.strong;
    ctx.font = '800 20px inherit';
    ctx.fillText(`${completion.value}%`, cx, cy);
    ctx.restore();
  },
}));

const gaugeOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    tooltip: { enabled: false },
    datalabels: { display: false },
  },
}));
</script>

<template>
  <BaseCard title="Checklist">
    <div class="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <div class="h-[180px]">
        <ClientOnly>
          <Doughnut
            :data="gaugeData"
            :options="gaugeOptions"
            :plugins="[centerTextPlugin]"
          />
        </ClientOnly>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Total</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.total ?? 0
          }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Concluídas</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.done ?? 0
          }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Em atraso</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.overdue ?? 0
          }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">A vencer em breve</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.dueSoon ?? 0
          }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
