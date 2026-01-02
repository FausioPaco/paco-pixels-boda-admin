import { getSupplierService } from '~/services/supplierService';

export const useSupplierCatalogList = async (
  overrides?: SupplierCatalogParameters | undefined,
) => {
  const catalogItems = useState<SupplierCatalogItem[]>(
    'supplier-catalog-list',
    () => [],
  );

  const pagination = useState<PaginationData<SupplierCatalogItem> | null>(
    'supplier-catalog-pagination',
    () => null,
  );

  const queryParameters =
    (overrides as SupplierCatalogParameters | undefined) ??
    reactive<SupplierCatalogParameters>({
      searchQuery: '',
      pageNumber: 1,
      pageSize: 12,
      isActive: undefined,
    });

  const nuxtApp = useNuxtApp();

  const key = computed(() =>
    [
      'supplier-catalog-list',
      queryParameters.searchQuery,
      queryParameters.pageNumber,
      queryParameters.pageSize,
      queryParameters.isActive ?? 'null',
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getSupplierService(nuxtApp.$api).getSupplierCatalog(
        toRaw(queryParameters),
      ),
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
    catalogItems.value = data.value.list;
    pagination.value = data.value.pagination;
  });

  const refreshCatalog = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    catalogItems,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshCatalog,
  };
};
