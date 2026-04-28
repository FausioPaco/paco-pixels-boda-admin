<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { number, object, string } from 'yup';
import { getBeverageService } from '~/services/beverageService';
import { isFetchErrorLike } from '~/utils/serverUtils';

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
const { t, locale } = useI18n();
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

const isConfirmed = computed(() => !!props.estimate?.confirmed);

const purchaseModeOptions = computed<SelectOption[]>(() => [
  { id: BeveragePurchaseMode.Unit, name: t('beverages.purchase_mode_unit') },
  { id: BeveragePurchaseMode.Box, name: t('beverages.purchase_mode_box') },
]);

const categoryOptions = computed<SelectOption[]>(() => {
  const items = categories?.value ?? [];
  return items.map((c) => ({ id: String(c.id), name: c.name }));
});

const schema = toTypedSchema(
  object({
    name: string().required(() => t('beverages.validation_name_required')),
    beverageCategoryId: number()
      .required(() => t('beverages.validation_category_required'))
      .typeError(() => t('beverages.validation_category_required')),
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
      .oneOf([BeveragePurchaseMode.Unit, BeveragePurchaseMode.Box], () =>
        t('beverages.validation_purchase_mode_one_of'),
      )
      .required(() => t('beverages.validation_purchase_mode_required'))
      .typeError(() => t('beverages.validation_purchase_mode_required')),
    unitsPerBox: number()
      .nullable()
      .typeError(() => t('beverages.validation_units_per_box_number'))
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required(() => t('beverages.validation_units_per_box_required'))
            .min(1, () => t('beverages.validation_positive_number')),
        otherwise: (s) => s.nullable(),
      }),
    boxesQty: number()
      .nullable()
      .typeError(() => t('beverages.validation_boxes_qty_number'))
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required(() => t('beverages.validation_boxes_qty_required'))
            .min(1, () => t('beverages.validation_positive_number')),
        otherwise: (s) => s.nullable(),
      }),
    initialUnits: number()
      .nullable()
      .typeError(() => t('beverages.validation_qty_number'))
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Unit,
        then: (s) =>
          s
            .required(() => t('beverages.validation_qty_required'))
            .min(0, () => t('beverages.validation_non_negative')),
        otherwise: (s) => s.nullable(),
      }),
    minimumUnits: number()
      .nullable()
      .typeError(() => t('beverages.validation_minimum_number'))
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required(() => t('beverages.validation_minimum_required'))
            .min(0, () => t('beverages.validation_non_negative')),
        otherwise: (s) =>
          s.nullable().min(0, () => t('beverages.validation_non_negative')),
      }),
    unitPriceEstimate: number()
      .nullable()
      .typeError(() => t('beverages.validation_estimated_unit_price_number'))
      .min(0, () => t('beverages.validation_non_negative')),
    beverageCatalogItemId: number().nullable(),
    notes: string().nullable(),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting, validate } =
  useForm<EventBeverageEstimateCreateInput>({
    validationSchema: schema,
    initialValues: {
      name: '',
      beverageCategoryId: undefined,
      purchaseMode: BeveragePurchaseMode.Unit,
      unitsPerBox: null,
      boxesQty: null,
      initialUnits: null,
      minimumUnits: undefined,
      unitPriceEstimate: null,
      beverageCatalogItemId: null,
      notes: '',
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
const [beverageCatalogItemId] = defineField('beverageCatalogItemId');
const [notes, notesAttrs] = defineField('notes');

const minimumBoxes = ref<number | null>(null);

const isEditingLocal = computed(() => !!props.estimate?.id);
const purchaseModeNumber = computed(() => Number(purchaseMode.value));
const isBoxMode = computed(
  () => purchaseModeNumber.value === BeveragePurchaseMode.Box,
);

const calcUnitsFromBoxes = () => {
  const upb = Number(unitsPerBox.value);
  const bq = Number(boxesQty.value);

  if (!upb || upb <= 0) return null;
  if (!bq || bq <= 0) return 0;

  return bq * upb;
};

watch(
  () => purchaseModeNumber.value,
  (next, prev) => {
    if (next === prev) return;

    // Unidade -> Caixa
    if (next === BeveragePurchaseMode.Box) {
      // converter a quantidade em unidades para caixas (se tiver unitsPerBox)
      const currentUnits = Number(initialUnits.value ?? 0);

      // limpa campos de Unit (o input desaparece, mas o state tem de ser limpo)
      initialUnits.value = null;

      // se já tiver unitsPerBox, tenta converter unidades -> caixas
      const upb = Number(unitsPerBox.value);
      if (upb > 0 && currentUnits > 0) {
        boxesQty.value = Math.max(1, Math.ceil(currentUnits / upb));
      }

      // garante coerência do payload: em modo Caixa, mantém initialUnits calculado
      const computed = calcUnitsFromBoxes();
      if (computed !== null) initialUnits.value = computed;

      // se ainda não houver mínimo em caixas, dá default
      minimumBoxes.value = minimumBoxes.value ?? 1;
      return;
    }

    // Caixa -> Unidade
    if (next === BeveragePurchaseMode.Unit) {
      // converter caixas -> unidades (se tiver dados)
      const computed = calcUnitsFromBoxes();
      initialUnits.value = computed ?? initialUnits.value ?? null;

      // limpar campos de Box (para não enviar lixo no payload)
      unitsPerBox.value = null;
      boxesQty.value = null;
      minimumBoxes.value = null;
      return;
    }
  },
);

const serverErrors = ref<ServerError>({ hasErrors: false, message: '' });

const close = () => emit('closeModal');

const getInitialFormValues = (): EventBeverageEstimateCreateInput => {
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
    beverageCatalogItemId: e?.beverageCatalogItemId ?? null,
    notes: e?.notes ?? '',
  };
};

/**
 * ===== Autocomplete (igual ao BeverageUpsertModal) =====
 */
const catalogSuggestions = ref<BeverageCatalogItem[]>([]);
const isSearchingCatalog = ref(false);

const searchCatalog = useDebounceFn(async (q: string) => {
  const query = q.trim();
  if (query.length < 2) {
    catalogSuggestions.value = [];
    return;
  }

  try {
    isSearchingCatalog.value = true;

    const result = await beverageService.search({
      q: query,
      categoryId: null,
      take: 8,
    });

    catalogSuggestions.value = result ?? [];
  } catch {
    catalogSuggestions.value = [];
  } finally {
    isSearchingCatalog.value = false;
  }
}, 350);

const onCatalogSearch = (q: string) => {
  searchCatalog(q);
};

const onCatalogSelect = (item: BeverageCatalogItem) => {
  // 1) nome
  name.value = item.name;

  // 2) categoria (não aceitar vazio)
  if (item.beverageCategoryId) {
    beverageCategoryId.value = item.beverageCategoryId;
  }

  // 3) guardar ligação ao catálogo
  beverageCatalogItemId.value = item.id;

  // 4) defaults do catálogo (igual ao upsert)
  if (item.defaultPurchaseMode === 'Box') {
    purchaseMode.value = BeveragePurchaseMode.Box;
    unitsPerBox.value = item.defaultUnitsPerBox ?? null;
    minimumBoxes.value = minimumBoxes.value ?? 1;

    // evita ficar com campos de Unit preenchidos indevidamente
    initialUnits.value = null;
  }

  if (item.defaultPurchaseMode === 'Unit') {
    purchaseMode.value = BeveragePurchaseMode.Unit;

    // limpa campos de Box
    unitsPerBox.value = null;
    boxesQty.value = null;
  }
};

const minimumUnitsEquivalent = computed(() => {
  const upb = Number(unitsPerBox.value);
  const mb = Number(minimumBoxes.value);

  if (!isBoxMode.value) return null;
  if (!upb || upb <= 0) return null;
  if (!mb || mb <= 0) return 0;

  return mb * upb;
});

const totalUnitsEquivalent = computed(() => {
  if (!isBoxMode.value) return null;
  if (!unitsPerBox.value) return null;
  if (!Number(unitsPerBox.value) || Number(unitsPerBox.value) <= 0) return null;
  if (!boxesQty.value || boxesQty.value <= 0) return 0;

  const result = Number(boxesQty.value) * Number(unitsPerBox.value);
  return result <= 0 ? null : result;
});

watch(
  [isBoxMode, unitsPerBox, boxesQty, minimumBoxes],
  () => {
    if (!isBoxMode.value) return;

    // 1) mínimo em unidades
    const eqMin = minimumUnitsEquivalent.value;
    if (eqMin !== null) minimumUnits.value = eqMin;

    // 2) stock inicial em unidades
    const computed = calcUnitsFromBoxes();
    if (computed !== null) initialUnits.value = computed;
  },
  { immediate: true },
);

watch(
  () => props.show,
  (open) => {
    if (!open) {
      catalogSuggestions.value = [];
      isSearchingCatalog.value = false;
      return;
    }

    serverErrors.value = { hasErrors: false, message: '' };
    resetForm({ values: getInitialFormValues() });

    // se abrir em modo Box, inferir minimumBoxes a partir de minimumUnits (igual ao upsert)
    if (Number(purchaseMode.value) === BeveragePurchaseMode.Box) {
      const upb = Number(unitsPerBox.value);
      const minU = Number(minimumUnits.value);

      if (upb > 0 && minU >= 0) {
        minimumBoxes.value = Math.ceil(minU / upb);
      } else {
        minimumBoxes.value = null;
      }
    } else {
      minimumBoxes.value = null;
    }
  },
  { immediate: true },
);

watch(locale, () => {
  if (props.show) validate();
});

const onSubmit = handleSubmit(async (values) => {
  if (isBlocked.value) return;
  if (isConfirmed.value) return;

  serverErrors.value = { hasErrors: false, message: '' };

  const finalValues: EventBeverageEstimateCreateInput = {
    ...values,
    purchaseMode: Number(values.purchaseMode) as BeveragePurchaseMode,
  };

  if (Number(finalValues.purchaseMode) === BeveragePurchaseMode.Box) {
    const computed = calcUnitsFromBoxes();
    finalValues.initialUnits = computed ?? 0;
  } else {
    finalValues.unitsPerBox = null;
    finalValues.boxesQty = null;
  }

  try {
    if (props.estimate?.id) {
      await beverageService.updateEventBeverageEstimate(
        props.eventId,
        props.estimate.id,
        finalValues,
      );
      toast.success(t('beverages.toast_estimate_updated_success'));
    } else {
      await beverageService.createEventBeverageEstimate(
        props.eventId,
        finalValues,
      );
      toast.success(t('beverages.toast_estimate_created_success'));
    }

    emit('success');
    close();
  } catch (err: unknown) {
    console.error(err);
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = t('beverages.toast_estimate_save_error');
    }
    serverErrors.value.hasErrors = true;
  }
});

const pricePerUnit = computed(() => Number(unitPriceEstimate.value ?? 0));
const upbNumber = computed(() => Number(unitsPerBox.value ?? 0));
const boxesQtyNumber = computed(() => Number(boxesQty.value ?? 0));

const pricePerBoxEstimate = computed(() => {
  if (!isBoxMode.value) return null;
  if (pricePerUnit.value <= 0) return null;
  if (upbNumber.value <= 0) return null;
  return pricePerUnit.value * upbNumber.value;
});

const totalPriceEstimate = computed(() => {
  if (!isBoxMode.value) return null;
  if (pricePerUnit.value <= 0) return null;
  if (upbNumber.value <= 0) return null;
  if (boxesQtyNumber.value <= 0) return 0;
  return pricePerUnit.value * upbNumber.value * boxesQtyNumber.value;
});
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="
      isEditingLocal
        ? t('beverages.form_edit_estimate_title')
        : t('beverages.form_add_estimate_title')
    "
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseAlert
        :show="isBlocked"
        :title="t('beverages.alert_estimate_modal_readonly_title')"
        :message="t('beverages.alert_estimate_modal_readonly_message')"
        type="informative"
      />

      <BaseAlert
        :show="isConfirmed"
        :title="t('beverages.alert_estimate_already_confirmed_title')"
        :message="t('beverages.alert_estimate_already_confirmed_message')"
        type="informative"
      />

      <BaseAutoCompleteInput
        id="estimateName"
        v-model="name"
        v-bind="nameAttrs"
        name="estimateName"
        :label="t('beverages.form_name_label')"
        :placeholder="t('beverages.form_estimate_name_placeholder')"
        :readonly="isSubmitting || isBlocked || isConfirmed"
        :disabled="isSubmitting || isBlocked || isConfirmed"
        :error-message="errors.name"
        :items="catalogSuggestions"
        item-label="name"
        item-key="id"
        :loading="isSearchingCatalog"
        :no-results-text="t('beverages.form_no_results')"
        :min-chars="2"
        @search="onCatalogSearch"
        @select="onCatalogSelect"
      />

      <BaseSelect
        id="estimateCategory"
        v-model="beverageCategoryId"
        v-bind="beverageCategoryIdAttrs"
        :label="t('beverages.form_category_label')"
        :options="categoryOptions"
        :error-message="errors.beverageCategoryId"
        :disabled="isSubmitting || isBlocked || isConfirmed"
      />

      <BaseSelect
        id="estimatePurchaseMode"
        v-model="purchaseMode"
        v-bind="purchaseModeAttrs"
        :label="t('beverages.form_purchase_mode_label')"
        :options="purchaseModeOptions"
        :error-message="errors.purchaseMode"
        :disabled="isSubmitting || isBlocked || isConfirmed"
        disable-empty
        as-number
      />

      <div v-if="isBoxMode" class="animate-fadeIn">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseInput
            id="estimateUnitsPerBox"
            v-model="unitsPerBox"
            v-bind="unitsPerBoxAttrs"
            name="estimateUnitsPerBox"
            :label="t('beverages.form_units_per_box_label')"
            type="number"
            :error-message="errors.unitsPerBox"
            :readonly="isSubmitting || isBlocked || isConfirmed"
          />

          <BaseInput
            id="estimateBoxesQty"
            v-model="boxesQty"
            v-bind="boxesQtyAttrs"
            name="estimateBoxesQty"
            :label="t('beverages.form_initial_boxes_label')"
            type="number"
            :error-message="errors.boxesQty"
            :readonly="isSubmitting || isBlocked || isConfirmed"
            :helper-text="
              totalUnitsEquivalent
                ? t('beverages.helper_equivalent_units', {
                    n: totalUnitsEquivalent,
                  })
                : ''
            "
          />
        </div>

        <BaseInput
          id="estimateMinimumBoxes"
          v-model="minimumBoxes"
          name="estimateMinimumBoxes"
          :label="t('beverages.form_minimum_boxes_short_label')"
          type="number"
          :readonly="isSubmitting || isBlocked || isConfirmed"
          :error-message="errors.minimumUnits"
          :helper-text="
            minimumUnitsEquivalent
              ? t('beverages.helper_equivalent_units', {
                  n: minimumUnitsEquivalent,
                })
              : ''
          "
        />
      </div>

      <div v-else class="grid animate-fadeIn grid-cols-1 gap-4 md:grid-cols-2">
        <BaseInput
          id="estimateInitialUnits"
          v-model="initialUnits"
          v-bind="initialUnitsAttrs"
          name="estimateInitialUnits"
          :label="t('beverages.form_qty_label')"
          type="number"
          :error-message="errors.initialUnits"
          :readonly="isSubmitting || isBlocked || isConfirmed"
        />

        <BaseInput
          id="estimateMinimumUnits"
          v-model="minimumUnits"
          v-bind="minimumUnitsAttrs"
          name="estimateMinimumUnits"
          :label="t('beverages.form_minimum_label')"
          type="number"
          :error-message="errors.minimumUnits"
          :readonly="isSubmitting || isBlocked || isConfirmed"
        />
      </div>

      <BaseInput
        id="estimateUnitPrice"
        v-model="unitPriceEstimate"
        v-bind="unitPriceEstimateAttrs"
        name="estimateUnitPrice"
        :label="t('beverages.form_estimated_unit_price_label')"
        type="number"
        :error-message="errors.unitPriceEstimate"
        :readonly="isSubmitting || isBlocked || isConfirmed"
        :helper-text="
          isBoxMode
            ? [
                pricePerBoxEstimate != null
                  ? t('beverages.helper_price_per_box_money', {
                      price: formatMoney(pricePerBoxEstimate),
                    })
                  : '',
                totalPriceEstimate != null
                  ? t('beverages.helper_total_estimated_money', {
                      price: formatMoney(totalPriceEstimate),
                    })
                  : '',
              ]
                .filter(Boolean)
                .join(' | ')
            : ''
        "
      />

      <BaseTextArea
        id="estimateNotes"
        v-model="notes"
        v-bind="notesAttrs"
        name="estimateNotes"
        :label="t('beverages.form_notes_label')"
        :placeholder="t('beverages.form_optional_placeholder')"
        :error-message="errors.notes"
        :readonly="isSubmitting || isBlocked || isConfirmed"
      />

      <BaseError v-if="serverErrors.hasErrors">
        {{ serverErrors.message }}
      </BaseError>

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
          :disabled="isSubmitting || isBlocked || isConfirmed"
          :loading="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? t('common.saving') : t('common.save') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
