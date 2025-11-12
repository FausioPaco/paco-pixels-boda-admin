import { getGuestService } from '~/services/guestService';

export const useGuestCategories = async () => {
  const categories = useState<GuestCategory[]>(
    'get-guest-categories',
    () => [],
  );

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-guest-categories',
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

  return {
    categories,
    isRefreshing: status.value === 'pending',
    refresh,
  };
};
