<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';

type Mode = 'EVENT' | 'TEMPLATE';

interface IBudgetItemRemoveModal {
  show?: boolean;
  item?: BudgetItem | BudgetTemplateItem | undefined;
  mode?: Mode;
}

const props = withDefaults(defineProps<IBudgetItemRemoveModal>(), {
  show: false,
  item: undefined,
  mode: 'EVENT',
});

const toast = useToast();
const emit = defineEmits(['closeModal', 'success']);

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

const onSubmit = () => {
  if (!props.item?.id) return;

  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;
  serverErrors.value.message = '';
  const request =
    props.mode === 'EVENT'
      ? budgetService.deleteItem(Number(props.item.id))
      : budgetService.deleteTemplateItem(Number(props.item.id));

  request
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success(
        props.mode === 'EVENT'
          ? 'O item foi removido com sucesso'
          : 'O item foi removido do modelo com sucesso',
      );
    })
    .catch((err) => {
      console.log(err?.data ?? err);
      serverErrors.value.message = getServerErrors(err?.data ?? err);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
};
</script>

<template>
  <BaseModal
    title="Remover item"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="item" class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        Tem certeza que pretende remover este item:
        <span class="font-bold">{{ item.title }}</span
        >?
      </p>

      <div class="w-full">
        <BaseError v-if="serverErrors.hasErrors">{{
          serverErrors.message
        }}</BaseError>
      </div>
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
  </BaseModal>
</template>
