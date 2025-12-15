export const useOnlineUsersWidget = async (opts: {
  eventId: Ref<number | null | undefined>;
  includePartnerStaff?: boolean;
  includeAdmins?: boolean;
  intervalMs?: number;
}) => {
  const intervalMs = opts.intervalMs ?? 30_000;

  const { onlineUsers, refreshOnlineUsers, isRefreshing } =
    await useOnlineUsers({
      eventId: opts.eventId.value ?? null,
      includePartnerStaff: opts.includePartnerStaff ?? true,
      includeAdmins: opts.includeAdmins ?? false,
      cacheKey: `online-users-widget-${opts.eventId.value ?? 'none'}-${!!opts.includePartnerStaff}-${!!opts.includeAdmins}`,
    });

  // refrescar quando mudar o evento
  watch(
    () => opts.eventId.value,
    async () => {
      await refreshOnlineUsers();
    },
  );

  // polling (apenas no client)
  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    timer = setInterval(() => {
      refreshOnlineUsers();
    }, intervalMs);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
  });

  return {
    onlineUsers,
    refreshOnlineUsers,
    isRefreshing,
  };
};
