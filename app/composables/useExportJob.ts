import { ref, computed, onBeforeUnmount } from 'vue';
import { TYPE, type useToast } from 'vue-toastification';
import type { ToastID } from 'vue-toastification/dist/types/types';

export type ExportJobState = {
  jobId: string;
  type: string;
  status: string;
  total: number;
  processed: number;
  percent: number;
  zipUrl?: string | null;
  error?: string | null;
};

type StartFn = () => Promise<{ jobId: string; total: number }>;
type StatusFn = (jobId: string) => Promise<ExportJobState>;

type Options = {
  toast: ReturnType<typeof useToast>; // useToast()
  toastId: string; // chave única (evita duplicados)
  toastTitle: string; // ex: "Exportação de QR Codes"
  start: StartFn;
  getStatus: StatusFn;

  // hooks opcionais
  onCompleted?: (status: ExportJobState) => Promise<void> | void;
  onFailed?: (status: ExportJobState) => void;
  onCancelled?: () => void;

  pollMs?: number; // default 1200
};

export const useExportJob = (opts: Options) => {
  const isRunning = ref(false);
  const showProgressModal = ref(false);

  const jobId = ref<string | null>(null);
  const total = ref(0);
  const processed = ref(0);

  const percent = computed(() =>
    total.value <= 0 ? 0 : Math.round((processed.value * 100) / total.value),
  );

  let pollTimer: number | null = null;
  const toastRef = ref<ToastID | null>(null);

  const clearPoll = () => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const reset = () => {
    jobId.value = null;
    total.value = 0;
    processed.value = 0;
    isRunning.value = false;
    showProgressModal.value = false;
    toastRef.value = null;
  };

  const start = async () => {
    try {
      isRunning.value = true;

      // toast persistente
      toastRef.value = opts.toast.info(
        `${opts.toastTitle} iniciada. Pode continuar a usar o sistema.`,
        {
          id: opts.toastId,
          timeout: false,
          closeOnClick: true,
        },
      );

      const startResult = await opts.start();
      jobId.value = startResult.jobId;
      total.value = startResult.total ?? 0;
      processed.value = 0;

      showProgressModal.value = true;

      clearPoll();

      pollTimer = window.setInterval(async () => {
        if (!jobId.value) return;

        try {
          const status = await opts.getStatus(jobId.value);

          total.value = status.total ?? total.value;
          processed.value = status.processed ?? processed.value;

          // atualizar toast (sem expirar)
          if (toastRef.value) {
            opts.toast.update(toastRef.value, {
              content: `${opts.toastTitle}… ${percent.value}% (${processed.value}/${total.value})`,
              options: { timeout: false },
            });
          }

          if (status.status === 'Completed') {
            clearPoll();

            if (toastRef.value) {
              opts.toast.update(toastRef.value, {
                content: `${opts.toastTitle} concluída.`,
                options: { type: TYPE.SUCCESS, timeout: 4500 },
              });
            }

            await opts.onCompleted?.(status);
            reset();
          }

          if (status.status === 'Failed') {
            clearPoll();

            if (toastRef.value) {
              opts.toast.update(toastRef.value, {
                content: status.error || `${opts.toastTitle}: ocorreu um erro.`,
                options: { type: TYPE.ERROR, timeout: 6000 },
              });
            }

            opts.onFailed?.(status);
            reset();
          }

          if (status.status === 'Cancelled') {
            clearPoll();

            if (toastRef.value) {
              opts.toast.update(toastRef.value, {
                content: `${opts.toastTitle} cancelada.`,
                options: { type: TYPE.INFO, timeout: 4000 },
              });
            }

            opts.onCancelled?.();
            reset();
          }
        } catch (err: unknown) {
          console.log(err);
          clearPoll();

          if (toastRef.value) {
            opts.toast.update(toastRef.value, {
              content: `${opts.toastTitle} expirou. Por favor, tente novamente.`,
              options: { type: TYPE.ERROR, timeout: 6000 },
            });
          }

          reset();
        }
      }, opts.pollMs ?? 1200);
    } catch (err) {
      clearPoll();

      if (toastRef.value) {
        opts.toast.update(toastRef.value, {
          content: `${opts.toastTitle}: ocorreu um erro.`,
          options: { type: TYPE.ERROR, timeout: 6000 },
        });
      }

      reset();
      throw err;
    }
  };

  onBeforeUnmount(() => {
    clearPoll();
  });

  return {
    // estado
    isRunning,
    showProgressModal,
    total,
    processed,
    percent,

    // ações
    start,
    reset,
    clearPoll,
  };
};
