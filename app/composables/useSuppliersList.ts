import { getSupplierService } from '~/services/supplierService';

export const useSuppliersList = async (
  overrides?: SupplierParameters | undefined,
) => {
  const suppliers = useState<Supplier[]>('suppliers-list', () => []);
  const pagination = useState<PaginationData<Supplier> | null>(
    'suppliers-pagination',
    () => null,
  );

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const queryParameters =
    (overrides as SupplierParameters | undefined) ??
    reactive<SupplierParameters>({
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
      'suppliers-list',
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
      getSupplierService(nuxtApp.$api).getAllSuppliers(toRaw(queryParameters)),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          list: data,
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
    if (!data.value) return;
    suppliers.value = data.value.list;
    pagination.value = data.value.pagination;
  });

  const refreshSuppliers = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key.value);
    await refresh();
  };

  return {
    suppliers,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshSuppliers,
  };
};
