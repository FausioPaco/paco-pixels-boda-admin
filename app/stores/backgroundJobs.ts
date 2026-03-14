import { defineStore } from 'pinia';
import { TYPE, useToast } from 'vue-toastification';
import { getEventService } from '~/services/eventService';

export type BackgroundJobKind =
  | 'qr-export'
  | 'invitation-export'
  | 'whatsapp-send';

export type BackgroundJobStatus =
  | 'Pending'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export interface BackgroundJobItem {
  key: string;
  jobId: string;
  kind: BackgroundJobKind;
  title: string;
  toastId: string;
  eventId?: number;
  eventSlug?: string;
  eventName?: string;
  status: BackgroundJobStatus;
  total: number;
  processed: number;
  percent: number;
  zipUrl?: string | null;
  error?: string | null;
  uiNote?: string | null;
  startedAt: string;
  updatedAt: string;
}

type StartTrackedJobPayload = {
  key: string;
  kind: BackgroundJobKind;
  title: string;
  toastId: string;
  eventId?: number;
  eventSlug?: string;
  eventName?: string;
  start: () => Promise<{ jobId: string; total: number; uiNote?: string }>;
  onCompleted?: (job: BackgroundJobItem) => Promise<void> | void;
  onFailed?: (job: BackgroundJobItem) => Promise<void> | void;
  onCancelled?: (job: BackgroundJobItem) => Promise<void> | void;
};

const STORAGE_KEY = 'boda-background-jobs';

