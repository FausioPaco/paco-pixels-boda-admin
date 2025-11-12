import { getDeskService } from '~/services/deskService';

export const useDesksList = async (overrides?: DeskParameters | undefined) => {
  const desks = useState<Desk[]>('desks-list', () => []);

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const pagination = useState<PaginationData<Desk> | null>(
    'desks-pagination',
    () => null,
  );

  const queryParameters: DeskParameters = {
    availability_Type: '',
    searchQuery: '',
    startDate: '',
    endDate: '',
    pageNumber: 1,
    pageSize: 10,
    ...overrides,
    eventId,
  };

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    `desks-list`,
    () => getDeskService(nuxtApp.$api).getAllDesks(queryParameters),
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

  return {
    desks,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshDesks: refresh,
  };
};
