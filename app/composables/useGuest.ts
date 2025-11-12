import { getGuestService } from '~/services/guestService';

export const useGuest = async (guestId: number) => {
  const guest = useState<Guest | null>('get-guest', () => null);
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-guest-' + guestId,
    () => getGuestService(nuxtApp.$api).getGuest(guestId),
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
      guest.value = data.value;
    }
  });

  return {
    guest,
    isRefreshing: status.value === 'pending',
    refreshGuest: refresh,
  };
};
