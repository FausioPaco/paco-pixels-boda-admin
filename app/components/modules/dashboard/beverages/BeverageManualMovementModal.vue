<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { mixed, number, object, string } from 'yup';
import { getBeverageService } from '~/services/beverageService';

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
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isSubmitting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const movementOptions = computed<SelectOption[]>(() => [
  { id: BeverageStockMovementType.Out, name: 'Saída (consumo)' },
  { id: BeverageStockMovementType.In, name: 'Entrada' },
  { id: BeverageStockMovementType.Adjust, name: 'Ajuste' },
  {
    id: BeverageStockMovementType.MarkOutOfStock,
    name: 'Marcar fora do estoque',
  },
]);

const schema = toTypedSchema(
  object({
    type: mixed<
      | BeverageStockMovementType.In
      | BeverageStockMovementType.Out
      | BeverageStockMovementType.Adjust
      | BeverageStockMovementType.MarkOutOfStock
    >()
      .oneOf([
        BeverageStockMovementType.In,
        BeverageStockMovementType.Out,
        BeverageStockMovementType.Adjust,
        BeverageStockMovementType.MarkOutOfStock,
      ])
      .required(),
    quantity: number()
      .nullable()
      .when('type', {
        is: (v: BeverageStockMovementType) =>
          v !== BeverageStockMovementType.MarkOutOfStock,
        then: (s) =>
          s
            .required('A quantidade é obrigatória.')
            .min(1, 'Tem de ser maior que 0.'),
        otherwise: (s) => s.nullable(),
      }),
    note: string().nullable(),
  }),
);

const { handleSubmit, resetForm, defineField, errors } =
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

    toast.success('Movimento registado com sucesso');
    emit('success');
  } catch (err: unknown) {
    console.error(err);
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao registar o movimento';
    }

    serverErrors.value.hasErrors = true;
  } finally {
    isSubmitting.value = false;
  }
});

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal :show="props.show" title="Movimento manual" @close-modal="close">
    <form @submit.prevent="onSubmit">
      <p class="text-grey-700">
        Bebida:
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
        label="Tipo:"
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
        label="Quantidade:"
        type="number"
        placeholder="Ex: 12"
        :readonly="isSubmitting"
      />

      <BaseTextArea
        id="movementNote"
        v-model="note"
        v-bind="noteAttrs"
        :error-message="errors.note"
        name="movementNote"
        label="Nota:"
        placeholder="Opcional"
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
          Cancelar
        </BaseButton>
        <BaseButton
          btn-type="primary"
          btn-size="md"
          icon="save"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? 'A guardar...' : 'Guardar' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
