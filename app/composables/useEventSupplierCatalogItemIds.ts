import { getSupplierService } from '~/services/supplierService';

export const useEventSupplierCatalogItemIds = async (eventId: number) => {
  const ids = useState<number[]>(
    `event-supplier-catalog-ids-${eventId}`,
    () => [],
  );

  const nuxtApp = useNuxtApp();
  const key = computed(() => `event-supplier-catalog-ids-${eventId}`);

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getSupplierService(nuxtApp.$api).getEventSupplierCatalogItemIds(eventId),
    {
      transform(input) {
        return {
          list: input,
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
    ids.value = data.value.list;
  });

  const refreshIds = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key.value);
    await refresh();
  };

  return {
    ids,
    isRefreshing: status.value === 'pending',
    refreshIds,
  };
};
