<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { number, object, string } from 'yup';
import { getBeverageService } from '~/services/beverageService';

type Props = {
  show?: boolean;
  eventId: number;
  estimate?: EventBeverageEstimate | null | undefined;
  moduleStatus: EventBeverageStatus;
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  estimate: undefined,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const { categories, refreshCategories } = await useBeverageCategoriesList({
  parameters: { pageNumber: 1, pageSize: 200, searchQuery: '' },
});

onMounted(async () => {
  await refreshCategories({ force: true });
});

const isBlocked = computed(
  () => props.moduleStatus === 'EventDay' || props.moduleStatus === 'Closed',
);

const isEditing = computed(() => !!props.estimate?.id);
const isConfirmed = computed(() => !!props.estimate?.confirmed);

const purchaseModeOptions = computed<SelectOption[]>(() => [
  { id: BeveragePurchaseMode.Unit, name: 'Unidade' },
  { id: BeveragePurchaseMode.Box, name: 'Caixa' },
]);

const categoryOptions = computed<SelectOption[]>(() => {
  const items = categories?.value ?? [];
  return items.map((c) => ({ id: String(c.id), name: c.name }));
});

const schema = toTypedSchema(
  object({
    name: string().required('O nome é obrigatório.'),
    beverageCategoryId: number()
      .required('A categoria é obrigatória.')
      .typeError('A categoria é obrigatória.'),
    purchaseMode: number()
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
        [BeveragePurchaseMode.Unit, BeveragePurchaseMode.Box],
        'O modo de compra deve ser por unidade ou por caixa.',
      )
      .required('O modo de compra é obrigatório.')
      .typeError('O modo de compra é obrigatório.'),
    unitsPerBox: number()
      .nullable()
      .typeError('Unidades por caixa deve ser um número.')
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required('Unidades por caixa é obrigatório.')
            .min(1, 'Tem de ser maior que 0.'),
        otherwise: (s) => s.nullable(),
      }),
    boxesQty: number()
      .nullable()
      .typeError('Número de caixas deve ser um número.')
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required('Número de caixas é obrigatório.')
            .min(1, 'Tem de ser maior que 0.'),
        otherwise: (s) => s.nullable(),
      }),
    initialUnits: number()
      .nullable()
      .typeError('Quantidade deve ser um número.')
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Unit,
        then: (s) =>
          s
            .required('Quantidade é obrigatória.')
            .min(0, 'Não pode ser negativo.'),
        otherwise: (s) => s.nullable(),
      }),
    minimumUnits: number()
      .nullable()
      .typeError('Mínimo deve ser um número.')
      .min(0, 'Não pode ser negativo.'),
    unitPriceEstimate: number()
      .nullable()
      .typeError('Preço unitário deve ser um número.')
      .min(0, 'Não pode ser negativo.'),
    notes: string().nullable(),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } =
  useForm<EventBeverageEstimateCreateInput>({
    validationSchema: schema,
    initialValues: {
      name: '',
      purchaseMode: BeveragePurchaseMode.Unit,
      unitsPerBox: null,
      boxesQty: null,
      initialUnits: null,
      minimumUnits: undefined,
      unitPriceEstimate: null,
      notes: '',
      beverageCatalogItemId: null,
    },
  });

const [name, nameAttrs] = defineField('name');
const [beverageCategoryId, beverageCategoryIdAttrs] =
  defineField('beverageCategoryId');
const [purchaseMode, purchaseModeAttrs] = defineField('purchaseMode');
const [unitsPerBox, unitsPerBoxAttrs] = defineField('unitsPerBox');
const [boxesQty, boxesQtyAttrs] = defineField('boxesQty');
const [initialUnits, initialUnitsAttrs] = defineField('initialUnits');
const [minimumUnits, minimumUnitsAttrs] = defineField('minimumUnits');
const [unitPriceEstimate, unitPriceEstimateAttrs] =
  defineField('unitPriceEstimate');
const [notes, notesAttrs] = defineField('notes');

const minimumBoxes = ref<number | null>(null);

const purchaseModeNumber = computed(() => Number(purchaseMode.value));
const isBoxMode = computed(
  () => purchaseModeNumber.value === BeveragePurchaseMode.Box,
);

const minimumUnitsEquivalent = computed(() => {
  const upb = Number(unitsPerBox.value);
  const mb = Number(minimumBoxes.value);

  if (!isBoxMode.value) return null;
  if (!upb || upb <= 0) return null;
  if (!mb || mb <= 0) return 0;
  return mb * upb;
});

watch([isBoxMode, unitsPerBox, minimumBoxes], () => {
  if (!isBoxMode.value) return;
  const eq = minimumUnitsEquivalent.value;
  if (eq === null) return;
  minimumUnits.value = eq;
});

const serverErrors = ref<ServerError>({ hasErrors: false, message: '' });

const close = () => emit('closeModal');

const getInitialValues = (): EventBeverageEstimateCreateInput => {
  const e = props.estimate;
  return {
    name: e?.name ?? '',
    beverageCategoryId: e?.beverageCategoryId ?? undefined,
    purchaseMode: e?.purchaseMode ?? BeveragePurchaseMode.Unit,
    unitsPerBox: e?.unitsPerBox ?? null,
    boxesQty: e?.boxesQty ?? null,
    initialUnits: e?.initialUnits ?? null,
    minimumUnits: e?.minimumUnits ?? undefined,
    unitPriceEstimate: e?.unitPriceEstimate ?? null,
    notes: e?.notes ?? '',
    beverageCatalogItemId: e?.beverageCatalogItemId ?? null,
  };
};

