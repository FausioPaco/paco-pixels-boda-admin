<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/yup';
import { number, object, string, mixed } from 'yup';
import { getBudgetService } from '~/services/budgetService';
import {
  BUDGET_CONTROL_MODES,
  BUDGET_CURRENCIES,
} from '~~/shared/types/budget';

type Mode = 'EVENT' | 'TEMPLATE';

interface Props {
  show?: boolean;
  mode?: Mode;
  eventId: number;
  budget?: Budget | undefined;
  eventTypeId?: number;
  template?: BudgetTemplate | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'EVENT',
  budget: undefined,
  template: undefined,
  eventTypeId: 0,
});

const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

const schema = toTypedSchema(
  object({
    totalBudget: number()
      .typeError('O valor do orçamento deve ser numérico.')
      .min(0, 'O orçamento não pode ser negativo.')
      .required('O orçamento é obrigatório.'),
    currency: string().trim().min(2).max(10).required('A moeda é obrigatória.'),
    controlMode: mixed<'Controllable' | 'NonControllable'>()
      .oneOf(['Controllable', 'NonControllable'])
      .required('O modo de controlo é obrigatório.'),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } =
  useForm<BudgetCreateInput>({
    validationSchema: schema,
    initialValues: {
      totalBudget: 0,
      currency: 'MZN',
      controlMode: BudgetControlMode.NonControllable,
    },
  });

const [totalBudget, totalBudgetAttrs] = defineField('totalBudget');
const [currency, currencyAttrs] = defineField('currency');
const [controlMode, controllModeAttrs] = defineField('controlMode');

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

watch(
  () => props.show,
  (open) => {
    if (!open) return;

    if (props.mode === 'EVENT') {
      const b = props.budget;
      resetForm({
        values: {
          totalBudget: b?.totalBudget ?? 0,
          currency: b?.currency ?? 'MZN',
          controlMode: b?.controlMode,
        },
      });
      return;
    }

    const t = props.template;
    resetForm({
      values: {
        totalBudget: t?.baseTotalBudget ?? 0,
        currency: t?.currency ?? 'MZN',
        controlMode: t?.defaultControlMode ?? BudgetControlMode.NonControllable,
      },
    });
  },
  { immediate: true },
);

const close = () => emit('close');

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.mode === 'EVENT') {
      // create or update header
      if (!props.budget) {
        await budgetService.create({
          eventId: props.eventId,
          totalBudget: values.totalBudget,
          currency: values.currency,
          controlMode: values.controlMode,
        });
        toast.success('Orçamento criado com sucesso.');
      } else {
        await budgetService.updateHeader(props.budget.id, {
          totalBudget: values.totalBudget,
          currency: values.currency,
          controlMode: values.controlMode,
        });
        toast.success('Orçamento actualizado com sucesso.');
      }
    } else {
      // template header
      await budgetService.updateTemplate(props.template!.id, {
        title: 'Budget Template',
        baseTotalBudget: values.totalBudget,
        currency: values.currency,
        defaultControlMode: values.controlMode,
      });
      toast.success('Template actualizado com sucesso.');
    }

    emit('saved');
    close();
  } catch (e) {
    serverErrors.value.message = getServerErrors(e as ServerError);
    serverErrors.value.hasErrors = true;
  }
});

const getModalTitle = computed(() => {
  if (props.mode === 'EVENT')
    return props.budget ? 'Modificar informação' : 'Criar budget';
  return 'Editar modelo de orçamento';
});
</script>

<template>
  <BaseModal :show="show" :title="getModalTitle" @close-modal="close">
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="eventTotalBudget"
        v-model="totalBudget"
        v-bind="totalBudgetAttrs"
        :error-message="errors.totalBudget"
        :readonly="isSubmitting"
        label="Orçamento"
        placeholder="0,00"
        type="number"
        step="0.01"
      />

      <BaseSelect
        id="budgetControlMode"
        v-model="controlMode"
        v-bind="controllModeAttrs"
        label="Modo de controlo: "
        :options="BUDGET_CONTROL_MODES"
        :error-message="errors.controlMode"
        :readonly="isSubmitting"
        disable-empty
      />

      <BaseSelect
        id="budgetCurrency"
        v-model="currency"
        v-bind="currencyAttrs"
        label="Moeda: "
        :options="BUDGET_CURRENCIES"
        :error-message="errors.currency"
        :readonly="isSubmitting"
        disable-empty
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
