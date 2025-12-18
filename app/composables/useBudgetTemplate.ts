import { getBudgetService } from '~/services/budgetService';

export const useBudgetTemplate = async (templateId: number) => {
  const template = useState<BudgetTemplate | null>(
    `budget-template:${templateId}`,
    () => null,
  );

  const nuxtApp = useNuxtApp();
  const key = `get-budget-template-${templateId}`;

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getBudgetService(nuxtApp.$api).getTemplate(templateId),
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
