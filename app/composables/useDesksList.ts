import { getDeskService } from '~/services/deskService';

export const useDesksList = async (overrides?: DeskParameters | undefined) => {
  const desks = useState<Desk[]>('desks-list', () => []);

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const pagination = useState<PaginationData<Desk> | null>(
    'desks-pagination',
    () => null,
  );

  // Se a página não enviar params, criamos um reactive com defaults
  const queryParameters =
    (overrides as DeskParameters | undefined) ??
    reactive<DeskParameters>({
      availability_Type: '',
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
      eventId,
    });

  // Garantir que o eventId é sempre o do store
  queryParameters.eventId = eventId;

  const nuxtApp = useNuxtApp();

  const key = computed(() =>
    [
      'desks-list',
      queryParameters.eventId,
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
    () => getDeskService(nuxtApp.$api).getAllDesks(toRaw(queryParameters)),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          desksList: data,
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
      desks.value = data.value.desksList;
      pagination.value = data.value.pagination;
    }
  });

  const refreshDesks = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    desks,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshDesks,
  };
};
