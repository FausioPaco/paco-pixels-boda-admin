import { getMenuService } from '~/services/menuService';

export const useMenuCategories = async () => {
  const categories = useState<MenuCategory[]>('get-menu-categories', () => []);

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-menu-categories',
    () => getMenuService(nuxtApp.$api).getMenuCategories(),
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
