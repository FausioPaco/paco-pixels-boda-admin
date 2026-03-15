import { getGuestService } from '~/services/guestService';

export const useGuestQRWhatsAppStatusSummary = async (
  queryParameters: GuestParameters,
) => {
  const nuxtApp = useNuxtApp();
  const guestService = getGuestService(nuxtApp.$api);

  const summary = useState<GuestWhatsAppQrStatusSummary | null>(
    'guest-whatsapp-status-summary',
    () => null,
  );

  const isRefreshing = ref(false);
  const isError = ref(false);

  const refreshSummary = async () => {
    try {
      isRefreshing.value = true;
      isError.value = false;

      const data = await guestService.getWhatsAppStatusSummary(
        toRaw(queryParameters),
      );
      summary.value = data;
    } catch (error) {
      console.error('Erro ao obter resumo de estados do WhatsApp:', error);
      isError.value = true;
    } finally {
      isRefreshing.value = false;
    }
  };

  await refreshSummary();

  watch(
    () => ({
      eventId: queryParameters.eventId,
      guestId: queryParameters.guestId,
      guestLocalId: queryParameters.guestLocalId,
      categoryId: queryParameters.categoryId,
      availability_Type: queryParameters.availability_Type,
      whatsAppQrStatus: queryParameters.whatsAppQrStatus,
      giftBrought: queryParameters.giftBrought,
      searchQuery: queryParameters.searchQuery,
      startDate: queryParameters.startDate,
      endDate: queryParameters.endDate,
    }),
    () => {
      refreshSummary();
    },
    { deep: true },
  );

  return {
    summary,
    isRefreshing,
    isError,
    refreshSummary,
  };
};
