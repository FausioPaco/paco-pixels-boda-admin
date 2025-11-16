import { getEventService } from '~/services/eventService';

export const useEvent = async (eventId: number | string) => {
  const event = useState<BodaEvent | null>('get-event', () => null);
  const nuxtApp = useNuxtApp();

  const key = 'get-event-' + eventId;

  const { data, refresh, status } = await useAsyncData(
    'get-event-' + eventId,
    () => getEventService(nuxtApp.$api).getEvent(eventId),
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

  const refreshEvent = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key);
    }
    await refresh();
  };
  watchEffect(() => {
    if (data.value) {
      event.value = data.value;
    }
  });

  return {
    event,
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    refreshEvent,
  };
};
