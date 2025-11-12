import { getDeskService } from '~/services/deskService';

export const useDesk = async (deskId: number) => {
  const desk = useState<Desk | null>('get-desk', () => null);
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-desk-' + deskId,
    () => getDeskService(nuxtApp.$api).getDesk(deskId),
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
      desk.value = data.value;
    }
  });

  return {
    desk,
    isRefreshing: status.value === 'pending',
    refreshDesk: refresh,
  };
};
