import { getEventService } from '~/services/eventService';

export const useEventTypes = async () => {
  const eventTypes = useState<EventType[]>('get-event-types', () => []);
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-event-types',
    () => getEventService(nuxtApp.$api).getEventTypes(),
    {
      transform(input) {
        return {
          eventTypes: input,
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
      eventTypes.value = data.value.eventTypes;
    }
  });

  return {
    eventTypes,
    isRefreshing: status.value === 'pending',
    refreshTypes: refresh,
  };
};
