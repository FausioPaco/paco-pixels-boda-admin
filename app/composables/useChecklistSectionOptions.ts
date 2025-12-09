import { getChecklistService } from '~/services/checklistService';

export const useChecklistSectionOptions = async () => {
  const sections = useState<ChecklistSectionOption[]>(
    'get-checklist-section-options',
    () => [],
  );
  const nuxtApp = useNuxtApp();
  const { EVENT_ID } = useRuntimeConfig().public;

  const { data, refresh, status } = await useAsyncData(
    'get-checklist-section-options',
    () => getChecklistService(nuxtApp.$api).getSectionOptions(Number(EVENT_ID)),
    {
      transform(input) {
        return {
          sectionOptions: input,
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
      sections.value = data.value.sectionOptions;
    }
  });

  return {
    sections,
    isRefreshing: status.value === 'pending',
    refreshSections: refresh,
  };
};
