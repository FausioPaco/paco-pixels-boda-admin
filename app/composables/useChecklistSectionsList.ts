import { getChecklistService } from '~/services/checklistService';

export const useChecklistSectionsList = async (
  params?: ChecklistSectionParameters | undefined,
) => {
  const sections = useState<ChecklistSection[]>(
    'checklist-sections-list',
    () => [],
  );
  const pagination = useState<PaginationData<ChecklistSection> | null>(
    'checklist-sections-pagination',
    () => null,
  );
  const eventStore = useEventStore();
  const eventId = eventStore.ensureSelected();

  const queryParameters =
    params ??
    ({
      eventId,
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
    } as ChecklistSectionParameters);

  const nuxtApp = useNuxtApp();
  const key = computed(() =>
    [
      `checklist-sections-list`,
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
    () => getChecklistService(nuxtApp.$api).getAllSections(queryParameters),
    {
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          sectionsList: data,
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
      sections.value = data.value.sectionsList;
      pagination.value = data.value.pagination;
    }
  });

  const refreshSections = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key.value);
    }
    await refresh();
  };

  return {
    sections,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshSections,
  };
};
