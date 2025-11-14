import { getGuestService } from '~/services/guestService';

export const useGuest = async (guestId: number) => {
  const guest = useState<Guest | null>('get-guest', () => null);
  const nuxtApp = useNuxtApp();

  const key = 'get-guest-' + guestId;

  const { data, refresh, status } = await useAsyncData(
    key,
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

  const refreshGuest = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key);
    }
    await refresh();
  };

  return {
    guest,
    isRefreshing: status.value === 'pending',
    refreshGuest,
  };
};
