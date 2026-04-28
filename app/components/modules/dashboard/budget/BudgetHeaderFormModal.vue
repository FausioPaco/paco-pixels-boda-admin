<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/yup';
import { number, object, string, mixed } from 'yup';
import { getBudgetService } from '~/services/budgetService';

type Mode = 'EVENT' | 'TEMPLATE';

interface Props {
  show?: boolean;
  mode?: Mode;
  eventId: number;
  budget?: Budget | null;
  eventTypeId?: number | null;
  template?: BudgetTemplate | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'EVENT',
  budget: null,
  template: null,
  eventTypeId: null,
});

const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);
const { t, locale } = useI18n();

const schema = computed(() =>
  toTypedSchema(
    object({
      totalBudget: number()
        .typeError(() => t('budget.validation_budget_numeric'))
        .min(0, () => t('budget.validation_budget_non_negative'))
        .required(() => t('budget.validation_budget_required')),
      currency: string()
        .trim()
        .min(2)
        .max(10)
        .required(() => t('budget.validation_currency_required')),
      controlMode: mixed<
        BudgetControlMode.Controllable | BudgetControlMode.NonControllable
      >()
        .oneOf([
          BudgetControlMode.Controllable,
          BudgetControlMode.NonControllable,
        ])
        .required(() => t('budget.validation_control_mode_required')),
    }),
  ),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting, validate } =
  useForm<BudgetCreateInput>({
    validationSchema: schema,
    initialValues: {
      totalBudget: 0,
      currency: 'MZN',
      controlMode: 2,
    },
  });

const [totalBudget, totalBudgetAttrs] = defineField('totalBudget');
const [currency, currencyAttrs] = defineField('currency');
const [controlMode, controllModeAttrs] = defineField('controlMode');

const controlModeOptions = computed<SelectOption[]>(() => [
  {
    id: BudgetControlMode.NonControllable,
    value: BudgetControlMode.NonControllable,
    name: t('budget.control_mode_non_controllable'),
  },
  {
    id: BudgetControlMode.Controllable,
    value: BudgetControlMode.Controllable,
    name: t('budget.control_mode_controllable'),
  },
]);

const currencyOptions = computed<SelectOption[]>(() => [
  { id: 'MZN', value: 'MZN', name: t('budget.currency_mzn') },
  { id: 'USD', value: 'USD', name: t('budget.currency_usd') },
]);

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
      if (b) {
        resetForm({
          values: {
            totalBudget: b?.totalBudget ?? 0,
            currency: b?.currency ?? 'MZN',
            controlMode: b?.controlMode,
          },
        });
        return;
      }
    }

    const t = props.template;
    if (t) {
      resetForm({
        values: {
          totalBudget: t?.baseTotalBudget ?? 0,
          currency: t?.currency ?? 'MZN',
          controlMode:
            t?.defaultControlMode ?? BudgetControlMode.NonControllable,
        },
      });
    }
  },
  { immediate: true },
);

watch(locale, () => {
  if (props.show) validate();
});

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
        toast.success(t('budget.header_created'));
      } else {
        await budgetService.updateHeader(props.budget.id, {
          totalBudget: values.totalBudget,
          currency: values.currency,
          controlMode: values.controlMode,
        });
        toast.success(t('budget.header_updated'));
      }
    } else {
      // template header
      await budgetService.updateTemplate(props.template!.id, {
        title: 'Budget Template',
        baseTotalBudget: values.totalBudget,
        currency: values.currency,
        defaultControlMode: values.controlMode,
      });
      toast.success(t('budget.template_header_updated'));
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
    return props.budget
      ? t('budget.header_modal_edit_title')
      : t('budget.header_modal_create_title');
  return t('budget.template_header_modal_edit_title');
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
        :label="t('budget.header_field_budget')"
        :placeholder="t('budget.header_field_budget_placeholder')"
        type="number"
        step="0.01"
      />

      <BaseSelect
        id="budgetControlMode"
        v-model="controlMode"
        v-bind="controllModeAttrs"
        :label="t('budget.header_field_control_mode')"
        :options="controlModeOptions"
        :error-message="errors.controlMode"
        :readonly="isSubmitting"
        disable-empty
      />

      <BaseSelect
        id="budgetCurrency"
        v-model="currency"
        v-bind="currencyAttrs"
        :label="t('budget.header_field_currency')"
        :options="currencyOptions"
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
