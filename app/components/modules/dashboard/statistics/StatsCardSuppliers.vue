<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'vue-chartjs';

defineOptions({ name: 'StatsCardSuppliers' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const categories = ['Confirmados', 'Pendentes', 'Ausentes'];

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
  label: 'rgba(0,0,0,0.65)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    label: readTailwindColor('text-grey-600') ?? palette.value.label,
  };
});

const barData = computed<ChartData<'bar'>>(() => {
  const s = props.stats?.suppliers;
  const values = [s?.confirmed ?? 0, s?.pending ?? 0, s?.absent ?? 0];

  return {
    labels: categories,
    datasets: [
      {
        label: 'Fornecedores',
        data: values,
        backgroundColor: palette.value.primary,
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 16,
      },
    ],
  };
});

const barOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.08)' },
      ticks: { color: palette.value.label },
    },
    y: {
      grid: { display: false },
      ticks: { color: palette.value.label },
    },
  },
  plugins: {
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
      color: palette.value.label,
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
      <div class="flex items-baseline justify-between">
        <p class="text-grey-900 text-sm font-semibold">
          {{ props.stats?.suppliers?.total ?? 0 }} total
        </p>
        <p class="text-grey-600 text-xs">
          Confirmados sem chegada:
          {{ props.stats?.suppliers?.confirmedNotArrived ?? 0 }}
        </p>
      </div>

      <div class="h-[220px]">
        <ClientOnly>
          <Bar :data="barData" :options="barOptions" />
        </ClientOnly>
      </div>
    </div>
  </BaseCard>
</template>
