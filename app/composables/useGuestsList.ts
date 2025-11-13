import { getGuestService } from '~/services/guestService';

export const useGuestsList = async (
  overrides?: GuestParameters | undefined,
) => {
  const guests = useState<Guest[]>('guests-list', () => []);
  const pagination = useState<PaginationData<Guest> | null>(
    'guests-pagination',
    () => null,
  );

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const queryParameters =
    (overrides as GuestParameters | undefined) ??
    reactive<GuestParameters>({
      guestId: undefined,
      categoryId: undefined,
      availability_Type: '',
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
      eventId,
    });

  queryParameters.eventId = eventId;

  const nuxtApp = useNuxtApp();
  const key = computed(() =>
    [
      'guests-list',
      queryParameters.eventId,
      queryParameters.guestId,
      queryParameters.categoryId,
      queryParameters.availability_Type,
      queryParameters.searchQuery,
      queryParameters.startDate,
      queryParameters.endDate,
      queryParameters.pageNumber,
      queryParameters.pageSize,
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getGuestService(nuxtApp.$api).getAllGuests(toRaw(queryParameters)),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          guestsList: data,
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
      guests.value = data.value.guestsList;
      pagination.value = data.value.pagination;
    }
  });

  return {
    guests,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshGuests: refresh,
  };
};
