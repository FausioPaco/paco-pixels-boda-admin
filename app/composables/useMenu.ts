import { getMenuService } from '~/services/menuService';

export const useMenu = async () => {
  const menu = useState<Menu | undefined | null>('event-menu', () => undefined);
  const nuxtApp = useNuxtApp();

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();
  const key = 'get-menu-' + eventId;

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getMenuService(nuxtApp.$api).getMenuByEvent(Number(eventId)),
    {
      transform(input) {
        return {
          menu: input,
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

  const refreshMenu = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key);
    }
    await refresh();
  };

  watchEffect(() => {
    if (data.value) {
      menu.value = data.value.menu;
    }
  });

  return {
    menu,
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    refreshMenu,
  };
};
