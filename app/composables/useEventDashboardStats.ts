import { getStatisticsService } from '~/services/statisticsService';

export const useEventDashboardStats = async (
  overrides?: Partial<DashboardStatsParameters> | undefined,
) => {
  const dashboardStats = useState<EventDashboardStats | null>(
    'dashboard-stats',
    () => null,
  );

  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  // defaults (e garantia de eventId vindo do store)
  const queryParameters =
    (overrides as Partial<DashboardStatsParameters> | undefined) ??
    reactive<Partial<DashboardStatsParameters>>({
      range: 'last30Days',
      from: '',
      to: '',
      eventId,
    });

  queryParameters.eventId = eventId;

  const nuxtApp = useNuxtApp();

  const key = computed(() =>
    [
      'dashboard-stats',
      queryParameters.eventId,
      queryParameters.range ?? '',
      queryParameters.from ?? '',
      queryParameters.to ?? '',
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getStatisticsService(nuxtApp.$api).getDashboardStats({
        eventId: queryParameters.eventId!,
        range: queryParameters.range,
        from: queryParameters.from || undefined,
        to: queryParameters.to || undefined,
      }),
    {
      transform(input) {
        return {
          stats: input,
          fetchedAt: new Date(),
        };
      },
      getCachedData(key) {
        const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
        if (!cached) return;
        if (!cached.fetchedAt || cacheExpired(cached.fetchedAt, 10)) return;
        return cached;
      },
    },
  );

  watchEffect(() => {
    if (data.value) {
      dashboardStats.value = data.value.stats;
    }
  });

  const refreshDashboardStats = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    dashboardStats,
    queryParameters,

    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',

    refreshDashboardStats,
  };
};
