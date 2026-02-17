import { getEventService } from '~/services/eventService';

export const useEventsList = async (params?: EventParameters) => {
  const events = ref<BodaEvent[]>([]);
  const pagination = ref<PaginationData<BodaEvent> | null>(null);

  const queryParameters =
    params ??
    ({
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
    } as EventParameters);

  const key = 'events-list';

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getEventService(nuxtApp.$api).getAllEvents(queryParameters),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return { eventsList: data, pagination: paginationData };
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
    if (!data.value) return;
    events.value = data.value.eventsList;
    pagination.value = data.value.pagination;
  });

  const refreshEvents = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key);
    await refresh();
  };

  return {
    events,
    pagination,
    isRefreshing: computed(() => status.value === 'pending'),
    isError: computed(() => status.value === 'error'),
    refreshEvents,
  };
};
