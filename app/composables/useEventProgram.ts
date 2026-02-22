import { useToast } from 'vue-toastification';
import { getEventProgramService } from '~/services/eventProgramService';

type Options = {
  immediate?: boolean;
  isInternal?: boolean;
};

export const useEventProgram = async (
  eventId: number,
  opts: Options = { immediate: true },
) => {
  const nuxtApp = useNuxtApp();
  const service = getEventProgramService(nuxtApp.$api);

  const isInternal = opts.isInternal ?? false;

  const program = ref<EventProgram | null>(null);

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

  const refreshEventProgram = async () => {
    if (isRefreshing.value) return;

    isRefreshing.value = true;
    clearError();

    try {
      program.value = await service.getByEvent(eventId, isInternal);
    } catch (err) {
      setError('Não foi possível carregar o programa do evento.', err);
    } finally {
      isRefreshing.value = false;
    }
  };

  const ensureLoaded = async () => {
    if (program.value) return;
    await refreshEventProgram();
  };

  const updateMode = async (mode: EventProgramMode) => {
    if (isPersisting.value) return;

    isPersisting.value = true;
    clearError();

    try {
      program.value = await service.updateMode(eventId, { mode }, isInternal);
    } catch (err) {
      setError('Não foi possível actualizar o modo do programa.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const uploadProgramFile = async (file: File) => {
    if (isPersisting.value) return;

    isPersisting.value = true;
    clearError();

    try {
      program.value = await service.uploadProgramFile(
        eventId,
        file,
        isInternal,
      );
    } catch (err) {
      setError('Não foi possível carregar o ficheiro do programa.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const addItem = async (
    input: EventProgramItemForCreation,
  ): Promise<EventProgramItem> => {
    if (isPersisting.value) throw new Error('Operação em curso.');

    isPersisting.value = true;
    clearError();

    try {
      const created = await service.addItem(eventId, input, isInternal);

      if (program.value) {
        const next = [...(program.value.items ?? []), created];
        next.sort((a, b) => a.sortOrder - b.sortOrder);
        program.value = { ...program.value, mode: 'manual', items: next };
      } else {
        await refreshEventProgram();
      }

      return created;
    } catch (err) {
      setError('Não foi possível adicionar o item.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const updateItem = async (
    itemId: number,
    input: EventProgramItemForUpdate,
  ): Promise<EventProgramItem> => {
    if (isPersisting.value) throw new Error('Operação em curso.');

    isPersisting.value = true;
    clearError();

    try {
      const updated = await service.updateItem(
        eventId,
        itemId,
        input,
        isInternal,
      );

      if (program.value) {
        const next = (program.value.items ?? []).map((x) =>
          x.id === itemId ? updated : x,
        );
        next.sort((a, b) => a.sortOrder - b.sortOrder);
        program.value = { ...program.value, mode: 'manual', items: next };
      } else {
        await refreshEventProgram();
      }

      return updated;
    } catch (err) {
      setError('Não foi possível actualizar o item.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const deleteItem = async (itemId: number) => {
    if (isPersisting.value) throw new Error('Operação em curso.');

    isPersisting.value = true;
    clearError();

    try {
      await service.deleteItem(eventId, itemId, isInternal);

      if (program.value) {
        const next = (program.value.items ?? []).filter((x) => x.id !== itemId);
        program.value = { ...program.value, mode: 'manual', items: next };
      } else {
        await refreshEventProgram();
      }
    } catch (err) {
      setError('Não foi possível remover o item.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  const reorderItems = async (orderedItemIds: number[]) => {
    if (isPersisting.value) throw new Error('Operação em curso.');

    isPersisting.value = true;
    clearError();

    try {
      program.value = await service.reorderItems(
        eventId,
        { orderedItemIds },
        isInternal,
      );
    } catch (err) {
      setError('Não foi possível reordenar os itens.', err);
      throw err;
    } finally {
      isPersisting.value = false;
    }
  };

  if (opts.immediate) {
    await refreshEventProgram();
  }

  return {
    program,

    isRefreshing,
    isPersisting,
    isError,
    errorMessage,

    refreshEventProgram,
    ensureLoaded,

    updateMode,
    uploadProgramFile,

    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
};
