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
  const queryParameters =
    params ??
    ({
      eventId: Number(useRuntimeConfig().public.EVENT_ID),
      searchQuery: '',
      startDate: '',
      endDate: '',
      pageNumber: 1,
      pageSize: 10,
    } as ChecklistSectionParameters);

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    `checklist-sections-list`,
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

  return {
    sections,
    pagination,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshSections: refresh,
  };
};
