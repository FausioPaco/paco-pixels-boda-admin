import { getBeverageService } from '~/services/beverageService';

export const useEventBeverageEstimatesList = async (
  parameters: EventBeverageEstimatesParameters,
  opts?: { immediate?: boolean; cacheKey?: string },
) => {
  const nuxtApp = useNuxtApp();
  const service = getBeverageService(nuxtApp.$api);

  const cacheKey =
    opts?.cacheKey ??
    `event-beverage-estimates-${parameters.eventId}-${parameters.searchQuery ?? ''}-${parameters.categoryId ?? 'all'}-${parameters.includeConfirmed ?? false}-${parameters.pageNumber ?? 1}-${parameters.pageSize ?? 8}`;

  const estimates = useState<EventBeverageEstimate[]>(
    `${cacheKey}-list`,
    () => [],
  );

  const pagination = useState<PaginationData<EventBeverageEstimate> | null>(
    `${cacheKey}-pagination`,
    () => null,
  );

  const { data, pending, error, refresh } = await useAsyncData(
    cacheKey,
    async () => service.getEventBeverageEstimates(parameters),
    {
      immediate: opts?.immediate ?? true,
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          estimates: data,
          pagination: paginationData,
          fetchedAt: new Date(),
        };
      },
      getCachedData(key) {
        const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
        if (!cached) return;
        if (!cached.fetchedAt || cacheExpired(cached.fetchedAt, 10)) return;
        return cached;
      },
    },
  );

  watchEffect(() => {
    if (data.value) {
      estimates.value = data.value.estimates;
      pagination.value = data.value.pagination;
    }
  });

  const refreshEstimates = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(cacheKey);
    await refresh();
  };

  return {
    estimates,
    pagination,
    isRefreshing: pending,
    isError: computed(() => !!error.value),
    error,
    refreshEstimates,
  };
};
