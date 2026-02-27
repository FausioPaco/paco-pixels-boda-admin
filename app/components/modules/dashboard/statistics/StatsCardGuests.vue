<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';

defineOptions({ name: 'StatsCardGuests' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

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
  confirmed: '#22c55e',
  pending: '#f59e0b',
  declined: '#ef4444',
  primary: '#857526',
  label: 'rgba(0,0,0,0.65)',
  strong: 'rgba(0,0,0,0.85)',
});

onMounted(() => {
  palette.value = {
    confirmed: readTailwindColor('text-success-500') ?? palette.value.confirmed,
    pending: readTailwindColor('text-warning-500') ?? palette.value.pending,
    declined: readTailwindColor('text-danger-500') ?? palette.value.declined,
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    label: readTailwindColor('text-grey-600') ?? palette.value.label,
    strong: readTailwindColor('text-grey-900') ?? palette.value.strong,
  };
});

type GuestsStats = EventDashboardStats['guests'];

const guests = computed<GuestsStats | null>(() => props.stats?.guests ?? null);
const unitLabel = computed(() => 'Pessoas');

const totals = computed(() => {
  const g = guests.value;
  if (!g) return { total: 0, confirmed: 0, pending: 0, declined: 0, rate: 0 };

  return {
    total: g.peopleTotal ?? 0,
    confirmed: g.peopleConfirmed ?? 0,
    pending: g.peoplePending ?? 0,
    declined: g.peopleDeclined ?? 0,
    rate: g.peopleConfirmationRate ?? 0,
  };
});

const invites = computed(() => {
  const g = guests.value;
  if (!g) return { total: 0, rate: 0 };
  return {
    total: g.total ?? 0,
    rate: g.confirmationRate ?? 0,
  };
});

const labels = ['Confirmados', 'Pendentes', 'Recusaram'] as const;

const donutData = computed<ChartData<'doughnut'>>(() => ({
  labels: [...labels],
  datasets: [
    {
      data: [
        totals.value.confirmed,
        totals.value.pending,
        totals.value.declined,
      ],
      backgroundColor: [
        palette.value.confirmed,
        palette.value.pending,
        palette.value.declined,
      ],
      borderWidth: 0,
      hoverOffset: 2,
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
    ctx.font = '800 22px inherit';
    ctx.fillText(String(totals.value.total), cx, cy - 6);

    ctx.fillStyle = palette.value.label;
    ctx.font = '600 12px inherit';
    ctx.fillText(unitLabel.value, cx, cy + 14);

    ctx.restore();
  },
}));

const donutOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '74%',
  plugins: {
    tooltip: {
      callbacks: {
        label(context) {
          const v = Number(context.raw ?? 0);
          return `${context.label}: ${v} ${unitLabel.value.toLowerCase()}`;
        },
      },
    },
    datalabels: {
      display: (ctx) => Number(ctx.dataset.data[ctx.dataIndex] ?? 0) > 0,
      color: '#ffffff',
      font: { weight: 'bold', size: 11 },
      formatter: (value: unknown) => String(value ?? ''),
    },
  },
}));

const sparkLabels = computed(() => {
  const points = guests.value?.rsvpActivityTimeline ?? [];
  return points.map((p) => {
    const d = new Date(p.date);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  });
});

const sparkData = computed<ChartData<'line'>>(() => {
  const points = guests.value?.rsvpActivityTimeline ?? [];
  return {
    labels: sparkLabels.value,
    datasets: [
      {
        label: 'Actividade RSVP',
        data: points.map((p) => p.value),
        borderColor: palette.value.primary,
        backgroundColor: 'rgba(0,0,0,0.06)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
});

const sparkOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { display: false, grid: { display: false } },
    y: { display: false, grid: { display: false }, beginAtZero: true },
  },
  plugins: {
    tooltip: {
      callbacks: {
        title(items) {
          const label = items[0]?.label ?? '';
          return label;
        },
        label(item) {
          const v = Number(item.raw ?? 0);
          return `${v} respostas`;
        },
      },
    },
    datalabels: { display: false },
  },
  elements: {
    line: { borderJoinStyle: 'round' },
  },
}));
</script>

<template>
  <BaseCard title="Convidados">
    <div class="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div class="space-y-3">
        <div class="flex items-baseline justify-between">
          <p class="text-grey-900 text-sm font-semibold">
            {{ totals.total }} {{ unitLabel.toLowerCase() }}
          </p>
          <p class="text-grey-600 text-xs">{{ totals.rate }}% confirmados</p>
        </div>

        <div class="h-[190px]">
          <ClientOnly>
            <Doughnut
              :data="donutData"
              :options="donutOptions"
              :plugins="[centerTextPlugin]"
            />
          </ClientOnly>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-grey-50 rounded-xl px-2 py-2">
            <p class="text-grey-600 text-xs">Confirmados</p>
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.confirmed }}
            </p>
          </div>
          <div class="bg-grey-50 rounded-xl px-2 py-2">
            <p class="text-grey-600 text-xs">Pendentes</p>
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.pending }}
            </p>
          </div>
          <div class="bg-grey-50 rounded-xl px-2 py-2">
            <p class="text-grey-600 text-xs">Recusaram</p>
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.declined }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-baseline justify-between">
          <p class="text-grey-900 text-sm font-semibold">
            {{ invites.total }} convites
          </p>
          <p class="text-grey-600 text-xs">{{ invites.rate }}% confirmados</p>
        </div>

        <div class="h-[140px]">
          <ClientOnly>
            <Line :data="sparkData" :options="sparkOptions" />
          </ClientOnly>
        </div>

        <p class="text-grey-600 text-xs">Actividade RSVP (últimos dias)</p>
      </div>
    </div>
  </BaseCard>
</template>
