<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/yup';
import { object, string } from 'yup';
import { getBudgetService } from '~/services/budgetService';

type Mode = 'EVENT' | 'TEMPLATE';

interface Props {
  show?: boolean;
  mode: Mode;
  parentId: number; // budgetId ou templateId
  category: BudgetCategory | BudgetTemplateCategory | null;
}

const props = withDefaults(defineProps<Props>(), { show: false });
const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);
const { t, locale } = useI18n();

const schema = computed(() =>
  toTypedSchema(
    object({
      title: string()
        .trim()
        .min(2, () => t('budget.validation_title_min'))
        .max(120, () => t('budget.validation_title_max'))
        .required(() => t('budget.validation_title_required')),
    }),
  ),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting, validate } =
  useForm({
    validationSchema: schema,
    initialValues: {
      title: '',
    },
  });

const [title, titleAttrs] = defineField('title');

watch(
  () => props.show,
  (open) => {
    if (!open) return;

    resetForm({
      values: {
        title: props.category?.title ?? '',
      },
    });
  },
  { immediate: true },
);

watch(locale, () => {
  if (props.show) validate();
});

const close = () => emit('close');

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.mode === 'EVENT') {
      if (!props.category) {
        await budgetService.addCategory(props.parentId, {
          title: values.title,
        });
        toast.success(t('budget.category_created'));
      } else {
        await budgetService.updateCategory(props.category.id, {
          title: values.title,
        });
        toast.success(t('budget.category_updated'));
      }
    } else {
      if (!props.category) {
        await budgetService.addTemplateCategory(props.parentId, {
          title: values.title,
        });
        toast.success(t('budget.template_category_created'));
      } else {
        await budgetService.updateTemplateCategory(props.category.id, {
          title: values.title,
        });
        toast.success(t('budget.template_category_updated'));
      }
    }

    emit('saved');
    close();
  } catch (e) {
    serverErrors.value.message = getServerErrors(e as ServerError);
    serverErrors.value.hasErrors = true;
  }
});
</script>

<template>
  <BaseModal
    :show="show"
    :title="
      category
        ? t('budget.category_modal_edit_title')
        : t('budget.category_modal_create_title')
    "
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="budgetCategoryTitle"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        :label="t('budget.field_title')"
        :placeholder="t('budget.category_field_title_placeholder')"
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click="close"
          >{{ t('common.cancel') }}</BaseButton
        >
        <BaseButton
          type="submit"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          {{ isSubmitting ? t('common.saving') : t('common.save') }}</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
