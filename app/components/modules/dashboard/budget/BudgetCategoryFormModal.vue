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

const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, 'O título deve ter pelo menos 2 caracteres.')
      .max(120, 'O título não pode ter mais de 120 caracteres.')
      .required('O título é obrigatório.'),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } = useForm({
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
        toast.success('Categoria criada.');
      } else {
        await budgetService.updateCategory(props.category.id, {
          title: values.title,
        });
        toast.success('Categoria actualizada.');
      }
    } else {
      if (!props.category) {
        await budgetService.addTemplateCategory(props.parentId, {
          title: values.title,
        });
        toast.success('Categoria do modelo criada.');
      } else {
        await budgetService.updateTemplateCategory(props.category.id, {
          title: values.title,
        });
        toast.success('Categoria do modelo actualizada.');
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
    :title="category ? 'Editar categoria' : 'Adicionar categoria'"
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="budgetCategoryTitle"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        label="Título"
        placeholder="Ex: Planeamento"
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
          >Cancelar</BaseButton
        >
        <BaseButton
          type="submit"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          Guardar</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
