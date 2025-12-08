import { getChecklistService } from '~/services/checklistService';

function buildKey(p: ChecklistTaskParameters) {
  return [
    `event:${p.eventId ?? 'none'}`,
    `section:${p.sectionId ?? 'none'}`,
    `status:${p.status ?? ''}`,
    `q:${p.searchQuery ?? ''}`,
    `sd:${p.startDate ?? ''}`,
    `ed:${p.endDate ?? ''}`,
    `indef:${p.has_Indefinite_Date ?? 'na'}`,
    `page:${p.pageNumber ?? 1}`,
    `size:${p.pageSize ?? 10}`,
  ].join('|');
}

export const useChecklistTasksList = (
  params?: MaybeRef<ChecklistTaskParameters>,
) => {
  const defaults: ChecklistTaskParameters = {
    eventId: Number(useRuntimeConfig().public.EVENT_ID),
    sectionId: undefined,
    status: '',
    searchQuery: '',
    startDate: '',
    endDate: '',
    has_Indefinite_Date: undefined,
    pageNumber: 1,
    pageSize: 10,
  };

  const p = computed<ChecklistTaskParameters>(() => ({
    ...defaults,
    ...(toValue(params) ?? {}),
  }));

  // key reactiva => muda quando qualquer filtro muda
  const key = computed(() => buildKey(p.value));

  const tasks = ref<ChecklistTask[]>([]);
  const pagination = ref<PaginationData<ChecklistTask> | null>(null);

  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = useLazyAsyncData(
    () => `checklist-tasks-fetch:${key.value}`,
    () => getChecklistService(nuxtApp.$api).getAllTasks(p.value),
    {
      watch: [p],
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          tasksList: data as ChecklistTask[],
          pagination: paginationData as PaginationData<ChecklistTask>,
          fetchedAt: new Date(),
        };
      },
    },
  );

  watchEffect(() => {
    if (data.value) {
      tasks.value = data.value.tasksList;
      pagination.value = data.value.pagination;
    }
  });

  return {
    tasks,
    pagination,
    isIdle: computed(() => status.value === 'idle'),
    isRefreshing: computed(() => status.value === 'pending'),
    isError: computed(() => status.value === 'error'),
    isSuccess: computed(() => status.value === 'success'),
    refreshTasks: refresh,
    params: p,
  };
};
