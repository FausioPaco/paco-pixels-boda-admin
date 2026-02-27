<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

defineOptions({ name: 'StatsCardBudget' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const currency = computed(() => props.stats?.budget?.currency ?? 'MZN');

const consumptionPct = computed(() => {
  const b = props.stats?.budget;
  if (!b || !b.totalPlannedBudget) return 0;
  const pct = (b.totalActual / b.totalPlannedBudget) * 100;
  if (Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
});

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
  label: 'rgba(0,0,0,0.65)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    strong: readTailwindColor('text-grey-900') ?? palette.value.strong,
    label: readTailwindColor('text-grey-600') ?? palette.value.label,
  };
});

const gaugeData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['Consumido', 'Disponível'],
  datasets: [
    {
      data: [consumptionPct.value, Math.max(0, 100 - consumptionPct.value)],
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
    ctx.font = '800 18px inherit';
    ctx.fillText(`${consumptionPct.value}%`, cx, cy);

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

const topCategories = computed(() => props.stats?.budget?.topCategories ?? []);

const barData = computed<ChartData<'bar'>>(() => ({
  labels: topCategories.value.map((c) => c.title),
  datasets: [
    {
      label: 'Custo real',
      data: topCategories.value.map((c) => Math.round(c.actual ?? 0)),
      backgroundColor: palette.value.primary,
      borderRadius: 10,
      borderSkipped: false,
    },
  ],
}));

const barOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: palette.value.label },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.08)' },
      ticks: { color: palette.value.label },
      beginAtZero: true,
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label(item) {
          return `${item.dataset.label}: ${money(Number(item.raw ?? 0))}`;
        },
      },
    },
    datalabels: {
      display: (ctx) => Number(ctx.dataset.data[ctx.dataIndex] ?? 0) > 0,
      anchor: 'end',
      align: 'end',
      color: palette.value.label,
      font: { weight: 'bold', size: 10 },
      formatter: (v: unknown) => money(Number(v ?? 0)),
      clamp: true,
    },
  },
}));

const money = (v: number) => formatMoney(v ?? 0, currency.value);
</script>

<template>
  <BaseCard title="Orçamento">
    <div class="space-y-4">
      <div class="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
        <div class="h-[150px]">
          <ClientOnly>
            <Doughnut
              :data="gaugeData"
              :options="gaugeOptions"
              :plugins="[centerTextPlugin]"
            />
          </ClientOnly>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Planeado</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalPlannedBudget ?? 0) }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Real</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalActual ?? 0) }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Pago</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalPaid ?? 0) }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Por pagar</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalUnpaid ?? 0) }}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p class="text-grey-600 mb-2 text-xs">Top categorias (custo real)</p>
        <div class="h-[190px]">
          <ClientOnly>
            <Bar :data="barData" :options="barOptions" />
          </ClientOnly>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
