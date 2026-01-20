import { getInvitationService } from '~/services/invitationService';

export const useInvitationSettings = async () => {
  const settings = useState<EventInvitationSettings | null>(
    'event-invitation-settings',
    () => null,
  );

  const eventStore = useEventStore();
  const resolvedEventId = eventStore.ensureSelected();

  const nuxtApp = useNuxtApp();
  const key = computed(() =>
    ['event-invitation-settings', resolvedEventId].join('|'),
  );

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getInvitationService(nuxtApp.$api).getSettings(resolvedEventId),
    {
      transform(input) {
        return { settings: input, fetchedAt: new Date() };
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
    if (data.value) settings.value = data.value.settings;
  });

  const refreshSettings = async (opts?: { force?: boolean }) => {
    if (opts?.force) clearNuxtData(key.value);
    await refresh();
  };

  const canExport = computed(() => {
    const s = settings.value;
    if (!s) return false;
    if (s.status !== 'Ready') return false;
    if (!s.settingsJson) return false;
    return true;
  });
  return {
    settings,
    isIdle: status.value === 'idle',
    isRefreshing: status.value === 'pending',
    isError: status.value === 'error',
    isSuccess: status.value === 'success',
    canExport,
    refreshSettings,
  };
};
