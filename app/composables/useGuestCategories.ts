import { getGuestService } from '~/services/guestService';

export const useGuestCategories = async () => {
  const categories = useState<GuestCategory[]>(
    'get-guest-categories',
    () => [],
  );

  const nuxtApp = useNuxtApp();
  const key = 'get-guest-categories';

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getGuestService(nuxtApp.$api).getGuestCategories(),
    {
      transform(input) {
        return {
          categoriesList: input,
          fetchedAt: new Date(),
        };
      },
      getCachedData(key) {
        const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
        if (!cached) return;
        if (!cached.fetchedAt || cacheExpired(cached.fetchedAt, 30)) return;
        return cached;
      },
    },
  );

  watchEffect(() => {
    if (data.value) {
      categories.value = data.value.categoriesList;
    }
  });

  const refreshCategories = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key);
    }
    await refresh();
  };

  return {
    categories,
    isRefreshing: status.value === 'pending',
    refreshCategories,
  };
};
