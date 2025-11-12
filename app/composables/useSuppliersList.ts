import { getSupplierService } from '~/services/supplierService';

export const useSuppliersList = async (
  params?: SupplierParameters | undefined,
) => {
  const suppliers = useState<Supplier[]>('suppliers-list', () => []);
  const pagination = useState<PaginationData<Supplier> | null>(
    'suppliers-pagination',
    () => null,
  );
  const queryParameters = params ?? {
    eventId: Number(useRuntimeConfig().public.EVENT_ID),
    searchQuery: '',
    startDate: '',
    endDate: '',
    pageNumber: 1,
    pageSize: 10,
  };

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    () => getSupplierService(nuxtApp.$api).getAllSuppliers(queryParameters),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          suppliersList: data,
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
      suppliers.value = data.value.suppliersList;
      pagination.value = data.value.pagination;
    }
  });

  return {
    suppliers,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshSuppliers: refresh,
  };
};
