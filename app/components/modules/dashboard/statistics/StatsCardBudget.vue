<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

defineOptions({ name: 'StatsCardBudget' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const currency = computed(() => props.stats?.budget?.currency ?? 'MZN');

const planned = computed(() => props.stats?.budget?.totalPlannedBudget ?? 0);
const actual = computed(() => props.stats?.budget?.totalActual ?? 0);
const paid = computed(() => props.stats?.budget?.totalPaid ?? 0);
const unpaid = computed(() => props.stats?.budget?.totalUnpaid ?? 0);

const consumptionPct = computed(() => {
  if (!planned.value) return 0;
  const pct = (actual.value / planned.value) * 100;
  if (Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
});

const money = (v: number) => formatMoney(v ?? 0, currency.value);

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
  track: 'rgba(0,0,0,0.08)',
  textStrong: 'rgba(0,0,0,0.85)',
  textMuted: 'rgba(0,0,0,0.65)',
  grid: 'rgba(0,0,0,0.06)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    textStrong: readTailwindColor('text-grey-900') ?? palette.value.textStrong,
    textMuted: readTailwindColor('text-grey-bold') ?? palette.value.textMuted,
    grid: palette.value.grid,
  };
});

/** Doughnut gauge */
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
    ctx.fillStyle = palette.value.textStrong;
    ctx.font = '900 18px inherit';
    ctx.fillText(`${consumptionPct.value}%`, cx, cy);
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

/** Bar */
const topCategories = computed(() => props.stats?.budget?.topCategories ?? []);
const hasBars = computed(() =>
  topCategories.value.some((c) => (c.actual ?? 0) > 0),
);

const barData = computed<ChartData<'bar'>>(() => ({
  labels: topCategories.value.map((c) => c.title),
  datasets: [
    {
      label: 'Custo real',
      data: topCategories.value.map((c) => Math.round(c.actual ?? 0)),
      backgroundColor: palette.value.primary,
      borderRadius: 12,
      borderSkipped: false,
      barThickness: 18,
      maxBarThickness: 22,
    },
  ],
}));

const barOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: palette.value.textMuted,
        maxRotation: 0,
        autoSkip: true,
        font: { size: 11, weight: 'bold' },
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: palette.value.grid },
      ticks: {
        color: palette.value.textMuted,
        font: { size: 11, weight: 'bold' },
        callback(value) {
          const v = Number(value ?? 0);
          if (!v) return '0';
          return v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);
        },
      },
    },
  },
  plugins: {
    legend: { display: false },
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
      color: palette.value.textMuted,
      font: { weight: 'bold', size: 10 },
      formatter: (v: unknown) => {
        const n = Number(v ?? 0);
        if (!n) return '';
        return money(n);
      },
      clamp: true,
    },
  },
}));
</script>

<template>
  <BaseCard title="Orçamento">
    <div class="space-y-4">
      <div class="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
        <!-- gauge -->
        <div class="bg-grey-50 rounded-2xl p-3">
          <div class="flex items-center justify-between">
            <p class="text-grey-900 text-xs font-semibold">Consumo</p>
            <p class="text-grey-bold text-[11px]">real vs planeado</p>
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

        <!-- numbers -->
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
              <p class="text-grey-bold text-[11px]">Planeado</p>
              <p class="text-grey-900 text-sm font-semibold">
                {{ money(planned) }}
              </p>
            </div>

            <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
              <p class="text-grey-bold text-[11px]">Real</p>
              <p class="text-grey-900 text-sm font-semibold">
                {{ money(actual) }}
              </p>
            </div>

            <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
              <p class="text-grey-bold text-[11px]">Pago</p>
              <p class="text-grey-900 text-sm font-semibold">
                {{ money(paid) }}
              </p>
            </div>

            <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
              <p class="text-grey-bold text-[11px]">Por pagar</p>
              <p class="text-grey-900 text-sm font-semibold">
                {{ money(unpaid) }}
              </p>
            </div>
          </div>

          <div class="bg-grey-50 rounded-2xl px-3 py-2">
            <p class="text-grey-bold text-[11px]">Nota</p>
            <p class="text-grey-900 text-[11px] font-semibold">
              Mantém o real abaixo do planeado para evitar surpresas.
            </p>
          </div>
        </div>
      </div>

      <!-- bar -->
      <div>
        <div class="flex items-center justify-between">
          <p class="text-grey-900 text-xs font-semibold">Top categorias</p>
          <p class="text-grey-bold text-[11px]">custo real</p>
        </div>

        <div class="mt-2 h-[210px]">
          <div
            v-if="!hasBars"
            class="border-grey-200 bg-grey-50 flex h-full items-center justify-center rounded-2xl border border-dashed"
          >
            <p class="text-grey-bold text-xs">
              Sem despesas registadas ainda — quando houver custos reais, vais
              ver as categorias aqui.
            </p>
          </div>

          <ClientOnly v-else>
            <Bar :data="barData" :options="barOptions" />
          </ClientOnly>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
