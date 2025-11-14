<script lang="ts" setup>
import { useToast } from 'vue-toastification';
import { getGuestService } from '~/services/guestService';

interface IGuestCancelArrivedForm {
  show?: boolean;
  guest?: Guest | undefined;
}

const props = withDefaults(defineProps<IGuestCancelArrivedForm>(), {
  show: false,
  guest: undefined,
});
const emit = defineEmits(['closeModal', 'success']);
const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const toast = useToast();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const onSubmit = () => {
  if (props.guest) {
    isSubmiting.value = true;
    guestService
      .cancelArrival(props.guest.id)
      .then(() => {
        emit('closeModal');
        emit('success');
        toast.success('As alterações foram salvas com sucesso');
      })
      .catch((err) => {
        console.log(err.data);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmiting.value = false;
      });
  }
};
</script>
<template>
  <BaseModal
    title="Cancelar Chegada"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="props.guest" class="my-2 animate-fadeIn">
      <p class="text-grey-600 text-center text-base md:text-lg">
        Pretende cancelar chegada de
        <span class="font-bold">{{ props.guest.name }}</span
        >?
      </p>

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div
        class="my-4 flex animate-fadeIn items-center justify-center space-x-3"
      >
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-1"
          size="md"
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onSubmit"
          >Sim, cancelar</BaseButton
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
    </div>
  </BaseModal>
</template>
