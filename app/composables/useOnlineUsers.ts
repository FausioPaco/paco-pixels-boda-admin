import { getUserService } from '~/services/userService';

export const useOnlineUsers = async (options: {
  eventId?: number | null;
  includePartnerStaff?: boolean;
  includeAdmins?: boolean;
  cacheKey?: string;
}) => {
  const nuxtApp = useNuxtApp();

  const key =
    options.cacheKey ??
    `online-users-${options.eventId ?? 'no-event'}-${!!options.includePartnerStaff}-${!!options.includeAdmins}`;

  const { data, refresh, status } = await useAsyncData(
    key,
    () =>
      getUserService(nuxtApp.$api).getOnlineUsers({
        eventId: options.eventId ?? null,
        includePartnerStaff: options.includePartnerStaff ?? false,
        includeAdmins: options.includeAdmins ?? false,
      }),
    {
      default: () => [],
      transform(input) {
        return input.map((u) => ({ ...u, fetchedAt: new Date() }));
      },
      getCachedData(k) {
        const cached = nuxtApp.payload.data[k] || nuxtApp.static.data[k];
        if (!cached) return;
        return cached;
      },
    },
  );

  return {
    onlineUsers: computed(() => data.value ?? []),
    isRefreshing: computed(() => status.value === 'pending'),
    refreshOnlineUsers: refresh,
  };
};
