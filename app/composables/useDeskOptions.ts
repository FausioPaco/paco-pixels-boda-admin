import { getDeskService } from '~/services/deskService';

export const useDeskOptions = async () => {
  const desks = useState<DeskOption[]>('get-desk-options', () => []);
  const nuxtApp = useNuxtApp();
  const { EVENT_ID } = useRuntimeConfig().public;

  const { data, refresh, status } = await useAsyncData(
    'get-desk-options',
    () => getDeskService(nuxtApp.$api).getDeskOptions(Number(EVENT_ID)),
    {
      transform(input) {
        return {
          deskOptions: input,
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
      desks.value = data.value.deskOptions;
    }
  });

  return {
    desks,
    isRefreshing: status.value === 'pending',
    refreshDesk: refresh,
  };
};
