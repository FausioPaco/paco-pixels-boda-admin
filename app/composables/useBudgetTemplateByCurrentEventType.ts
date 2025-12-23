// composables/useBudgetTemplateByCurrentEventType.ts
import { getBudgetService } from '~/services/budgetService';

export const useBudgetTemplateByCurrentEventType = async (opts?: {
  partnerId?: number;
}) => {
  const eventStore = useEventStore();
  const eventTypeId = computed(() => eventStore.eventTypeId);

  const template = useState<BudgetTemplate | null>(
    `budget-template-current-type:${opts?.partnerId ?? 'none'}`,
    () => null,
  );

  const nuxtApp = useNuxtApp();

  const key = computed(() =>
    [
      'get-budget-template-by-current-event-type',
      `type:${eventTypeId.value ?? 'none'}`,
      `partner:${opts?.partnerId ?? 'none'}`,
    ].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getBudgetService(nuxtApp.$api).getTemplateByEventType(
        eventTypeId.value!,
        opts,
      ),
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

  const refreshTemplate = async (p?: { force?: boolean }) => {
    if (p?.force) clearNuxtData(key.value);
    await refresh();
  };

  return {
    template,
    isRefreshing: status.value === 'pending',
    refreshTemplate,
    eventTypeId,
  };
};
