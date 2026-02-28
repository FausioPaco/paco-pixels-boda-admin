<script setup lang="ts">
defineOptions({ name: 'StatsCardSeating' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

const emit = defineEmits<{
  (e: 'navigate', route: string): void;
}>();

const seating = computed(() => props.stats?.seating);

const tables = computed(() => seating.value?.tablesCount ?? 0);
const capacity = computed(() => seating.value?.seatsCapacity ?? 0);
const assigned = computed(() => seating.value?.assignedGuests ?? 0);
const unassigned = computed(() => seating.value?.unassignedGuests ?? 0);

const occupancy = computed(() => seating.value?.occupancyRate ?? 0);
const pct = computed(() =>
  Math.min(100, Math.max(0, Math.round(occupancy.value))),
);

const goUnassigned = () => {
  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();
  emit('navigate', `/eventos/${eventId}/mesas?filter=unassigned`);
};

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
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
  };
});

const hasUnassigned = computed(() => unassigned.value > 0);
</script>

<template>
  <BaseCard title="Mesas e lugares">
    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
          <p class="text-grey-600 text-[11px]">Mesas</p>
          <p class="text-grey-900 text-sm font-semibold">{{ tables }}</p>
        </div>

        <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
          <p class="text-grey-600 text-[11px]">Capacidade</p>
          <p class="text-grey-900 text-sm font-semibold">{{ capacity }}</p>
        </div>

        <div class="border-grey-100 rounded-2xl border bg-white px-3 py-2">
          <p class="text-grey-600 text-[11px]">Atribuídos</p>
          <p class="text-grey-900 text-sm font-semibold">{{ assigned }}</p>
        </div>

        <button
          type="button"
          class="rounded-2xl border px-3 py-2 text-left transition"
          :class="
            hasUnassigned
              ? 'border-warning-200 bg-warning-50 hover:bg-warning-100'
              : 'border-grey-100 bg-white'
          "
          @click="hasUnassigned ? goUnassigned() : undefined"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-[11px]"
                :class="hasUnassigned ? 'text-warning-700' : 'text-grey-600'"
              >
                Sem mesa
              </p>
              <p
                class="text-sm font-semibold"
                :class="hasUnassigned ? 'text-warning-900' : 'text-grey-900'"
              >
                {{ unassigned }}
              </p>
            </div>

            <span
              v-if="hasUnassigned"
              class="text-warning-700 text-[11px] font-semibold"
            >
              Ver →
            </span>
          </div>
        </button>
      </div>

      <div class="bg-grey-50 rounded-2xl px-3 py-3">
        <div class="flex items-center justify-between">
          <p class="text-grey-900 text-xs font-semibold">Ocupação</p>
          <p class="text-grey-900 text-xs font-semibold">{{ pct }}%</p>
        </div>

        <div
          class="mt-2 h-2.5 w-full rounded-full"
          :style="{ backgroundColor: palette.track }"
        >
          <div
            class="h-2.5 rounded-full"
            :style="{ width: pct + '%', backgroundColor: palette.primary }"
          ></div>
        </div>

        <p class="text-grey-600 mt-2 text-[11px]">
          Ideal: atribuir todos os convidados e manter a capacidade equilibrada.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
