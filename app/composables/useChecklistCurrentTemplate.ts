import { getChecklistService } from '~/services/checklistService';

export const useChecklistCurrentTemplate = async (
  partnerId: number | null = null,
) => {
  const template = useState<ChecklistTemplateDetail | null>(
    'checklist-current-template',
    () => null,
  );

  const eventStore = useEventStore();
  const eventTypeId = computed(() => eventStore.eventTypeId);

  const nuxtApp = useNuxtApp();

  const key = computed(() =>
    ['checklist-current-template', `type:${eventTypeId.value ?? 'none'}`].join(
      '|',
    ),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getChecklistService(nuxtApp.$api).getCurrentTemplateForEventType(
        eventTypeId.value!,
        partnerId ?? undefined,
      ),
    {
      default: () => null,
      transform(input) {
        if (!input) return null;

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
    if (data.value) template.value = data.value;
  });

  const refreshCurrentTemplate = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key.value);
    await refresh();
  };

  return {
    template,
    isRefreshing: status.value === 'pending',
    refreshCurrentTemplate,
  };
};
