import { getUserService } from '~/services/userService';

export const useUsersList = async (params?: UserParameters) => {
  const users = useState<User[]>('users-list', () => []);
  const pagination = useState<PaginationData<User> | null>(
    'users-pagination',
    () => null,
  );

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const queryParameters = params ?? {
    eventId: eventId,
    searchQuery: '',
    startDate: '',
    endDate: '',
    pageNumber: 1,
    pageSize: 10,
  };

  const nuxtApp = useNuxtApp();
  const key = computed(() =>
    [
      'users-list',
      queryParameters.eventId,
      queryParameters.searchQuery,
      queryParameters.startDate,
      queryParameters.endDate,
      queryParameters.pageNumber,
      queryParameters.pageSize,
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getUserService(nuxtApp.$api).getAllUsers(queryParameters),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          usersList: data,
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
      users.value = data.value.usersList;
      pagination.value = data.value.pagination;
    }
  });

  const refreshUsers = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    users,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshUsers,
  };
};
