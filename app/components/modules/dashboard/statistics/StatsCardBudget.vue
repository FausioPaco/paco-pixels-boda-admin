<script setup lang="ts">
defineOptions({ name: 'StatsCardBudget' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const currency = computed(() => props.stats?.budget?.currency ?? 'MZN');

const consumptionPct = computed(() => {
  const b = props.stats?.budget;
  if (!b || !b.totalPlannedBudget) return 0;
  const pct = (b.totalActual / b.totalPlannedBudget) * 100;
  if (Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
});

const gaugeSeries = computed(() => [consumptionPct.value]);

const radialOptions = computed(() => ({
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
        value: { fontSize: '18px', fontWeight: 700, offsetY: 6 },
      },
    },
  },
  stroke: { lineCap: 'round' },
}));

const topCategories = computed(() => props.stats?.budget?.topCategories ?? []);

const barSeries = computed(() => [
  {
    name: 'Custo real',
    data: topCategories.value.map((c) => Math.round(c.actual ?? 0)),
  },
]);

const barOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    animations: { enabled: true },
  },
  plotOptions: { bar: { borderRadius: 10, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  xaxis: { categories: topCategories.value.map((c) => c.title) },
  grid: { strokeDashArray: 4 },
}));

const money = (v: number) => formatMoney(v ?? 0, currency.value);
</script>

<template>
  <BaseCard title="Orçamento">
    <div class="space-y-4">
      <div class="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
        <ClientOnly>
          <apexchart
            type="radialBar"
            height="150"
            :options="radialOptions"
            :series="gaugeSeries"
          />
        </ClientOnly>

        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Planeado</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalPlannedBudget ?? 0) }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Real</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalActual ?? 0) }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Pago</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalPaid ?? 0) }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-grey-600">Por pagar</span>
            <span class="text-grey-900 font-semibold">
              {{ money(props.stats?.budget?.totalUnpaid ?? 0) }}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p class="text-grey-600 mb-2 text-xs">Top categorias (custo real)</p>
        <ClientOnly>
          <apexchart
            type="bar"
            height="170"
            :options="barOptions"
            :series="barSeries"
          />
        </ClientOnly>
      </div>
    </div>
  </BaseCard>
</template>
