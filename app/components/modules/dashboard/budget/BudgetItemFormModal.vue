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
  item: any | null;
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
    sortOrder: number().min(1).optional(),
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
    sortOrder: 1,
  },
});

const [title] = defineField('title');
const [estimatedAmount] = defineField('estimatedAmount');
const [actualCost] = defineField('actualCost');
const [paidAmount] = defineField('paidAmount');
const [notes] = defineField('notes');
const [sortOrder] = defineField('sortOrder');

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
        sortOrder: i?.sortOrder ?? 1,
      },
    });
  },
  { immediate: true },
);

const close = () => emit('close');

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
        toast.success('Item do template criado.');
      } else {
        await budgetService.updateTemplateItem(props.item.id, values);
        toast.success('Item do template actualizado.');
      }
    }

    emit('saved');
    close();
  } catch (e: any) {
    toast.error(
      e?.data?.message || e?.message || 'Não foi possível guardar o item.',
    );
  }
});
</script>

<template>
  <BaseModal :show="show" @close="close">
    <template #title>
      {{ item ? 'Editar item' : 'Adicionar item' }}
    </template>

    <template #content>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div>
          <BaseInput
            v-model="title"
            label="Título"
            placeholder="Ex: Organizador de casamento"
          />
          <BaseInputError v-if="errors.title">{{
            errors.title
          }}</BaseInputError>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <BaseInput
              v-model="estimatedAmount"
              label="Estimado"
              type="number"
              step="0.01"
            />
            <BaseInputError v-if="errors.estimatedAmount">{{
              errors.estimatedAmount
            }}</BaseInputError>
          </div>
          <div>
            <BaseInput
              v-model="actualCost"
              label="Custo actual"
              type="number"
              step="0.01"
            />
            <BaseInputError v-if="errors.actualCost">{{
              errors.actualCost
            }}</BaseInputError>
          </div>
          <div>
            <BaseInput
              v-model="paidAmount"
              label="Montante pago"
              type="number"
              step="0.01"
            />
            <BaseInputError v-if="errors.paidAmount">{{
              errors.paidAmount
            }}</BaseInputError>
          </div>
        </div>

        <div>
          <BaseInput
            v-model="notes"
            label="Notas (opcional)"
            placeholder="Notas internas..."
          />
          <BaseInputError v-if="errors.notes">{{
            errors.notes
          }}</BaseInputError>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton type="button" variant="secondary" @click="close"
            >Cancelar</BaseButton
          >
          <BaseButton type="submit" :loading="isSubmitting">Guardar</BaseButton>
        </div>
      </form>
    </template>
  </BaseModal>
</template>