export const useBackgroundJobsStore = defineStore('background-jobs', () => {
  const jobs = ref<BackgroundJobItem[]>([]);
  const activeJobKey = ref<string | null>(null);
  const hydrated = ref(false);

  const timers = new Map<string, number>();
  const completionHandlers = new Map<
    string,
    {
      onCompleted?: (job: BackgroundJobItem) => Promise<void> | void;
      onFailed?: (job: BackgroundJobItem) => Promise<void> | void;
      onCancelled?: (job: BackgroundJobItem) => Promise<void> | void;
    }
  >();

  const toast = useToast();
  const nuxtApp = useNuxtApp();
  const eventService = getEventService(nuxtApp.$api);

  const sortedJobs = computed(() =>
    [...jobs.value].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  );

  const activeJobs = computed(() =>
    sortedJobs.value.filter(
      (job) => job.status === 'Pending' || job.status === 'Running',
    ),
  );

  const completedJobs = computed(() =>
    sortedJobs.value.filter(
      (job) =>
        job.status === 'Completed' ||
        job.status === 'Failed' ||
        job.status === 'Cancelled',
    ),
  );

  const activeCount = computed(() => activeJobs.value.length);

  const persist = () => {
    if (!import.meta.client) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.value));
  };

  const load = () => {
    if (!import.meta.client || hydrated.value) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      jobs.value = raw ? (JSON.parse(raw) as BackgroundJobItem[]) : [];
    } catch {
      jobs.value = [];
    } finally {
      hydrated.value = true;
    }
  };

  const upsertJob = (job: BackgroundJobItem) => {
    const index = jobs.value.findIndex((item) => item.key === job.key);

    if (index >= 0) {
      jobs.value[index] = job;
    } else {
      jobs.value.unshift(job);
    }

    persist();
  };

  const patchJob = (key: string, patch: Partial<BackgroundJobItem>) => {
    const existing = jobs.value.find((job) => job.key === key);
    if (!existing) return null;

    const updated: BackgroundJobItem = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    upsertJob(updated);
    return updated;
  };

  const clearTimer = (key: string) => {
    const timer = timers.get(key);
    if (timer) {
      window.clearInterval(timer);
      timers.delete(key);
    }
  };

  const removeJob = (key: string) => {
    clearTimer(key);
    completionHandlers.delete(key);
    jobs.value = jobs.value.filter((job) => job.key !== key);

    if (activeJobKey.value === key) {
      activeJobKey.value = null;
    }

    persist();
  };

  const dismissCompleted = () => {
    const doneKeys = completedJobs.value.map((job) => job.key);

    doneKeys.forEach((key) => {
      clearTimer(key);
      completionHandlers.delete(key);
    });

    jobs.value = jobs.value.filter(
      (job) => job.status === 'Pending' || job.status === 'Running',
    );

    persist();
  };

  const getJobByKey = (key: string) =>
    computed(() => jobs.value.find((job) => job.key === key) ?? null);

  const openJob = (key: string) => {
    activeJobKey.value = key;
  };

  const closeJob = () => {
    activeJobKey.value = null;
  };

  const notifyProgress = (job: BackgroundJobItem) => {
    toast.update(job.toastId, {
      content: `${job.title}… ${job.percent}% (${job.processed}/${job.total})`,
      options: {
        timeout: false,
      },
    });
  };

  const notifyCompleted = (job: BackgroundJobItem) => {
    toast.update(job.toastId, {
      content: `${job.title} concluída.`,
      options: {
        type: TYPE.SUCCESS,
        timeout: 4500,
      },
    });
  };

  const notifyFailed = (job: BackgroundJobItem) => {
    toast.update(job.toastId, {
      content: job.error || `${job.title}: ocorreu um erro.`,
      options: {
        type: TYPE.ERROR,
        timeout: 6000,
      },
    });
  };

  const notifyCancelled = (job: BackgroundJobItem) => {
    toast.update(job.toastId, {
      content: `${job.title} cancelada.`,
      options: {
        type: TYPE.INFO,
        timeout: 4000,
      },
    });
  };

  const runHandler = async (
    key: string,
    type: 'onCompleted' | 'onFailed' | 'onCancelled',
    job: BackgroundJobItem,
  ) => {
    const handlers = completionHandlers.get(key);
    const handler = handlers?.[type];
    if (!handler) return;

    try {
      await handler(job);
    } catch (error) {
      console.error(`Erro no handler ${type} do job ${key}:`, error);
    }
  };

  const resumePolling = (key: string) => {
    const job = jobs.value.find((item) => item.key === key);
    if (!job) return;
    if (job.status !== 'Pending' && job.status !== 'Running') return;
    if (timers.has(key)) return;

    const timer = window.setInterval(async () => {
      try {
        const status = await eventService.getExportStatus(job.jobId);

        const updated = patchJob(key, {
          status: status.status as BackgroundJobStatus,
          total: status.total ?? job.total,
          processed: status.processed ?? job.processed,
          percent: status.percent ?? job.percent,
          zipUrl: status.zipUrl ?? job.zipUrl ?? null,
          error: status.error ?? null,
        });

        if (!updated) return;

        if (updated.status === 'Pending' || updated.status === 'Running') {
          notifyProgress(updated);
          return;
        }

        clearTimer(key);

        if (updated.status === 'Completed') {
          notifyCompleted(updated);
          await runHandler(key, 'onCompleted', updated);
        }

        if (updated.status === 'Failed') {
          notifyFailed(updated);
          await runHandler(key, 'onFailed', updated);
        }

        if (updated.status === 'Cancelled') {
          notifyCancelled(updated);
          await runHandler(key, 'onCancelled', updated);
        }
      } catch (error) {
        console.error('Erro ao acompanhar job em background:', error);

        clearTimer(key);

        const failed = patchJob(key, {
          status: 'Failed',
          error:
            'O acompanhamento da tarefa falhou. Actualize a página e volte a verificar.',
        });

        if (failed) {
          notifyFailed(failed);
          await runHandler(key, 'onFailed', failed);
        }
      }
    }, 1200);

    timers.set(key, timer);
  };

  const hydrateAndResume = () => {
    load();

    activeJobs.value.forEach((job) => {
      toast.info(`${job.title} retomada. Pode continuar a usar o sistema.`, {
        id: job.toastId,
        timeout: false,
        closeOnClick: true,
      });

      resumePolling(job.key);
    });
  };

  const startTrackedJob = async (payload: StartTrackedJobPayload) => {
    clearTimer(payload.key);

    completionHandlers.set(payload.key, {
      onCompleted: payload.onCompleted,
      onFailed: payload.onFailed,
      onCancelled: payload.onCancelled,
    });

    toast.info(`${payload.title} iniciada. Pode continuar a usar o sistema.`, {
      id: payload.toastId,
      timeout: false,
      closeOnClick: true,
    });

    const started = await payload.start();

    upsertJob({
      key: payload.key,
      jobId: started.jobId,
      kind: payload.kind,
      title: payload.title,
      toastId: payload.toastId,
      eventId: payload.eventId,
      eventSlug: payload.eventSlug,
      eventName: payload.eventName,
      status: 'Running',
      total: started.total ?? 0,
      processed: 0,
      percent: 0,
      zipUrl: null,
      error: null,
      uiNote: started.uiNote ?? null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    activeJobKey.value = payload.key;
    resumePolling(payload.key);
  };

  return {
    jobs,
    sortedJobs,
    activeJobs,
    completedJobs,
    activeCount,
    activeJobKey,
    hydrateAndResume,
    getJobByKey,
    openJob,
    closeJob,
    startTrackedJob,
    removeJob,
    dismissCompleted,
  };
});
