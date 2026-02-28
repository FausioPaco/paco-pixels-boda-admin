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

const available = computed(() => Math.max(0, capacity.value - assigned.value));

const occupancyStatus = computed(() => {
  if (capacity.value === 0) return 'Sem capacidade definida';
  if (assigned.value === 0) return 'Ainda não começaste a atribuir lugares';
  if (pct.value < 60) return 'Distribuição em progresso';
  if (pct.value < 90) return 'Boa distribuição';
  return 'Capacidade quase no limite';
});

const goUnassigned = () => {
  emit('navigate', `/admin/mesas`);
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
  primaryLight: '#DAD3AB',
  track: 'rgba(0,0,0,0.08)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    track:
      readTailwindColor('bg-grey-100/50', 'backgroundColor') ??
      palette.value.track,
    primaryLight:
      readTailwindColor('text-primary-50') ?? palette.value.primaryLight,
  };
});

const hasUnassigned = computed(() => unassigned.value > 0);

const helperText = computed(() => {
  if (capacity.value === 0)
    return 'Define a capacidade das mesas para veres a ocupação.';
  if (hasUnassigned.value)
    return `${unassigned.value} convidado(s) ainda sem mesa — atribui para evitar stress na véspera.`;
  if (assigned.value === 0)
    return 'Começa por atribuir alguns convidados para veres a distribuição.';
  return 'Ideal: manter a capacidade equilibrada e evitar mesas sobrelotadas.';
});
</script>

<template>
  <BaseCard title="Mesas e lugares">
    <div class="space-y-4">
      <!-- KPIs compactos (menos altura, mais “dashboard feel”) -->
      <div class="flex flex-col gap-4">
        <div class="bg-grey-50 rounded-2xl px-3 py-2">
          <p class="text-grey-600 text-[11px]">Mesas</p>
          <p class="text-grey-900 text-base font-semibold leading-tight">
            {{ tables }}
          </p>
        </div>

        <div class="bg-grey-50 rounded-2xl px-3 py-2">
          <p class="text-grey-600 text-[11px]">Capacidade</p>
          <p class="text-grey-900 text-base font-semibold leading-tight">
            {{ capacity }}
          </p>
        </div>

        <div class="bg-grey-50 rounded-2xl px-3 py-2">
          <p class="text-grey-600 text-[11px]">Atribuídos</p>
          <p class="text-grey-900 text-base font-semibold leading-tight">
            {{ assigned }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-2xl px-3 py-2 text-left transition"
          :class="
            hasUnassigned ? 'bg-warning-50 hover:bg-warning-100' : 'bg-grey-50'
          "
          @click="hasUnassigned ? goUnassigned() : undefined"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p
                class="text-[11px]"
                :class="hasUnassigned ? 'text-warning-700' : 'text-grey-600'"
              >
                Sem mesa
              </p>

              <p
                class="text-base font-semibold leading-tight"
                :class="hasUnassigned ? 'text-warning-900' : 'text-grey-900'"
              >
                {{ unassigned }}
              </p>

              <p
                v-if="hasUnassigned"
                class="text-warning-700 mt-0.5 text-[10px]"
              >
                {{
                  unassigned === 1
                    ? 'convidado pendente'
                    : 'convidados pendentes'
                }}
              </p>
            </div>

            <span
              v-if="hasUnassigned"
              class="text-warning-700 mt-0.5 text-[11px] font-semibold"
            >
              Ver →
            </span>
          </div>
        </button>
      </div>

      <!-- Bloco “hero” de ocupação para preencher bem o espaço -->
      <div class="bg-grey-50 rounded-2xl p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-grey-900 text-xs font-semibold">Ocupação</p>
            <p class="text-grey-600 mt-0.5 text-[11px]">
              {{ assigned }} / {{ capacity }}
              <span class="text-grey-400 font-medium">· {{ pct }}%</span>
            </p>
          </div>

          <!-- Badge de status -->
          <span
            class="rounded-full border px-2 py-1 text-[11px] font-semibold"
            :class="
              pct < 10
                ? 'text-grey-600 bg-white'
                : pct < 70
                  ? 'border-primary-700 text-primary-700'
                  : pct < 90
                    ? 'border-warning-700 text-warning-700'
                    : 'border-danger-700 text-danger-700'
            "
          >
            {{ occupancyStatus }}
          </span>
        </div>

        <!-- barra -->
        <div
          class="mt-3 h-2.5 w-full rounded-full"
          :style="{ backgroundColor: palette.track }"
        >
          <div
            class="h-2.5 rounded-full transition-all"
            :style="{ width: pct + '%', backgroundColor: palette.primary }"
          ></div>
        </div>

        <!-- linha de “disponíveis” e “insight” -->
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <div
            class="flex flex-col justify-center rounded-2xl bg-white px-3 py-2"
          >
            <p class="text-grey-600 text-[11px]">Disponíveis</p>
            <p class="text-primary-700 text-sm font-semibold">
              {{ available }}
              <span class="text-primary-700 font-medium">
                {{ available === 1 ? 'lugar' : 'lugares' }}
              </span>
            </p>
          </div>

          <div
            class="rounded-2xl px-3 py-2"
            :class="
              hasUnassigned
                ? 'bg-warning-50'
                : assigned === 0
                  ? 'bg-white'
                  : 'bg-white'
            "
          >
            <div class="text-grey-400 flex flex-wrap items-end gap-1 font-bold">
              <IconLightbulb :font-controlled="false" class="size-4" />
              <p class="text-[11px] leading-none">Nota</p>
            </div>
            <p class="text-grey-900 mt-1 text-[11px] font-semibold">
              {{ helperText }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
