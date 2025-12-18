import { getBudgetService } from '~/services/budgetService';

export const useBudget = async (eventId: number) => {
  const budget = useState<Budget | null>(
    `budget-by-event:${eventId}`,
    () => null,
  );

  const nuxtApp = useNuxtApp();
  const key = `get-budget-by-event-${eventId}`;

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getBudgetService(nuxtApp.$api).getByEvent(eventId),
    {
      default: () => null,
      transform(input) {
        return {
          ...input,
          fetchedAt: new Date(),
        };
      },
      getCachedData(key) {
        const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
        if (!cached) return;
        if (!cached.fetchedAt || cacheExpired(cached.fetchedAt, 20)) return;
        return cached;
      },
    },
  );

  watchEffect(() => {
    if (data.value) budget.value = data.value;
  });

  const refreshBudget = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key);
    await refresh();
  };

  return {
    budget,
    isRefreshing: status.value === 'pending',
    refreshBudget,
  };
};
