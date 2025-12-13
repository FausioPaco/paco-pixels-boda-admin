import { getChecklistService } from '~/services/checklistService';

export const useChecklistTemplate = async (templateId: number) => {
  const template = useState<ChecklistTemplateDetail | null>(
    'get-checklist-template',
    () => null,
  );

  const nuxtApp = useNuxtApp();
  const key = 'get-checklist-template-' + templateId;

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getChecklistService(nuxtApp.$api).getTemplate(templateId),
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
    if (data.value) template.value = data.value;
  });

  const refreshTemplate = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key);
    await refresh();
  };

  return {
    template,
    isRefreshing: status.value === 'pending',
    refreshTemplate,
  };
};
