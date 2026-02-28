<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

defineOptions({ name: 'StatsCardHealth' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const score = computed(() =>
  Math.max(
    0,
    Math.min(100, Math.round(props.stats?.overview?.healthScore ?? 0)),
  ),
);

const operationalStatus = computed(
  () => props.stats?.overview?.operationalStatus ?? '—',
);

const rsvp = computed(() =>
  Math.round(props.stats?.guests?.confirmationRate ?? 0),
);
const seating = computed(() =>
  Math.round(props.stats?.seating?.occupancyRate ?? 0),
);
const checklist = computed(() =>
  Math.round(props.stats?.checklist?.completionRate ?? 0),
);

const budgetConsumption = computed(() => {
  const b = props.stats?.budget;
  const planned = b?.totalPlannedBudget ?? 0;
  const actual = b?.totalActual ?? 0;

  if (!planned) return 0;
  const pct = (actual / planned) * 100;
  if (Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
});

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
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    textStrong: readTailwindColor('text-grey-900') ?? palette.value.textStrong,
    textMuted: readTailwindColor('text-grey-600') ?? palette.value.textMuted,
  };
});

const gaugeData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['Score', '—'],
  datasets: [
    {
      data: [score.value, Math.max(0, 100 - score.value)],
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
    ctx.fillText(`${score.value}%`, cx, cy - 2);

    ctx.fillStyle = palette.value.textMuted;
    ctx.font = '600 11px inherit';
    ctx.fillText('Score', cx, cy + 16);

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

const rows = computed(() => [
  { label: 'RSVP', value: rsvp.value },
  { label: 'Mesas', value: seating.value },
  { label: 'Checklist', value: checklist.value },
  { label: 'Orçamento', value: budgetConsumption.value },
]);

const badge = computed(() => {
  const v = score.value;
  if (v >= 85)
    return {
      text: 'Excelente',
      cls: 'bg-success-50 text-success-700 border-success-200',
    };
  if (v >= 70)
    return {
      text: 'Bom',
      cls: 'bg-primary-50 text-primary-700 border-primary-200',
    };
  if (v >= 50)
    return {
      text: 'Atenção',
      cls: 'bg-warning-50 text-warning-700 border-warning-200',
    };
  return {
    text: 'Crítico',
    cls: 'bg-danger-50 text-danger-700 border-danger-200',
  };
});
</script>

<template>
  <BaseCard title="Saúde do evento">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold"
            :class="badge.cls"
          >
            {{ badge.text }}
          </span>
          <span class="text-grey-600 text-[11px]">{{ operationalStatus }}</span>
        </div>
        <p class="text-grey-600 text-[11px]">visão geral</p>
      </div>

      <div class="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
        <div class="bg-grey-50 rounded-2xl p-3">
          <div class="h-[140px]">
            <ClientOnly>
              <Doughnut
                :data="gaugeData"
                :options="gaugeOptions"
                :plugins="[centerTextPlugin]"
              />
            </ClientOnly>
          </div>
        </div>

        <div class="border-grey-100 rounded-2xl border bg-white p-3">
          <div class="grid gap-2">
            <div
              v-for="r in rows"
              :key="r.label"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :style="{ backgroundColor: palette.primary }"
                ></span>
                <p class="text-grey-600 text-xs">{{ r.label }}</p>
              </div>

              <p class="text-grey-900 text-xs font-semibold">{{ r.value }}%</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-grey-50 rounded-2xl px-3 py-2">
        <p class="text-grey-600 text-[11px]">Dica</p>
        <p class="text-grey-900 text-[11px] font-semibold">
          Acompanha RSVP e orçamento semanalmente para manter o evento
          “saudável”.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
