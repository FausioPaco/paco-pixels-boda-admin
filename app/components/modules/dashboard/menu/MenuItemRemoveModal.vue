<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getMenuService } from '~/services/menuService';
interface Props {
  show?: boolean;
  item?: MenuItem | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  item: undefined,
});

const emit = defineEmits(['closeModal', 'success']);

const nuxtApp = useNuxtApp();
const menuService = getMenuService(nuxtApp.$api);
const toast = useToast();

const isSubmitting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const remove = () => {
  if (!props.item) return;

  isSubmitting.value = true;
  serverErrors.value.hasErrors = false;

  menuService
    .removeMenuItem(props.item.id)
    .then(() => {
      emit('success');
      emit('closeModal');
      toast.success('O prato foi removido com sucesso.');
    })
    .catch((err) => {
      console.error(err.data);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmitting.value = false;
    });
};

const closeModal = () => {
  emit('closeModal');
  serverErrors.value = { hasErrors: false, message: '' };
};
</script>

<template>
  <BaseModal title="Remover Prato" :show="show" @close-modal="closeModal">
    <div class="px-4 py-2">
      <p class="text-grey-600 text-center text-base">
        Tem certeza que pretende remover o prato
        <span class="font-bold">{{ item?.name }}</span> do menu?
      </p>

      <BaseError v-if="serverErrors.hasErrors" class="my-2">{{
        serverErrors.message
      }}</BaseError>

      <div class="mt-4 flex w-full justify-center gap-3">
        <BaseButton
          btn-type="primary"
          size="md"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          @click="remove"
        >
          Sim, remover
        </BaseButton>

        <BaseButton
          btn-type="outline-primary"
          size="md"
          :disabled="isSubmitting"
          @click="closeModal"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
