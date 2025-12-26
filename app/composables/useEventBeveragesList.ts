import { getBeverageCatalogService } from '~/services/beverageService';

export const useEventBeveragesList = async (opts: {
  parameters?: Partial<Omit<EventBeveragesParameters, 'eventId'>>;
  immediate?: boolean;
  cacheKey?: string;
}) => {
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
  const service = getBeverageCatalogService(nuxtApp.$api);

  const parameters = ref<Omit<EventBeveragesParameters, 'eventId'>>({
    searchQuery: opts.parameters?.searchQuery ?? '',
    categoryId: opts.parameters?.categoryId ?? null,
    stockStatus: opts.parameters?.stockStatus ?? '',
    pageNumber: opts.parameters?.pageNumber ?? 1,
    pageSize: opts.parameters?.pageSize ?? 10,
    startDate: opts.parameters?.startDate ?? undefined,
    endDate: opts.parameters?.endDate ?? undefined,
  });

  const cacheKey = computed(
    () =>
      `event-beverages-${eventId}-${parameters.value.searchQuery ?? ''}-${parameters.value.categoryId ?? 'all'}-${parameters.value.stockStatus ?? 'all'}-${parameters.value.pageNumber}-${parameters.value.pageSize}`,
  );

  const { data, pending, error, refresh } = await useAsyncData(
    cacheKey,
    () =>
      service.getEventBeverages({
        eventId,
        ...parameters.value,
      }),
    {
      immediate: opts.immediate ?? true,
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

  const setSearchQuery = async (searchQuery: string) => {
    parameters.value.searchQuery = searchQuery;
    parameters.value.pageNumber = 1;
    await refresh();
  };

  const setCategoryId = async (categoryId: number | null) => {
    parameters.value.categoryId = categoryId;
    parameters.value.pageNumber = 1;
    await refresh();
  };

  const setStockStatus = async (
    stockStatus: EventBeveragesParameters['stockStatus'],
  ) => {
    parameters.value.stockStatus = stockStatus ?? '';
    parameters.value.pageNumber = 1;
    await refresh();
  };

  const setPage = async (pageNumber: number) => {
    parameters.value.pageNumber = pageNumber;
    await refresh();
  };

  return {
    parameters,
    beverages: eventBeverages,
    pagination,
    isLoading: pending,
    error,
    refreshEventBeverages,
    setSearchQuery,
    setCategoryId,
    setStockStatus,
    setPage,
  };
};
