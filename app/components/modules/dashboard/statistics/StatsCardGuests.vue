<script setup lang="ts">
defineOptions({ name: 'StatsCardGuests' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const donutSeries = computed(() => {
  const g = props.stats?.guests;
  if (!g) return [0, 0, 0];
  return [g.confirmed ?? 0, g.pending ?? 0, g.declined ?? 0];
});

const labels = ['Confirmados', 'Pendentes', 'Recusaram'];

const donutOptions = computed(() => ({
  chart: {
    type: 'donut',
    toolbar: { show: false },
    animations: { enabled: true },
  },
  labels,
  legend: { show: false },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: '72%' } },
  },
}));

const sparklineSeries = computed(() => {
  const points = props.stats?.guests?.rsvpActivityTimeline ?? [];
  return [
    {
      name: 'Actividade RSVP',
      data: points.map((p) => ({
        x: new Date(p.date).getTime(),
        y: p.value,
      })),
    },
  ];
});

const sparklineOptions = computed(() => ({
  chart: {
    type: 'area',
    sparkline: { enabled: true },
    animations: { enabled: true },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 0.6, opacityFrom: 0.35, opacityTo: 0.05 },
  },
  xaxis: { type: 'datetime' },
  tooltip: { x: { format: 'dd MMM' } },
}));
</script>

<template>
  <BaseCard title="Convidados">
    <div class="space-y-4">
      <div class="grid items-center gap-4 sm:grid-cols-[160px_1fr]">
        <ClientOnly>
          <apexchart
            type="donut"
            height="160"
            :options="donutOptions"
            :series="donutSeries"
          />
        </ClientOnly>

        <div class="space-y-2">
          <div class="flex items-baseline justify-between">
            <p class="text-grey-900 text-sm font-semibold">
              {{ props.stats?.guests?.total ?? 0 }} total
            </p>
            <p class="text-grey-600 text-xs">
              {{ props.stats?.guests?.confirmationRate ?? 0 }}% confirmados
            </p>
          </div>

          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-grey-600">Confirmados</span>
              <span class="text-grey-900 font-semibold">{{
                props.stats?.guests?.confirmed ?? 0
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-grey-600">Pendentes</span>
              <span class="text-grey-900 font-semibold">{{
                props.stats?.guests?.pending ?? 0
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-grey-600">Recusaram</span>
              <span class="text-grey-900 font-semibold">{{
                props.stats?.guests?.declined ?? 0
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p class="text-grey-600 mb-2 text-xs">
          Actividade RSVP (últimos 30 dias)
        </p>
        <ClientOnly>
          <apexchart
            type="area"
            height="90"
            :options="sparklineOptions"
            :series="sparklineSeries"
          />
        </ClientOnly>
      </div>
    </div>
  </BaseCard>
</template>
