import { getChecklistService } from '~/services/checklistService';

export const useChecklistTask = async (taskId: number) => {
  const task = useState<ChecklistTask | null>('get-checklist-task', () => null);
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-checklist-task-' + taskId,
    () => getChecklistService(nuxtApp.$api).getTask(taskId),
    {
      default: () => null,
      transform(input) {
        return {
          ...input,
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
      task.value = data.value;
    }
  });

  return {
    task,
    isRefreshing: status.value === 'pending',
    refreshTask: refresh,
  };
};
