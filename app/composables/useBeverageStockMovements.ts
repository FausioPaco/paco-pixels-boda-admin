import { getBeverageService } from '~/services/beverageService';

export const useBeverageStockMovements = async (
  overrides?: BeverageStockReportParameters | undefined,
) => {
  const stockMovements = useState<StockMovement[]>(
    'beverage-stock-movements-list',
    () => [],
  );
  const pagination = useState<PaginationData<StockMovement> | null>(
    'stock-movements-pagination',
    () => null,
  );

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const queryParameters =
    (overrides as BeverageStockReportParameters | undefined) ??
    reactive<BeverageStockReportParameters>({
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
      eventId,
    });

  queryParameters.eventId = eventId;

  const nuxtApp = useNuxtApp();
  const key = computed(() =>
    [
      'beverage-stock-movements-list',
      queryParameters.eventId,
      queryParameters.searchQuery,
      queryParameters.startDate,
      queryParameters.endDate,
      queryParameters.pageNumber,
      queryParameters.pageSize,
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getBeverageService(nuxtApp.$api).getStockMovements(
        eventId,
        toRaw(queryParameters),
      ),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          stockMovements: data,
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
      stockMovements.value = data.value.stockMovements;
      pagination.value = data.value.pagination;
    }
  });

  return {
    stockMovements,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshStockMovements: refresh,
  };
};
