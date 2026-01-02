import { getSupplierService } from '~/services/supplierService';

export const useSupplierCatalogItem = async (id: number) => {
  const catalogItem = useState<SupplierCatalogItem | null>(
    `supplier-catalog-item-${id}`,
    () => null,
  );

  const nuxtApp = useNuxtApp();
  const key = computed(() => `supplier-catalog-item-${id}`);

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getSupplierService(nuxtApp.$api).getSupplierCatalogItem(id),
    {
      default: () => null,
      transform(input) {
        return { ...input, fetchedAt: new Date() };
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
    if (data.value) catalogItem.value = data.value;
  });

  const refreshCatalogItem = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    catalogItem,
    isRefreshing: status.value === 'pending',
    refreshCatalogItem,
  };
};
