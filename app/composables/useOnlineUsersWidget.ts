// useOnlineUsersWidget.ts
export const useOnlineUsersWidget = async (opts: {
  eventId: Ref<number | null | undefined>;
  includePartnerStaff?: boolean;
  includeAdmins?: boolean;
}) => {
  const { onlineUsers, refreshOnlineUsers, isRefreshing } =
    await useOnlineUsers({
      eventId: opts.eventId.value ?? null,
      includePartnerStaff: opts.includePartnerStaff ?? true,
      includeAdmins: opts.includeAdmins ?? false,
      cacheKey: `online-users-widget-${opts.eventId.value ?? 'none'}-${!!opts.includePartnerStaff}-${!!opts.includeAdmins}`,
    });

  // reage à troca de evento
  watch(
    () => opts.eventId.value,
    async () => {
      await refreshOnlineUsers();
    },
  );

  return {
    onlineUsers,
    refreshOnlineUsers,
    isRefreshing,
  };
};