watch(
  () => props.show,
  (open) => {
    if (!open) return;

    serverErrors.value = { hasErrors: false, message: '' };
    resetForm({ values: getInitialValues() });

    if (props.estimate?.purchaseMode === BeveragePurchaseMode.Box) {
      // tenta inferir minimumBoxes a partir do mínimo em unidades
      const upb = Number(props.estimate.unitsPerBox ?? 0);
      const minUnits = Number(props.estimate.minimumUnits ?? 0);
      if (upb > 0) minimumBoxes.value = Math.max(1, Math.ceil(minUnits / upb));
    } else {
      minimumBoxes.value = null;
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  if (isBlocked.value) return;
  if (isConfirmed.value) return;

  serverErrors.value = { hasErrors: false, message: '' };

  const finalValues: EventBeverageEstimateCreateInput = {
    ...values,
    purchaseMode: Number(values.purchaseMode) as BeveragePurchaseMode,
  };

  // mesma lógica do BeverageUpsertModal: se Box, mínimo pode vir por caixas
  if (Number(finalValues.purchaseMode) === BeveragePurchaseMode.Box) {
    const upb = Number(unitsPerBox.value);
    const mb = Number(minimumBoxes.value);
    if (upb > 0 && mb > 0) finalValues.minimumUnits = mb * upb;
  }

  try {
    if (props.estimate?.id) {
      await beverageService.updateEventBeverageEstimate(
        props.eventId,
        props.estimate.id,
        finalValues,
      );
      toast.success('Estimativa actualizada com sucesso.');
    } else {
      await beverageService.createEventBeverageEstimate(
        props.eventId,
        finalValues,
      );
      toast.success('Estimativa criada com sucesso.');
    }

    emit('success');
    close();
  } catch (e: unknown) {
    console.error(e);
    if (isFetchErrorLike(e)) {
      serverErrors.value.message = getServerErrors(e.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao guardar a estimativa';
    }
    serverErrors.value.hasErrors = true;
  }
});
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="isEditing ? 'Editar estimativa' : 'Adicionar estimativa'"
    @close-modal="close"
  >
    <div class="space-y-4">
      <BaseAlert
        :show="isBlocked"
        title="Estimativas em modo apenas de leitura"
        message="Este módulo está em modo apenas leitura."
        type="informative"
      />

      <BaseAlert
        :show="isConfirmed"
        title="Esta estimativa já foi confirmada."
        message=" Para alterar, desconfirme primeiro ou edite directamente
          nas bebidas."
        type="informative"
      />

      <BaseInput
        id="estimateName"
        v-model="name"
        v-bind="nameAttrs"
        label="Nome:"
        placeholder="Ex.: Heineken"
        :error-message="errors.name"
        :readonly="isSubmitting || isBlocked || isConfirmed"
      />

      <BaseSelect
        id="estimateCategory"
        label="Categoria:"
        v-bind="beverageCategoryIdAttrs"
        :options="categoryOptions"
        :model-value="beverageCategoryId ? String(beverageCategoryId) : ''"
        :error-message="errors.beverageCategoryId"
        :disabled="isSubmitting || isBlocked || isConfirmed"
        @update:model-value="
          (v: string) => (beverageCategoryId = v ? Number(v) : undefined)
        "
      />

      <BaseSelect
        id="estimatePurchaseMode"
        label="Modo de compra:"
        v-bind="purchaseModeAttrs"
        :options="purchaseModeOptions"
        :model-value="String(purchaseMode)"
        :error-message="errors.purchaseMode"
        :disabled="isSubmitting || isBlocked || isConfirmed"
        @update:model-value="(v: string) => (purchaseMode = Number(v))"
      />

      <div v-if="isBoxMode" class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <BaseInput
          id="estimateUnitsPerBox"
          v-model="unitsPerBox"
          v-bind="unitsPerBoxAttrs"
          label="Unidades por caixa:"
          type="number"
          :error-message="errors.unitsPerBox"
          :readonly="isSubmitting || isBlocked || isConfirmed"
        />

        <BaseInput
          id="estimateBoxesQty"
          v-model="boxesQty"
          v-bind="boxesQtyAttrs"
          label="Número de caixas:"
          type="number"
          :error="errors.boxesQty"
          :readonly="isSubmitting || isBlocked || isConfirmed"
        />

        <BaseInput
          id="estimateMinimumBoxes"
          v-model="minimumBoxes"
          label="Mínimo (em caixas):"
          type="number"
          :readonly="isSubmitting || isBlocked || isConfirmed"
        />
      </div>

      <BaseInput
        v-if="!isBoxMode"
        id="estimateQty"
        v-model="initialUnits"
        v-bind="initialUnitsAttrs"
        label="Quantidade:"
        type="number"
        :error="errors.initialUnits"
        :readonly="isSubmitting || isBlocked || isConfirmed"
      />

      <BaseInput
        id="estimateMinimumUnits"
        v-model="minimumUnits"
        v-bind="minimumUnitsAttrs"
        label="Mínimo (unidades):"
        type="number"
        :error="errors.minimumUnits"
        :readonly="true"
      />

      <BaseInput
        id="estimateUnitPrice"
        v-model="unitPriceEstimate"
        v-bind="unitPriceEstimateAttrs"
        label="Preço unitário estimado (opcional):"
        type="number"
        :error="errors.unitPriceEstimate"
        :readonly="isSubmitting || isBlocked || isConfirmed"
      />

      <BaseInput
        id="estimateNotes"
        v-model="notes"
        v-bind="notesAttrs"
        label="Notas (opcional):"
        placeholder="Observações…"
        :readonly="isSubmitting || isBlocked || isConfirmed"
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-1"
          size="md"
          :disabled="isSubmitting || isBlocked || isConfirmed"
          :loading="isSubmitting"
          @click="onSubmit"
        >
          Guardar
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="isSubmitting"
          @click="$emit('closeModal')"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
