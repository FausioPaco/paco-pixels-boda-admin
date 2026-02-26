<script setup lang="ts">
defineOptions({ name: 'StatsCardHealth' });

const props = defineProps<{
  stats: EventDashboardStats | null;
}>();

const score = computed(() => props.stats?.overview?.healthScore ?? 0);
const series = computed(() => [score.value]);

const operationalStatus = computed(
  () => props.stats?.overview?.operationalStatus ?? '—',
);

const budgetConsumption = computed(() => {
  const b = props.stats?.budget;
  if (!b || !b.totalPlannedBudget) return 0;
  const pct = (b.totalActual / b.totalPlannedBudget) * 100;
  if (Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
});

const options = computed(() => ({
  chart: {
    type: 'radialBar',
    toolbar: { show: false },
    animations: { enabled: true },
  },
  plotOptions: {
    radialBar: {
      hollow: { size: '70%' },
      dataLabels: {
        name: { show: false },
        value: { fontSize: '20px', fontWeight: 700, offsetY: 6 },
      },
    },
  },
  stroke: { lineCap: 'round' },
}));

const formatPct = (v: number) => `${Math.round(v)}%`;
</script>

<template>
  <BaseCard title="Saúde do evento">
    <div class="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <ClientOnly>
        <apexchart
          type="radialBar"
          height="180"
          :options="options"
          :series="series"
        />
      </ClientOnly>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-grey-900 text-sm font-semibold">Score</p>
          <span class="text-grey-600 text-xs">{{ operationalStatus }}</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-grey-600">RSVP</span>
            <span class="text-grey-900 font-semibold">
              {{ props.stats?.guests?.confirmationRate ?? 0 }}%
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-grey-600">Mesas</span>
            <span class="text-grey-900 font-semibold">
              {{ formatPct(props.stats?.seating?.occupancyRate ?? 0) }}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-grey-600">Checklist</span>
            <span class="text-grey-900 font-semibold">
              {{ formatPct(props.stats?.checklist?.completionRate ?? 0) }}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-grey-600">Orçamento</span>
            <span class="text-grey-900 font-semibold">
              {{ formatPct(budgetConsumption) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
