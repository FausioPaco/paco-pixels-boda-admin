<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getMenuService } from '~/services/menuService';

interface IMenuCreateModal {
  show?: boolean;
}

withDefaults(defineProps<IMenuCreateModal>(), {
  show: false,
});

const toast = useToast();
const emit = defineEmits(['closeModal', 'success']);

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const nuxtApp = useNuxtApp();
const menuService = getMenuService(nuxtApp.$api);
const { eventId, eventName } = useEventStore();

const onSubmit = () => {
  isSubmiting.value = true;
  const menuInput: MenuInput = {
    title: `Menu do evento: ${eventName}`,
    eventId: Number(eventId),
  };

  menuService
    .createMenu(menuInput)
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success('O menu foi criado com sucesso');
    })
    .catch((err) => {
      console.log(err.data);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
      isSubmiting.value = false;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
};
</script>
<template>
  <BaseModal title="Criar Menu" :show="show" @close-modal="$emit('closeModal')">
    <div class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        Iremos criar um novo menu. Em seguida, será necessário adicionar os
        pratos para cada categoria.
        <b>Tem a certeza de que pretende criar o menu?</b>
      </p>

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
        @click="onSubmit"
        >Criar agora</BaseButton
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
