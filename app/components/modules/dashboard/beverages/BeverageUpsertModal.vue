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
  { show: false, beverage: undefined },
);

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
      .typeError(() => t('beverages.validation_initial_stock_number'))
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Unit,
        then: (s) =>
          s
            .required(() => t('beverages.validation_initial_stock_required'))
            .min(0, () => t('beverages.validation_non_negative')),
        otherwise: (s) => s.nullable(),
      }),
    minimumUnits: number()
      .nullable()
      .typeError(() => t('beverages.validation_minimum_stock_number'))
      .when('purchaseMode', {
        is: (v: unknown) => Number(v) === BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required(() => t('beverages.validation_minimum_stock_required'))
            .min(0, () => t('beverages.validation_non_negative')),
        otherwise: (s) =>
          s.nullable().min(0, () => t('beverages.validation_non_negative')),
      }),
    notes: string().nullable(),
    unitPrice: number()
      .nullable()
      .typeError(() => t('beverages.validation_unit_price_number'))
      .min(0, () => t('beverages.validation_non_negative')),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting, validate } =
  useForm<EventBeverageCreateInput>({
    validationSchema: schema,
    initialValues: {
      name: '',
      purchaseMode: BeveragePurchaseMode.Unit,
      unitsPerBox: null,
      boxesQty: null,
      initialUnits: null,
      minimumUnits: undefined,
      notes: '',
      unitPrice: null,
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
const [notes, notesAttrs] = defineField('notes');
const [unitPrice, unitPriceAttrs] = defineField('unitPrice');
const minimumBoxes = ref<number | null>(null);

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const isEditing = computed(() => !!props.beverage?.id);
const purchaseModeNumber = computed(() => Number(purchaseMode.value));
const isBoxMode = computed(
  () => purchaseModeNumber.value === BeveragePurchaseMode.Box,
);

const onSubmit = handleSubmit(async (values) => {
  serverErrors.value = { hasErrors: false, message: '' };

  const finalValues: EventBeverageCreateInput = {
    ...values,
    purchaseMode: Number(values.purchaseMode) as BeveragePurchaseMode,
  };

  if (Number(finalValues.purchaseMode) === BeveragePurchaseMode.Box) {
    const upb = Number(unitsPerBox.value);
    const mb = Number(minimumBoxes.value);

    if (upb > 0 && mb > 0) {
      finalValues.minimumUnits = mb * upb;
    }
  }

  try {
    if (props.beverage?.id) {
      // Edit
      await beverageService.updateEventBeverage(
        props.eventId,
        props.beverage.id,
        finalValues,
      );
      toast.success(t('beverages.toast_beverage_updated_success'));
    } else {
      // Create
      await beverageService.createEventBeverage(props.eventId, finalValues);
      toast.success(t('beverages.toast_beverage_created_success'));
    }

    emit('success');
    close();
  } catch (err: unknown) {
    console.error(err);
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = t('beverages.toast_beverage_save_error');
    }
    serverErrors.value.hasErrors = true;
  }
});

const getInitialFormValues = (): EventBeverageCreateInput => {
  const b = props.beverage;
  return {
    name: b?.name ?? '',
    beverageCategoryId: b?.beverageCategoryId ?? undefined,
    purchaseMode: b?.purchaseMode ?? BeveragePurchaseMode.Unit,
    unitsPerBox: b?.unitsPerBox ?? null,
    boxesQty: b?.boxesQty ?? null,
    initialUnits: b?.initialUnits ?? null,
    minimumUnits: b?.minimumUnits ?? undefined,
    notes: b?.notes ?? '',
    unitPrice: b?.unitPrice ?? null,
  };
};

const close = () => emit('closeModal');

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

    // // se quiseres filtrar por categoria seleccionada, usa beverageCategoryId.value quando > 0
    // const categoryId =
    //   beverageCategoryId.value && Number(beverageCategoryId.value) > 0
    //     ? Number(beverageCategoryId.value)
    //     : null;

    const result = await beverageService.search({
      q: query,
      categoryId: null,
      take: 8,
    });

    catalogSuggestions.value = result ?? [];
  } catch {
    // aqui prefiro não mostrar toast a cada keypress.
    catalogSuggestions.value = [];
  } finally {
    isSearchingCatalog.value = false;
  }
}, 350);

const onCatalogSearch = (q: string) => {
  searchCatalog(q);
};

