import { useToast } from 'vue-toastification';
import { getEventGiftListService } from '~/services/eventGiftListService';

type Options = {
  immediate?: boolean;
};

export const useEventGiftList = async (
  eventId: number,
  opts: Options = { immediate: true },
) => {
  const nuxtApp = useNuxtApp();
  const service = getEventGiftListService(nuxtApp.$api);

  const giftList = ref<EventGiftList | null>(null);

  const isRefreshing = ref(false);
  const isPersisting = ref(false);
  const isError = ref(false);
  const errorMessage = ref<string | null>(null);

  const toast = useToast();

  const setError = (msg: string, err?: unknown) => {
    isError.value = true;
    errorMessage.value = msg;
    console.error(err);
    toast.error(msg);
  };

  const clearError = () => {
    isError.value = false;
    errorMessage.value = null;
  };

  const refreshEventGiftList = async () => {
    if (isRefreshing.value) return;

    isRefreshing.value = true;
    clearError();

    try {
      giftList.value = await service.getByEvent(eventId);
    } catch (err) {
      setError('Não foi possível carregar a lista de presentes.', err);
    } finally {
      isRefreshing.value = false;
    }
  };

  const ensureLoaded = async () => {
    if (giftList.value) return;
    await refreshEventGiftList();
  };

  const updateMode = async (mode: EventGiftListMode) => {
    if (isPersisting.value) return;

    isPersisting.value = true;
    clearError();

    try {
      giftList.value = await service.updateMode(eventId, { mode });
    } catch (err) {
      setError(
        'Não foi possível actualizar o modo da lista de presentes.',
        err,
      );
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const uploadGiftListFile = async (file: File) => {
    if (isPersisting.value) return;

    isPersisting.value = true;
    clearError();

    try {
      giftList.value = await service.uploadGiftListFile(eventId, file);
    } catch (err) {
      setError(
        'Não foi possível carregar o ficheiro da lista de presentes.',
        err,
      );
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const updateEditor = async (htmlContent: string) => {
    if (isPersisting.value) throw new Error('Operação em curso.');

    isPersisting.value = true;
    clearError();

    try {
      giftList.value = await service.updateEditor(eventId, { htmlContent });
    } catch (err) {
      setError('Não foi possível guardar a lista de presentes.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  if (opts.immediate) {
    await refreshEventGiftList();
  }

  return {
    giftList,

    isRefreshing,
    isPersisting,
    isError,
    errorMessage,

    refreshEventGiftList,
    ensureLoaded,

    updateMode,
    uploadGiftListFile,
    updateEditor,
  };
};
