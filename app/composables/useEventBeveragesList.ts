import { getBeverageService } from '~/services/beverageService';

export const useEventBeveragesList = async (
  overrides?: EventBeveragesParameters,
) => {
  const eventBeverages = useState<EventBeverage[]>(
    'event-beverages-list',
    () => [],
  );
  const pagination = useState<PaginationData<EventBeverage> | null>(
    'event-beverages-pagination',
    () => null,
  );

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const nuxtApp = useNuxtApp();
  const service = getBeverageService(nuxtApp.$api);

  const queryParameters =
    (overrides as EventBeveragesParameters | undefined) ??
    reactive<EventBeveragesParameters>({
      searchQuery: '',
      categoryId: null,
      stockStatus: '',
      pageNumber: 1,
      pageSize: 10,
      eventId,
    });

  const cacheKey = computed(
    () =>
      `event-beverages-${eventId}-${queryParameters.searchQuery ?? ''}-${queryParameters.categoryId ?? 'all'}-${queryParameters.stockStatus ?? 'all'}-${queryParameters.pageNumber}-${queryParameters.pageSize}`,
  );

  const { data, pending, error, refresh } = await useAsyncData(
    cacheKey,
    () =>
      service.getEventBeverages({
        eventId,
        ...toRaw(queryParameters),
      }),
    {
      immediate: true,
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          eventBeverages: data,
          pagination: paginationData,
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
    if (data.value) {
      eventBeverages.value = data.value.eventBeverages;
      pagination.value = data.value.pagination;
    }
  });

  const refreshEventBeverages = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(cacheKey.value);
    }
    await refresh();
  };

  return {
    beverages: eventBeverages,
    pagination,
    isRefreshing: pending,
    isError: error,
    refreshEventBeverages,
  };
};
