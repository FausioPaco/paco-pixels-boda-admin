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
  <BaseModal :show="show" title="Remover evento" @close-modal="closeModal">
    <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
      Tens a certeza que pretendes remover o evento
      <span class="font-bold">“{{ event?.name }}” </span>?
    </p>

    <div class="my-4 flex items-center justify-center gap-1">
      <icon-warning
        :font-controlled="false"
        class="text-danger-700 block h-4 w-4"
      ></icon-warning>
      <p class="text-danger-700 text-center text-sm">
        Esta acção não pode ser anulada. Poderás sempre criar um novo evento
        mais tarde.
      </p>
    </div>

    <div class="w-full">
      <div v-if="isSubmiting" class="mt-4 flex items-center justify-center">
        <BaseLoading size="md" orientation="horizontal" />
      </div>

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>
    </div>

    <div class="flex w-full justify-center gap-3">
      <BaseButton
        type="submit"
        btn-type="primary"
        class="my-1"
        size="md"
        :disabled="isSubmiting"
        :loading="isSubmiting"
        @click="onConfirmRemove"
        >Remover agora</BaseButton
      >

      <BaseButton
        type="button"
        btn-type="outline-primary"
        class="my-1"
        size="md"
        :disabled="isSubmiting"
        @click="$emit('closeModal')"
        >Cancelar</BaseButton
      >
    </div>
  </BaseModal>
</template>
