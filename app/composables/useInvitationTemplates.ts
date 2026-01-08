import { getInvitationService } from '~/services/invitationService';

export const useInvitationTemplates = async () => {
  const templates = useState<InvitationTemplate[]>(
    'invitation-templates',
    () => [],
  );

  const eventStore = useEventStore();
  const resolvedEventId = eventStore.ensureSelected();

  const nuxtApp = useNuxtApp();
  const key = computed(() =>
    ['invitation-templates', resolvedEventId].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getInvitationService(nuxtApp.$api).getTemplates(resolvedEventId),
    {
      transform(input) {
        return { templates: input, fetchedAt: new Date() };
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
    if (data.value) templates.value = data.value.templates;
  });

  const refreshTemplates = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key.value);
    await refresh();
  };

  return {
    templates,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    refreshTemplates,
  };
};
