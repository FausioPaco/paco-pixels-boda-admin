<script setup lang="ts">
defineOptions({ name: 'StatsCardAttention' });

const props = defineProps<{
  stats: EventDashboardStats | null;
  isRefreshing?: boolean;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'navigate', route: string): void;
}>();

const attention = computed<AttentionItem[]>(() => props.stats?.attention ?? []);

const totalAlerts = computed(
  () => props.stats?.overview?.attentionItemsCount ?? 0,
);
const statusLabel = computed(
  () => props.stats?.overview?.operationalStatus ?? '—',
);

const goTo = (route: string) => emit('navigate', route);
</script>

<template>
  <BaseCard title="Precisa atenção">
    <template #right-content>
      <button
        type="button"
        class="text-primary-700 text-xs font-medium hover:underline"
        @click.prevent="emit('refresh')"
      >
        Actualizar
      </button>
    </template>

    <div v-if="!stats && isRefreshing" class="text-grey-600 text-sm">
      A carregar…
    </div>

    <div v-else class="space-y-3">
      <div class="flex items-baseline justify-between">
        <p class="text-grey-900 text-sm font-semibold">
          {{ totalAlerts }} alertas
        </p>
        <p class="text-grey-600 text-xs">{{ statusLabel }}</p>
      </div>

      <div v-if="!attention.length" class="text-grey-600 text-sm">
        Está tudo sob controlo ✅
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="item in attention"
          :key="item.key"
          class="hover:bg-grey-50 flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
          @click="goTo(item.route)"
        >
          <div class="min-w-0">
            <p class="text-grey-900 truncate text-sm font-medium">
              {{ item.title }}
            </p>
            <p class="text-grey-600 text-xs">Clique para resolver</p>
          </div>

          <span
            class="rounded-full px-2 py-1 text-xs font-semibold"
            :class="{
              'bg-red-100 text-red-700': item.severity === 'danger',
              'bg-yellow-100 text-yellow-800': item.severity === 'warning',
              'bg-grey-100 text-grey-700': item.severity === 'info',
            }"
          >
            {{ item.count }}
          </span>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
