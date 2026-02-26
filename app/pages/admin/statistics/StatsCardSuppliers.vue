<script setup lang="ts">
defineOptions({ name: 'StatsCardSuppliers' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const series = computed(() => {
  const s = props.stats?.suppliers;
  if (!s) return [{ name: 'Fornecedores', data: [0, 0, 0] }];

  return [
    {
      name: 'Fornecedores',
      data: [s.confirmed ?? 0, s.pending ?? 0, s.absent ?? 0],
    },
  ];
});

const categories = ['Confirmados', 'Pendentes', 'Ausentes'];

const options = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    animations: { enabled: true },
  },
  plotOptions: {
    bar: { borderRadius: 10, horizontal: true, barHeight: '55%' },
  },
  dataLabels: { enabled: false },
  xaxis: { categories },
  grid: { strokeDashArray: 4 },
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

      <ClientOnly>
        <apexchart
          type="bar"
          height="220"
          :options="options"
          :series="series"
        />
      </ClientOnly>
    </div>
  </BaseCard>
</template>
