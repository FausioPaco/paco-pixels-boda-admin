<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/yup';
import { number, object, string } from 'yup';
import { getBudgetService } from '~/services/budgetService';

type Mode = 'EVENT' | 'TEMPLATE';

interface Props {
  show?: boolean;
  mode: Mode;
  categoryId: number;
  item: BudgetItem | undefined;
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
      .max(200)
      .required(),
    estimatedAmount: number().typeError('Valor inválido.').min(0).required(),
    actualCost: number().typeError('Valor inválido.').min(0).required(),
    paidAmount: number().typeError('Valor inválido.').min(0).required(),
    notes: string().trim().max(2000).optional(),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    estimatedAmount: 0,
    actualCost: 0,
    paidAmount: 0,
    notes: '',
  },
});

const [title, titleAttrs] = defineField('title');
const [estimatedAmount, estimatedAmountAttrs] = defineField('estimatedAmount');
const [actualCost, actualCostAttrs] = defineField('actualCost');
const [paidAmount, paidAmountAttrs] = defineField('paidAmount');
const [notes, notesAttrs] = defineField('notes');

watch(
  () => props.show,
  (open) => {
    if (!open) return;
    const i = props.item;

    resetForm({
      values: {
        title: i?.title ?? '',
        estimatedAmount: i?.estimatedAmount ?? 0,
        actualCost: i?.actualCost ?? 0,
        paidAmount: i?.paidAmount ?? 0,
        notes: i?.notes ?? '',
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
      if (!props.item) {
        await budgetService.addItem(props.categoryId, values);
        toast.success('Item criado.');
      } else {
        await budgetService.updateItem(props.item.id, values);
        toast.success('Item actualizado.');
      }
    } else {
      if (!props.item) {
        await budgetService.addTemplateItem(props.categoryId, values);
        toast.success('Item do modelo criado.');
      } else {
        await budgetService.updateTemplateItem(props.item.id, values);
        toast.success('Item do modelo actualizado.');
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
    :title="item ? 'Editar item' : 'Adicionar item'"
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="budgetTitleItem"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        label="Título"
        placeholder="Ex: Organizador de casamento"
      />

      <BaseInput
        id="budgetEstimatedAmount"
        v-model="estimatedAmount"
        v-bind="estimatedAmountAttrs"
        :error-message="errors.estimatedAmount"
        :readonly="isSubmitting"
        label="Custo estimado"
        type="number"
        step="0.01"
      />

      <BaseInput
        id="budgetActualCost"
        v-model="actualCost"
        v-bind="actualCostAttrs"
        :error-message="errors.actualCost"
        :readonly="isSubmitting"
        label="Custo actual"
        type="number"
        step="0.01"
      />

      <BaseInput
        id="budgetPaidAmount"
        v-model="paidAmount"
        v-bind="paidAmountAttrs"
        :error-message="errors.paidAmount"
        :readonly="isSubmitting"
        label="Montante pago"
        type="number"
        step="0.01"
      />

      <BaseTextArea
        id="budgetNotes"
        v-model="notes"
        v-bind="notesAttrs"
        :error-message="errors.notes"
        :readonly="isSubmitting"
        label="Notas (opcional)"
        placeholder="Notas internas..."
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
