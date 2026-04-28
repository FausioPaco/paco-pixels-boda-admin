<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';

type Mode = 'EVENT' | 'TEMPLATE';

interface IBudgetCategoryRemoveModal {
  show?: boolean;
  category?: BudgetCategory | BudgetTemplateCategory | undefined | null;
  mode?: Mode;
}

const props = withDefaults(defineProps<IBudgetCategoryRemoveModal>(), {
  show: false,
  category: undefined,
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
const { t } = useI18n();

const onSubmit = () => {
  if (!props.category?.id) return;

  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;
  serverErrors.value.message = '';
  const request =
    props.mode === 'EVENT'
      ? budgetService.deleteCategory(Number(props.category.id))
      : budgetService.deleteTemplateCategory(Number(props.category.id));

  request
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success(
        props.mode === 'EVENT'
          ? t('budget.category_removed_success')
          : t('budget.template_category_removed_success'),
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
    :title="t('budget.category_remove_title')"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="category" class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        {{ t('budget.category_remove_confirm_prefix') }}
        <span class="font-bold">{{ category.title }}</span
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
        {{ t('common.remove_now') }}
      </BaseButton>

      <BaseButton
        type="button"
        btn-type="outline-primary"
        class="my-1"
        size="md"
        :disabled="isSubmiting"
        @click="$emit('closeModal')"
      >
        {{ t('common.cancel') }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
