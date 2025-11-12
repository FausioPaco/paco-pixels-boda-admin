import { getSupplierService } from '~/services/supplierService';

export const useSupplier = async (supplierId: number) => {
  const supplier = useState<Supplier | null>('get-supplier', () => null);
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-supplier-' + supplierId,
    () => getSupplierService(nuxtApp.$api).getSupplier(supplierId),
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
    if (data.value) {
      supplier.value = data.value;
    }
  });

  return {
    supplier,
    isRefreshing: status.value === 'pending',
    refreshSupplier: refresh,
  };
};
