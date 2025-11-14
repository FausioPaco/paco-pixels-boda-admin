<script lang="ts" setup>
import { useToast } from 'vue-toastification';
import { getGuestService } from '~/services/guestService';

interface IGuestRemoveProps {
  show?: boolean;
  guest?: Guest | undefined;
}

const props = withDefaults(defineProps<IGuestRemoveProps>(), {
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
      .removeGuest(props.guest.id)
      .then(() => {
        emit('closeModal');
        emit('success');
        toast.success('O convidado foi removido com sucesso');
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
    title="Remover Convidado"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="guest" class="my-2 animate-fadeIn">
      <p class="text-grey-600 text-center text-base md:text-lg">
        Tem certeza que pretende remover o convidado
        <span class="font-bold">{{ guest.name }}</span
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
          >Sim, remover</BaseButton
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
