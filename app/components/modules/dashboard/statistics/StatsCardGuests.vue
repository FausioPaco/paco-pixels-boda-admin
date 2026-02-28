<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';

defineOptions({ name: 'StatsCardGuests' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

/** -----------------------------
 * Tailwind colors (no hardcode)
 * ------------------------------ */
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
  confirmed: '#22c55e',
  pending: '#f59e0b',
  declined: '#ef4444',
  track: 'rgba(0,0,0,0.08)',
  textStrong: 'rgba(0,0,0,0.85)',
  textMuted: 'rgba(0,0,0,0.65)',
  grid: 'rgba(0,0,0,0.06)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    confirmed: readTailwindColor('text-success-500') ?? palette.value.confirmed,
    pending: readTailwindColor('text-warning-500') ?? palette.value.pending,
    declined: readTailwindColor('text-danger-500') ?? palette.value.declined,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    textStrong: readTailwindColor('text-grey-900') ?? palette.value.textStrong,
    textMuted: readTailwindColor('text-grey-600') ?? palette.value.textMuted,
    grid: palette.value.grid,
  };
});

/** -----------------------------
 * Data
 * ------------------------------ */
type GuestsStats = EventDashboardStats['guests'];

const guests = computed<GuestsStats | null>(() => props.stats?.guests ?? null);

const totals = computed(() => {
  const g = guests.value;
  return {
    peopleTotal: g?.peopleTotal ?? 0,
    peopleConfirmed: g?.peopleConfirmed ?? 0,
    peoplePending: g?.peoplePending ?? 0,
    peopleDeclined: g?.peopleDeclined ?? 0,
    peopleConfirmationRate: g?.peopleConfirmationRate ?? 0,
    invitesTotal: g?.total ?? 0,
    invitesRate: g?.confirmationRate ?? 0,
    timeline: g?.rsvpActivityTimeline ?? [],
  };
});

const donutLabels = ['Confirmados', 'Pendentes', 'Recusaram'] as const;

const donutData = computed<ChartData<'doughnut'>>(() => ({
  labels: [...donutLabels],
  datasets: [
    {
      data: [
        totals.value.peopleConfirmed,
        totals.value.peoplePending,
        totals.value.peopleDeclined,
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

    ctx.fillStyle = palette.value.textStrong;
    ctx.font = '800 22px inherit';
    ctx.fillText(String(totals.value.peopleTotal), cx, cy - 6);

    ctx.fillStyle = palette.value.textMuted;
    ctx.font = '600 12px inherit';
    ctx.fillText('Pessoas', cx, cy + 14);

    ctx.restore();
  },
}));

const donutOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '76%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(context) {
          const v = Number(context.raw ?? 0);
          return `${context.label}: ${v}`;
        },
      },
    },
    datalabels: {
      display: (ctx) => Number(ctx.dataset.data[ctx.dataIndex] ?? 0) > 0,
      color: '#ffffff',
      font: { weight: 'bold', size: 11 },
      formatter: (value: unknown) => String(value ?? ''),
      clip: true,
    },
  },
}));

/** Sparkline */
const sparkLabels = computed(() => {
  return totals.value.timeline.map((p) => {
    const d = new Date(p.date);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  });
});

const sparkData = computed<ChartData<'line'>>(() => ({
  labels: sparkLabels.value,
  datasets: [
    {
      label: 'Actividade RSVP',
      data: totals.value.timeline.map((p) => p.value),
      borderColor: palette.value.primary,
      backgroundColor: 'rgba(0,0,0,0.05)',
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
}));

const sparkOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { display: false, grid: { display: false } },
    y: { display: false, grid: { display: false }, beginAtZero: true },
  },
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        label(item) {
          const v = Number(item.raw ?? 0);
          return `${v} respostas`;
        },
      },
    },
  },
}));

const isEmpty = computed(() => totals.value.peopleTotal === 0);
</script>

<template>
  <BaseCard title="Convidados">
    <div class="space-y-4">
      <!-- top metrics -->
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          class="bg-grey-50 flex items-center justify-between rounded-2xl px-3 py-2"
        >
          <div class="flex items-center gap-2">
            <span
              class="h-2 w-2 rounded-full"
              :style="{ backgroundColor: palette.primary }"
            ></span>
            <p class="text-grey-600 text-xs">Pessoas</p>
          </div>
          <div class="text-right">
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.peopleTotal }}
            </p>
            <p class="text-grey-600 text-[11px]">
              {{ totals.peopleConfirmationRate }}% confirmados
            </p>
          </div>
        </div>

        <div
          class="bg-grey-50 flex items-center justify-between rounded-2xl px-3 py-2"
        >
          <div class="flex items-center gap-2">
            <span
              class="h-2 w-2 rounded-full"
              :style="{ backgroundColor: palette.primary }"
            ></span>
            <p class="text-grey-600 text-xs">Convites</p>
          </div>
          <div class="text-right">
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.invitesTotal }}
            </p>
            <p class="text-grey-600 text-[11px]">
              {{ totals.invitesRate }}% confirmados
            </p>
          </div>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-[220px_1fr]">
        <!-- donut -->
        <div class="relative">
          <div class="h-[200px]">
            <ClientOnly>
              <Doughnut
                :data="donutData"
                :options="donutOptions"
                :plugins="[centerTextPlugin]"
              />
            </ClientOnly>
          </div>

          <!-- legend pills -->
          <div class="mt-3 grid grid-cols-3 gap-2">
            <div class="bg-grey-50 rounded-2xl px-2 py-2 text-center">
              <div class="flex items-center justify-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: palette.confirmed }"
                ></span>
                <p class="text-grey-600 text-[11px]">Confirmados</p>
              </div>
              <p class="text-grey-900 text-sm font-semibold">
                {{ totals.peopleConfirmed }}
              </p>
            </div>
            <div class="bg-grey-50 rounded-2xl px-2 py-2 text-center">
              <div class="flex items-center justify-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: palette.pending }"
                ></span>
                <p class="text-grey-600 text-[11px]">Pendentes</p>
              </div>
              <p class="text-grey-900 text-sm font-semibold">
                {{ totals.peoplePending }}
              </p>
            </div>
            <div class="bg-grey-50 rounded-2xl px-2 py-2 text-center">
              <div class="flex items-center justify-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: palette.declined }"
                ></span>
                <p class="text-grey-600 text-[11px]">Recusaram</p>
              </div>
              <p class="text-grey-900 text-sm font-semibold">
                {{ totals.peopleDeclined }}
              </p>
            </div>
          </div>
        </div>

        <!-- sparkline / empty state -->
        <div class="flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <p class="text-grey-900 text-xs font-semibold">Actividade RSVP</p>
            <p class="text-grey-600 text-[11px]">últimos dias</p>
          </div>

          <div class="mt-2 h-[150px]">
            <div
              v-if="isEmpty || totals.timeline.length === 0"
              class="border-grey-200 bg-grey-50 flex h-full items-center justify-center rounded-2xl border border-dashed"
            >
              <p class="text-grey-600 text-xs">
                Sem actividade ainda — quando houver respostas, vais ver a
                tendência aqui.
              </p>
            </div>

            <ClientOnly v-else>
              <Line :data="sparkData" :options="sparkOptions" />
            </ClientOnly>
          </div>

          <div
            class="bg-grey-50 mt-3 flex items-center justify-between rounded-2xl px-3 py-2"
          >
            <p class="text-grey-600 text-[11px]">Sugestão</p>
            <p class="text-grey-900 text-[11px] font-semibold">
              Partilha o link RSVP com os convidados.
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
