<script setup lang="ts">
defineOptions({ name: 'StatsCardSeating' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const emit = defineEmits<{
  (e: 'navigate', route: string): void;
}>();

const seating = computed(() => props.stats?.seating);

const occupancy = computed(() => seating.value?.occupancyRate ?? 0);

const pct = computed(() => Math.min(100, Math.max(0, occupancy.value)));

const goUnassigned = () => {
  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();
  emit('navigate', `/eventos/${eventId}/mesas?filter=unassigned`);
};
</script>

<template>
  <BaseCard title="Mesas e lugares">
    <div class="space-y-4">
      <div class="flex items-baseline justify-between">
        <p class="text-grey-900 text-sm font-semibold">
          {{ seating?.tablesCount ?? 0 }} mesas
        </p>
        <p class="text-grey-600 text-xs">
          Capacidade: {{ seating?.seatsCapacity ?? 0 }}
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-grey-600">Atribuídos</span>
          <span class="text-grey-900 font-semibold">{{
            seating?.assignedGuests ?? 0
          }}</span>
        </div>

        <div class="flex items-center justify-between text-xs">
          <span class="text-grey-600">Sem mesa</span>
          <button
            type="button"
            class="text-grey-900 font-semibold hover:underline"
            @click="goUnassigned"
          >
            {{ seating?.unassignedGuests ?? 0 }}
          </button>
        </div>

        <div class="mt-3">
          <div class="mb-1 flex justify-between text-xs">
            <span class="text-grey-600">Ocupação</span>
            <span class="text-grey-900 font-semibold"
              >{{ Math.round(pct) }}%</span
            >
          </div>

          <div class="bg-grey-100 h-2 w-full rounded-full">
            <div
              class="bg-primary-600 h-2 rounded-full transition-all"
              :style="{ width: `${pct}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
