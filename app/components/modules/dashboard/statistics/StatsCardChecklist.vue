<script setup lang="ts">
defineOptions({ name: 'StatsCardChecklist' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const completion = computed(() => props.stats?.checklist?.completionRate ?? 0);
const series = computed(() => [Math.round(completion.value)]);

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
</script>

<template>
  <BaseCard title="Checklist">
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
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Total</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.total ?? 0
          }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Concluídas</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.done ?? 0
          }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Em atraso</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.overdue ?? 0
          }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">A vencer em breve</span>
          <span class="text-grey-900 font-semibold">{{
            props.stats?.checklist?.dueSoon ?? 0
          }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
