import { getEventService } from '~/services/eventService';

export const useEventsList = async (params?: EventParameters | undefined) => {
  const events = useState<Event[]>('events-list', () => []);
  const pagination = useState<PaginationData<Event> | null>(
    'events-pagination',
    () => null,
  );

  const queryParameters =
    params ??
    ({
      eventId: undefined,
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
    } as EventParameters);

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'events-list',
    () => getEventService(nuxtApp.$api).getAllEvents(queryParameters),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          eventsList: data,
          pagination: paginationData,
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
      events.value = data.value.eventsList;
      pagination.value = data.value.pagination;
    }
  });

  return {
    events,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshEvents: refresh,
  };
};
