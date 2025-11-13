<script lang="ts" setup>
import { useToast } from 'vue-toastification';
import { getEventService } from '~/services/eventService';
import type { BodaEvent } from '#shared/types/event';

interface IEventRemoveProps {
  show?: boolean;
  event?: BodaEvent | null;
}

const props = withDefaults(defineProps<IEventRemoveProps>(), {
  show: false,
  event: null,
});

const emit = defineEmits(['closeModal', 'success']);

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);
const toast = useToast();

const isSubmiting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const closeModal = () => {
  isSubmiting.value = false;
  serverErrors.value = { hasErrors: false, message: '' };
  emit('closeModal');
};

const onConfirmRemove = async () => {
  if (!props.event) return;

  eventService
    .removeEvent(props.event.id)
    .then(() => {
      toast.success('O evento foi removido com sucesso');
      emit('success');
      closeModal();
    })
    .catch((err) => {
      console.log(err.data);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
};
</script>

<template>
  <BaseModal
    icon="WarningCircle"
    :show="show"
    title="Remover evento"
    @close-modal="closeModal"
  >
    <div class="px-4 pb-4 pt-2">
      <p class="text-grey-500 text-sm">
        Tens a certeza que pretendes remover o evento
        <span class="text-grey-900 font-semibold"> “{{ event?.name }}” </span>
        ?
      </p>

      <p class="text-grey-400 mt-2 text-xs">
        Esta acção não pode ser anulada. Poderás sempre criar um novo evento
        mais tarde.
      </p>

      <BaseError v-if="serverErrors.hasErrors" class="mt-4">
        {{ serverErrors.message }}
      </BaseError>

      <div class="mt-6 flex items-center gap-3">
        <BaseButton
          type="button"
          class="my-1"
          size="md"
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onConfirmRemove"
        >
          Remover evento
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="isSubmiting"
          @click="closeModal"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