const onCatalogSelect = (item: BeverageCatalogItem) => {
  // 1) nome (já vai ser preenchido pelo componente, mas garantimos)
  name.value = item.name;

  // 2) categoria (se fizer sentido e se o user ainda não escolheu)
  if (item.beverageCategoryId) {
    beverageCategoryId.value = item.beverageCategoryId;
  }

  // 3) defaults do catálogo
  if (item.defaultPurchaseMode === 'Box') {
    purchaseMode.value = BeveragePurchaseMode.Box;
    unitsPerBox.value = item.defaultUnitsPerBox ?? null;
    minimumBoxes.value = minimumBoxes.value ?? 1;

    // se muda para box, evita ficar com campos de Unit preenchidos indevidamente
    initialUnits.value = null;
  }

  if (item.defaultPurchaseMode === 'Unit') {
    purchaseMode.value = BeveragePurchaseMode.Unit;

    // se muda para unit, limpa campos de Box para não confundir
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
  [isBoxMode, unitsPerBox, minimumBoxes],
  () => {
    if (!isBoxMode.value) return;

    const eq = minimumUnitsEquivalent.value;

    if (eq === null) return;

    minimumUnits.value = eq;
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

    resetForm({
      values: getInitialFormValues(),
    });

    if (Number(purchaseMode.value) === BeveragePurchaseMode.Box) {
      const upb = Number(unitsPerBox.value);
      const minU = Number(minimumUnits.value);

      if (upb > 0 && minU >= 0) {
        // se não for múltiplo, usamos ceil para não ficar abaixo do mínimo real
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

const pricePerUnit = computed(() => Number(unitPrice.value ?? 0));
const upbNumber = computed(() => Number(unitsPerBox.value ?? 0));
const boxesQtyNumber = computed(() => Number(boxesQty.value ?? 0));

const pricePerBox = computed(() => {
  if (!isBoxMode.value) return null;
  if (pricePerUnit.value <= 0) return null;
  if (upbNumber.value <= 0) return null;
  return pricePerUnit.value * upbNumber.value;
});

const totalPrice = computed(() => {
  if (pricePerUnit.value <= 0) return null;

  // se em Box mode, calcula via caixas
  if (isBoxMode.value) {
    if (upbNumber.value <= 0) return null;
    if (boxesQtyNumber.value <= 0) return 0;
    return pricePerUnit.value * upbNumber.value * boxesQtyNumber.value;
  }

  // se em Unit mode, usa unidades (ajusta o campo certo: initialUnits/currentUnits)
  const units = Number(initialUnits.value ?? 0);
  if (units <= 0) return 0;
  return pricePerUnit.value * units;
});
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="
      isEditing ? t('beverages.form_edit_title') : t('beverages.form_add_title')
    "
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseAutoCompleteInput
        id="bevName"
        v-model="name"
        v-bind="nameAttrs"
        name="bevName"
        :label="t('beverages.form_name_label')"
        :placeholder="t('beverages.form_name_placeholder')"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
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
        id="bevCategory"
        v-model="beverageCategoryId"
        v-bind="beverageCategoryIdAttrs"
        :error-message="errors.beverageCategoryId"
        name="bevCategory"
        :label="t('beverages.form_category_label')"
        :options="categoryOptions"
        :disabled="isSubmitting"
      />

      <BaseSelect
        id="purchaseMode"
        v-model="purchaseMode"
        v-bind="purchaseModeAttrs"
        :error-message="errors.purchaseMode"
        name="purchaseMode"
        :label="t('beverages.form_purchase_mode_label')"
        :options="purchaseModeOptions"
        :disabled="isSubmitting"
        disable-empty
        as-number
      />

      <div v-if="isBoxMode" class="animate-fadeIn">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseInput
            id="unitsPerBox"
            v-model="unitsPerBox"
            v-bind="unitsPerBoxAttrs"
            :error-message="errors.unitsPerBox"
            name="unitsPerBox"
            :label="t('beverages.form_units_per_box_label')"
            type="number"
            :readonly="isSubmitting"
          />

          <BaseInput
            id="boxesQty"
            v-model="boxesQty"
            v-bind="boxesQtyAttrs"
            :error-message="errors.boxesQty"
            name="boxesQty"
            :label="t('beverages.form_initial_boxes_label')"
            type="number"
            :readonly="isSubmitting"
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
          id="minimumBoxes"
          v-model="minimumBoxes"
          :error-message="errors.minimumUnits"
          name="minimumBoxes"
          :label="t('beverages.form_minimum_boxes_label')"
          type="number"
          :readonly="isSubmitting"
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
          id="initialUnits"
          v-model="initialUnits"
          v-bind="initialUnitsAttrs"
          :error-message="errors.initialUnits"
          name="initialUnits"
          :label="t('beverages.form_initial_stock_label')"
          type="number"
          :readonly="isSubmitting"
        />

        <BaseInput
          id="minimumUnits"
          v-model="minimumUnits"
          v-bind="minimumUnitsAttrs"
          :error-message="errors.minimumUnits"
          name="minimumUnits"
          :label="t('beverages.form_minimum_stock_label')"
          type="number"
          :readonly="isSubmitting"
        />
      </div>

      <BaseInput
        id="beverageUnitPrice"
        v-model="unitPrice"
        v-bind="unitPriceAttrs"
        name="beverageUnitPrice"
        :label="t('beverages.form_unit_price_label')"
        type="number"
        :error-message="errors.unitPrice"
        :readonly="isSubmitting"
        :helper-text="
          isBoxMode
            ? [
                pricePerBox != null
                  ? t('beverages.helper_price_per_box', { price: pricePerBox })
                  : '',
                totalPrice != null
                  ? t('beverages.helper_total_price', { price: totalPrice })
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
            : totalPrice != null
              ? t('beverages.helper_total_price', { price: totalPrice })
              : ''
        "
      />

      <BaseTextArea
        id="notes"
        v-model="notes"
        v-bind="notesAttrs"
        :error-message="errors.notes"
        name="notes"
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
