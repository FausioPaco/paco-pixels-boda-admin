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
      giftBrought: undefined,
      whatsAppQrStatus: undefined,
      whatsAppOutboundType: undefined,
      whatsAppOutboundStatus: undefined,
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
      queryParameters.guestLocalId,
      queryParameters.categoryId,
      queryParameters.availability_Type,
      queryParameters.giftBrought,
      queryParameters.whatsAppQrStatus,
      queryParameters.whatsAppOutboundType,
      queryParameters.whatsAppOutboundStatus,
      queryParameters.searchQuery,
      queryParameters.startDate,
      queryParameters.endDate,
      queryParameters.pageNumber,
      queryParameters.pageSize,
    ].join('|'),
  );

  const watchedQueryParams = computed(() => [
    queryParameters.eventId,
    queryParameters.guestId,
    queryParameters.guestLocalId,
    queryParameters.categoryId,
    queryParameters.availability_Type,
    queryParameters.giftBrought,
    queryParameters.whatsAppQrStatus,
    queryParameters.whatsAppOutboundType,
    queryParameters.whatsAppOutboundStatus,
    queryParameters.searchQuery,
    queryParameters.startDate,
    queryParameters.endDate,
    queryParameters.pageNumber,
    queryParameters.pageSize,
  ]);

  const { data, refresh, status } = await useLazyAsyncData(
    key,
    () => getGuestService(nuxtApp.$api).getAllGuests(toRaw(queryParameters)),
    {
      watch: [watchedQueryParams],
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

  const refreshGuests = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    guests,
    pagination,
    isIdle: computed(() => status.value === 'idle'),
    isRefreshing: computed(() => status.value === 'pending'),
    isError: computed(() => status.value === 'error'),
    isSuccess: computed(() => status.value === 'success'),
    refreshGuests,
  };
};
