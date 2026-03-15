import { ref, watch, onBeforeUnmount } from 'vue';
import type { useToast } from 'vue-toastification';

import { useExportJob } from '~/composables/useExportJob';
import { getEventService } from '~/services/eventService';
import type { ExportTextColor } from '~~/shared/types/guest';
import type { WhatsAppQrLogsSummary } from '~~/shared/types/whatsappQr';

type Options = {
  toast: ReturnType<typeof useToast>;
  eventId: number;
  clientCode: string;
  color: ExportTextColor;
  force?: boolean;
  reason?: string;
  pollMs?: number;
  summaryPollMs?: number;
};

export const useWhatsAppQrSendJob = (opts: Options) => {
  const summary = ref<WhatsAppQrLogsSummary | null>(null);
  const summaryLoading = ref(false);

  const nuxtApp = useNuxtApp();
  const eventService = getEventService(nuxtApp.$api);

  let summaryTimer: number | null = null;

  const clearSummaryPoll = () => {
    if (!summaryTimer) return;
    window.clearInterval(summaryTimer);
    summaryTimer = null;
  };

  const fetchSummary = async () => {
    try {
      summaryLoading.value = true;
      summary.value = await eventService.getSendQrCardsWhatsappSummary(
        opts.eventId,
      );
    } finally {
      summaryLoading.value = false;
    }
  };

  const job = useExportJob({
    toast: opts.toast,
    toastId: `send-whatsapp-qrcodes-${opts.eventId}-${opts.color}-${opts.clientCode}`,
    toastTitle: 'Envio de QR Codes via WhatsApp',
    start: () =>
      eventService.startSendQrCardsWhatsapp(
        opts.eventId,
        opts.color,
        opts.clientCode,
        opts.force ?? false,
        opts.reason,
      ),
    getStatus: (jobId) => eventService.getExportStatus(jobId),

    // aqui NÃO paramos o timer (isso fica no watch)
    onCompleted: async () => {
      await fetchSummary();
    },
    onFailed: async () => {
      await fetchSummary();
    },
    onCancelled: async () => {
      await fetchSummary();
    },

    pollMs: opts.pollMs ?? 1200,
  });

  watch(
    () => job.isRunning.value,
    async (running) => {
      // sempre que mudar para "não running", parar polling
      if (!running) {
        clearSummaryPoll();
        return;
      }

      // ao arrancar: buscar summary já (para breakdown inicial)
      await fetchSummary();

      clearSummaryPoll();
      summaryTimer = window.setInterval(
        fetchSummary,
        opts.summaryPollMs ?? 1500,
      );
    },
  );

  onBeforeUnmount(() => {
    clearSummaryPoll();
  });

  return {
    job,
    summary,
    summaryLoading,
    fetchSummary,
  };
};
