import { getDeskService } from '~/services/deskService';

export const useDeskSeatingSnapshot = async (eventId: number) => {
  const nuxtApp = useNuxtApp();
  const service = getDeskService(nuxtApp.$api);

  const key = `desk-seating-snapshot-${eventId}`;

  const { data, refresh, status, error } = await useAsyncData(
    key,
    () => service.getSeatingSnapshot(eventId),
    { default: () => [] },
  );

  return {
    snapshot: computed(() => data.value ?? []),
    refreshSnapshot: refresh,
    isRefreshingSnapshot: computed(() => status.value === 'pending'),
    snapshotError: error,
  };
};
