import { getChecklistService } from '~/services/checklistService';

export const useChecklistTemplatesList = async (opts?: {
  includeGlobalFallback?: boolean;
}) => {
  const templates = useState<ChecklistTemplate[]>(
    'checklist-templates-list',
    () => [],
  );

  const eventStore = useEventStore();
  const eventTypeId = computed(() => eventStore.eventTypeId);

  const includeGlobalFallback = computed(
    () => opts?.includeGlobalFallback ?? true,
  );

  const nuxtApp = useNuxtApp();

  const key = computed(() =>
    [
      'checklist-templates-list',
      `type:${eventTypeId ?? 'none'}`,
      `fallback:${includeGlobalFallback.value ? '1' : '0'}`,
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getChecklistService(nuxtApp.$api).getTemplates(
        eventTypeId.value!,
        includeGlobalFallback.value,
      ),
    {
      transform(input) {
        return {
          list: input,
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
    if (data.value) templates.value = data.value.list ?? [];
  });

  const refreshTemplates = async (p?: { force?: boolean }) => {
    if (p?.force) clearNuxtData(key.value);
    await refresh();
  };

  return {
    templates,
    isRefreshing: status.value === 'pending',
    refreshTemplates,
  };
};
