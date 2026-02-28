<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'vue-chartjs';

defineOptions({ name: 'StatsCardSuppliers' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const confirmed = computed(() => props.stats?.suppliers?.confirmed ?? 0);
const pending = computed(() => props.stats?.suppliers?.pending ?? 0);
const absent = computed(() => props.stats?.suppliers?.absent ?? 0);
const total = computed(() => props.stats?.suppliers?.total ?? 0);
const confirmedNotArrived = computed(
  () => props.stats?.suppliers?.confirmedNotArrived ?? 0,
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
  primaryLight: 'rgba(133, 117, 38, 0.15)',
  textMuted: 'rgba(0,0,0,0.65)',
  grid: 'rgba(0,0,0,0.06)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    primaryLight:
      readTailwindColor('bg-primary-500/15', 'backgroundColor') ??
      palette.value.primaryLight,
    textMuted: readTailwindColor('text-grey-600') ?? palette.value.textMuted,
    grid:
      readTailwindColor('bg-grey-100/50', 'backgroundColor') ??
      palette.value.grid,
  };
});

const hasData = computed(() => total.value > 0);

const barData = computed<ChartData<'bar'>>(() => ({
  labels: ['Confirmados', 'Pendentes', 'Ausentes'],
  datasets: [
    {
      label: 'Fornecedores',
      data: [confirmed.value, pending.value, absent.value],
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
  indexAxis: 'y',
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: palette.value.grid },
      ticks: {
        color: palette.value.textMuted,
        font: { size: 11, weight: 'bold' },
      },
    },
    y: {
      grid: { display: false },
      ticks: {
        color: palette.value.textMuted,
        font: { size: 11, weight: 'bold' },
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(item) {
          return `${item.label}: ${Number(item.raw ?? 0)}`;
        },
      },
    },
    datalabels: {
      display: (ctx) => Number(ctx.dataset.data[ctx.dataIndex] ?? 0) > 0,
      anchor: 'end',
      align: 'end',
      color: palette.value.textMuted,
      font: { weight: 'bold', size: 10 },
      formatter: (v: unknown) => String(v ?? ''),
      clamp: true,
    },
  },
}));
</script>

<template>
  <BaseCard title="Fornecedores">
    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="bg-grey-50 rounded-2xl px-3 py-2">
          <p class="text-grey-600 text-[11px]">Total</p>
          <p class="text-grey-900 text-sm font-semibold">{{ total }}</p>
        </div>

        <div class="bg-grey-50 rounded-2xl px-3 py-2">
          <p class="text-grey-600 text-[11px]">Confirmados sem chegada</p>
          <p class="text-grey-900 text-sm font-semibold">
            {{ confirmedNotArrived }}
          </p>
        </div>
      </div>

      <div class="h-[210px]">
        <div
          v-if="!hasData"
          class="border-grey-100 bg-grey-50 flex h-full animate-fadeIn flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center"
        >
          <IconLineChart
            :font-controlled="false"
            class="text-grey-300 size-[40px]"
          />
          <p class="text-grey-400 text-xs font-medium">
            Ainda não adicionaste fornecedores. Quando adicionares, vais ver o
            estado aqui.
          </p>
        </div>

        <ClientOnly v-else>
          <Bar :data="barData" :options="barOptions" />
        </ClientOnly>
      </div>
    </div>
  </BaseCard>
</template>
