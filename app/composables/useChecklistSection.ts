import { getChecklistService } from '~/services/checklistService';

export const useChecklistSection = async (sectionId: number) => {
  const section = useState<ChecklistSection | null>(
    'get-checklist-section',
    () => null,
  );
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-checklist-section-' + sectionId,
    () => getChecklistService(nuxtApp.$api).getSection(sectionId),
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
      section.value = data.value;
    }
  });

  return {
    section,
    isRefreshing: status.value === 'pending',
    refreshSection: refresh,
  };
};
