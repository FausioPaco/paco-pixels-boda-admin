<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { number, object, string } from 'yup';
import { getBeverageService } from '~/services/beverageService';
import { isFetchErrorLike } from '~/utils/serverUtils';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    eventId: number;
    beverage?: EventBeverage | null | undefined;
  }>(),
  { show: false, beverage: null },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const { t, locale } = useI18n();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isSubmitting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const movementOptions = computed<SelectOption[]>(() => [
  { id: BeverageStockMovementType.Out, name: t('beverages.movement_type_out') },
  { id: BeverageStockMovementType.In, name: t('beverages.movement_type_in') },
  {
    id: BeverageStockMovementType.Adjust,
    name: t('beverages.movement_type_adjust'),
  },
  {
    id: BeverageStockMovementType.MarkOutOfStock,
    name: t('beverages.movement_type_mark_out_of_stock'),
  },
]);

const schema = toTypedSchema(
  object({
    type: number()
      .transform((_, originalValue) => {
        if (
          originalValue === '' ||
          originalValue === null ||
          originalValue === undefined
        )
          return undefined;

        const n = Number(originalValue);
        return Number.isNaN(n) ? undefined : n;
      })
      .oneOf(
        [
          BeverageStockMovementType.In,
          BeverageStockMovementType.Out,
          BeverageStockMovementType.Adjust,
          BeverageStockMovementType.MarkOutOfStock,
        ],
        () => t('beverages.validation_movement_type_invalid'),
      )
      .typeError(() => t('beverages.validation_movement_type_required'))
      .required(),
    quantity: number()
      .nullable()
      .when('type', {
        is: (v: BeverageStockMovementType) =>
          v !== BeverageStockMovementType.MarkOutOfStock,
        then: (s) =>
          s
            .required(() => t('beverages.validation_quantity_required'))
            .min(1, () => t('beverages.validation_positive_number')),
        otherwise: (s) => s.nullable(),
      }),
    note: string().nullable(),
  }),
);

const { handleSubmit, resetForm, defineField, errors, validate } =
  useForm<StockMovementCreateInput>({
    validationSchema: schema,
    initialValues: {
      type: BeverageStockMovementType.Out,
      quantity: undefined,
      note: '',
    },
  });

const [type, typeAttrs] = defineField('type');
const [quantity, quantityAttrs] = defineField('quantity');
const [note, noteAttrs] = defineField('note');

const getInitialFormValues = (): StockMovementCreateInput => ({
  type: BeverageStockMovementType.Out,
  quantity: 0,
  note: '',
});

watch(
  () => props.show,
  (open) => {
    if (!open) return;

    resetForm({
      values: getInitialFormValues(),
    });
  },
  { immediate: true },
);

watch(locale, () => {
  if (props.show) validate();
});

const onSubmit = handleSubmit(async (form) => {
  if (!props.beverage) return;

  try {
    isSubmitting.value = true;

    await beverageService.addStockMovement(props.eventId, props.beverage.id, {
      type: form.type,
      quantity:
        form.type === BeverageStockMovementType.MarkOutOfStock
          ? 1
          : (form.quantity ?? 1),
      note: form.note,
    });

    toast.success(t('beverages.toast_movement_success'));
    emit('success');
  } catch (err: unknown) {
    console.error(err);
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = t('beverages.toast_movement_error');
    }

    serverErrors.value.hasErrors = true;
  } finally {
    isSubmitting.value = false;
  }
});

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="t('beverages.manual_movement_title')"
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <p class="text-grey-700">
        {{ t('beverages.form_beverage_label') }}
        <span class="text-grey-900 font-bold">{{
          props.beverage?.name ?? '-'
        }}</span>
      </p>

      <BaseSelect
        id="movementType"
        v-model="type"
        v-bind="typeAttrs"
        name="movementType"
        :error-message="errors.type"
        :label="t('beverages.form_movement_type_label')"
        :options="movementOptions"
        :disabled="isSubmitting"
      />

      <BaseInput
        v-if="type !== BeverageStockMovementType.MarkOutOfStock"
        id="movementQty"
        v-model="quantity"
        v-bind="quantityAttrs"
        :error-message="errors.quantity"
        name="movementQty"
        :label="t('beverages.form_quantity_label')"
        type="number"
        :placeholder="t('beverages.form_quantity_placeholder')"
        :readonly="isSubmitting"
      />

      <BaseTextArea
        id="movementNote"
        v-model="note"
        v-bind="noteAttrs"
        :error-message="errors.note"
        name="movementNote"
        :label="t('beverages.form_notes_label')"
        :placeholder="t('beverages.form_optional_placeholder')"
        :readonly="isSubmitting"
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="mt-4 flex w-full justify-center gap-3">
        <BaseButton
          btn-type="outline-primary"
          btn-size="md"
          :disabled="isSubmitting"
          @click.prevent="close"
        >
          {{ t('common.cancel') }}
        </BaseButton>
        <BaseButton
          btn-type="primary"
          btn-size="md"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? t('common.saving') : t('common.save') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
