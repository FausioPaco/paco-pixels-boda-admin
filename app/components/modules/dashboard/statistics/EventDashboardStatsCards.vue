<script setup lang="ts">
defineOptions({ name: 'EventDashboardStatsCards' });

const { dashboardStats, isRefreshing, isError, refreshDashboardStats } =
  await useEventDashboardStats({
    range: 'last30Days',
  });

const stats = computed<EventDashboardStats | null>(() => dashboardStats.value);

const onRefresh = async (force = false) => {
  await refreshDashboardStats({ force });
};

const onNavigate = async (route: string) => {
  if (!route) return;
  await navigateTo(route);
};
</script>

<template>
  <div class="mt-6 space-y-6">
    <!-- erro geral -->
    <div v-if="isError" class="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-red-700">
            Não foi possível carregar as estatísticas
          </p>
          <p class="text-xs text-red-700/70">Tenta novamente.</p>
        </div>
        <BaseButton
          btn-type="outline-primary"
          size="sm"
          @click="onRefresh(true)"
        >
          Recarregar
        </BaseButton>
      </div>
    </div>

    <!-- Linha 1 -->
    <div class="grid gap-6 lg:grid-cols-2">
      <StatsCardAttention
        :stats="stats"
        :is-refreshing="isRefreshing"
        @refresh="onRefresh(true)"
        @navigate="onNavigate"
      />

      <StatsCardHealth :stats="stats" />
    </div>

    <!-- Linha 2 -->
    <div class="grid gap-6 lg:grid-cols-3">
      <StatsCardGuests :stats="stats" />
      <StatsCardBudget :stats="stats" />
      <StatsCardSeating :stats="stats" @navigate="onNavigate" />
    </div>

    <!-- Linha 3 -->
    <div class="grid gap-6 lg:grid-cols-2">
      <StatsCardSuppliers :stats="stats" />
      <StatsCardChecklist :stats="stats" />
    </div>
  </div>
</template>
