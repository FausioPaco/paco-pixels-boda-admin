<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getEventProgramService } from '~/services/eventProgramService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    eventId: number;
    item?: EventProgramItem | undefined | null;
    isInternal?: boolean;
  }>(),
  { show: false, item: undefined, isInternal: false },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const eventProgramService = getEventProgramService(nuxtApp.$api);

const isSubmiting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const onSubmit = async () => {
  if (!props.item) return;

  try {
    isSubmiting.value = true;

    await eventProgramService.deleteItem(
      props.eventId,
      props.item.id,
      props.isInternal ?? false,
    );

    toast.success('Item removido com sucesso');
    emit('success');
  } catch (e) {
    console.error(e);

    if (isFetchErrorLike(e)) {
      serverErrors.value.message = getServerErrors(e.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao remover o item';
    }

    serverErrors.value.hasErrors = true;
  } finally {
    isSubmiting.value = false;
  }
};

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal
    :show="props.show"
    title="Remover item do programa"
    @close-modal="close"
  >
    <div class="space-y-4">
      <p class="text-grey-700">
        Tem a certeza que pretende remover o item
        <span class="text-grey-900 font-bold">{{
          props.item?.title ?? '-'
        }}</span>
        <span v-if="props.item?.time" class="text-grey-700">
          ({{ props.item?.time }})</span
        >?
      </p>

      <BaseError v-if="serverErrors.hasErrors">
        {{ serverErrors.message }}
      </BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-1"
          size="md"
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onSubmit"
        >
          Remover agora
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="isSubmiting"
          @click="$emit('closeModal')"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
