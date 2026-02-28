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
    ctx.font = "800 22px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(String(totals.value.peopleTotal), cx, cy - 6);

    ctx.fillStyle = palette.value.textMuted;
    ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
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

const sparkPoints = computed<(number | null)[]>(() => {
  return totals.value.timeline.map((p) =>
    typeof p.value === 'number' ? p.value : null,
  );
});

const sparkData = computed<ChartData<'line', (number | null)[]>>(() => {
  const pts = sparkPoints.value;

  const data: (number | null)[] =
    pts.length === 0
      ? []
      : pts.length === 1
        ? [pts[0] ?? null, pts[0] ?? null]
        : pts;

  return {
    labels: sparkLabels.value,
    datasets: [
      {
        label: 'Actividade RSVP',
        data,
        borderColor: palette.value.primary,
        backgroundColor: 'rgba(0,0,0,0.05)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };
});

const sparkOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,

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
      bodyFont: {
        size: 8,
      },
      titleFont: {
        size: 8,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        font: {
          size: 9,
        },
      },
    },
    y: {
      ticks: {
        font: {
          size: 9,
        },
      },
    },
  },

  elements: {
    point: { radius: 0, hitRadius: 8 },
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
            <p class="text-grey-600 text-xs font-semibold">Pessoas</p>
          </div>
          <div class="text-right">
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.peopleTotal }}
            </p>
            <p class="text-grey-400 text-[11px] font-medium">
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
            <p class="text-grey-600 text-xs font-semibold">Convites</p>
          </div>
          <div class="text-right">
            <p class="text-grey-900 text-sm font-semibold">
              {{ totals.invitesTotal }}
            </p>
            <p class="text-grey-400 text-[11px] font-medium">
              {{ totals.invitesRate }}% confirmados
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- donut -->
        <div class="relative">
          <div class="h-[220px]">
            <ClientOnly>
              <Doughnut
                :data="donutData"
                :options="donutOptions"
                :plugins="[centerTextPlugin]"
              />
            </ClientOnly>
          </div>

          <!-- legend pills -->
          <div class="mt-3 flex flex-col gap-2">
            <!-- Confirmados -->
            <div class="rounded-2xl bg-gray-50 px-2 py-2">
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: palette.confirmed }"
                ></span>
                <p class="text-grey-600 text-[11px] font-medium">
                  Confirmados :
                  <span class="text-success-800">{{
                    totals.peopleConfirmed
                  }}</span>
                </p>
              </div>
            </div>

            <!-- Pendentes -->
            <div class="rounded-2xl bg-gray-50 px-2 py-2">
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: palette.pending }"
                ></span>
                <p class="text-grey-600 text-[11px] font-medium">
                  Pendentes :
                  <span class="text-warning-800">{{
                    totals.peoplePending
                  }}</span>
                </p>
              </div>
            </div>

            <!-- Recusaram -->
            <div class="rounded-2xl bg-gray-50 px-2 py-2">
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: palette.declined }"
                ></span>
                <p class="text-grey-600 text-[11px] font-medium">
                  Recusaram :
                  <span class="text-danger-800">{{
                    totals.peopleDeclined
                  }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- sparkline / empty state -->
        <div class="flex flex-col flex-wrap justify-start">
          <div class="flex w-full flex-wrap items-center justify-between gap-2">
            <p class="text-grey-900 text-xs font-semibold">Actividade RSVP</p>
            <p class="text-grey-400 text-sm font-medium">últimos dias</p>
          </div>

          <div class="mt-8 h-[220px]">
            <div
              v-if="isEmpty || totals.timeline.length === 0"
              class="border-grey-100 bg-grey-50 flex h-full animate-fadeIn flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center"
            >
              <IconLineChart
                :font-controlled="false"
                class="text-grey-300 size-[40px]"
              />

              <p class="text-grey-400 text-xs font-medium">
                Sem actividade ainda — quando houver respostas, vais ver a
                tendência aqui.
              </p>
            </div>

            <div v-else class="h-[180px]">
              <div class="h-full w-full">
                <ClientOnly>
                  <Line
                    :data="sparkData"
                    :options="sparkOptions"
                    class="h-full w-full"
                  />
                </ClientOnly>
              </div>
            </div>
          </div>

          <div
            class="bg-grey-50 mt-auto flex w-full flex-wrap items-center justify-between rounded-2xl px-3 py-2"
          >
            <div class="text-grey-400 flex flex-wrap items-end gap-1 font-bold">
              <IconLightbulb :font-controlled="false" class="size-4" />
              <p class="text-[11px] leading-none">Sugestão</p>
            </div>
            <p class="text-grey-900 mt-1 text-[11px] font-semibold">
              Efectuar a confirmação dos convidados
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
