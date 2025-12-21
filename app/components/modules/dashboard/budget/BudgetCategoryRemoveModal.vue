<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';

interface IBudgetCategoryRemoveModal {
  show?: boolean;
  category?: BudgetCategory | undefined;
}

const props = withDefaults(defineProps<IBudgetCategoryRemoveModal>(), {
  show: false,
  category: undefined,
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
  if (!props.category?.id) return;

  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;
  serverErrors.value.message = '';

  budgetService
    .deleteCategory(Number(props.category.id))
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success('A categoria foi removida com sucesso');
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
    title="Remover categoria"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="category" class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        Tem certeza que pretende remover esta categoria:
        <span class="font-bold">{{ category.title }}</span
        >?
      </p>

      <div class="w-full">
        <div v-if="isSubmiting" class="mt-4 flex items-center justify-center">
          <BaseLoading size="md" orientation="horizontal" />
        </div>

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
