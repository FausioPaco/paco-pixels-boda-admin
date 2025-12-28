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
  { show: false, beverage: undefined },
);

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
    purchaseMode: mixed<BeveragePurchaseMode.Unit | BeveragePurchaseMode.Box>()
      .oneOf([BeveragePurchaseMode.Unit, BeveragePurchaseMode.Box])
      .required('O modo de compra é obrigatório.'),
    unitsPerBox: number()
      .nullable()
      .when('purchaseMode', {
        is: BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required('Unidades por caixa é obrigatório.')
            .min(1, 'Tem de ser maior que 0.'),
        otherwise: (s) => s.nullable(),
      }),
    boxesQty: number()
      .nullable()
      .when('purchaseMode', {
        is: BeveragePurchaseMode.Box,
        then: (s) =>
          s
            .required('Número de caixas é obrigatório.')
            .min(1, 'Tem de ser maior que 0.'),
        otherwise: (s) => s.nullable(),
      }),
    initialUnits: number()
      .nullable()
      .when('purchaseMode', {
        is: BeveragePurchaseMode.Unit,
        then: (s) =>
          s
            .required('Estoque inicial é obrigatório.')
            .min(0, 'Não pode ser negativo.'),
        otherwise: (s) => s.nullable(),
      }),
    minimumUnits: number().nullable().min(0, 'Não pode ser negativo.'),
    notes: string().nullable(),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } =
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

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const isEditing = computed(() => !!props.beverage?.id);

const onSubmit = handleSubmit(async (values) => {
  serverErrors.value = { hasErrors: false, message: '' };

  try {
    if (props.beverage?.id) {
      // Edit
      await beverageService.updateEventBeverage(
        props.eventId,
        props.beverage.id,
        { ...values },
      );
      toast.success('Bebida actualizada com sucesso.');
    } else {
      // Create
      await beverageService.createEventBeverage(props.eventId, values);
      toast.success('Bebida criada com sucesso.');
    }

    emit('success');
    close();
  } catch (error: unknown) {
    serverErrors.value.message = getServerErrors(error as ServerError);
    serverErrors.value.hasErrors = true;
  }
});

const getInitialFormValues = (): EventBeverageCreateInput => {
  const b = props.beverage;
  return {
    name: b?.name ?? '',
    beverageCategoryId: b?.beverageCategoryId ?? 0,
    purchaseMode: b?.purchaseMode ?? BeveragePurchaseMode.Unit,
    unitsPerBox: b?.unitsPerBox ?? null,
    boxesQty: b?.boxesQty ?? null,
    initialUnits: b?.initialUnits ?? null,
    minimumUnits: b?.minimumUnits ?? undefined,
    notes: b?.notes ?? '',
  };
};

const close = () => emit('closeModal');

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
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="isEditing ? 'Editar bebida' : 'Adicionar bebida'"
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="bevName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        name="bevName"
        label="Nome:"
        placeholder="Ex: Coca-Cola"
        :readonly="isSubmitting"
      />

      <BaseSelect
        id="bevCategory"
        v-model="beverageCategoryId"
        v-bind="beverageCategoryIdAttrs"
        :error-message="errors.beverageCategoryId"
        name="bevCategory"
        label="Categoria:"
        :options="categoryOptions"
        :disabled="isSubmitting"
      />

      <BaseSelect
        id="purchaseMode"
        v-model="purchaseMode"
        v-bind="purchaseModeAttrs"
        :error-message="errors.purchaseMode"
        name="purchaseMode"
        label="Modo de compra:"
        :options="purchaseModeOptions"
        :disabled="isSubmitting"
      />

      <div
        v-if="purchaseMode === BeveragePurchaseMode.Box"
        class="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <div>
          <BaseInput
            id="unitsPerBox"
            v-model="unitsPerBox"
            v-bind="unitsPerBoxAttrs"
            :error-message="errors.unitsPerBox"
            name="unitsPerBox"
            label="Por caixa (unidades):"
            type="number"
            :readonly="isSubmitting"
          />
        </div>

        <div>
          <BaseInput
            id="boxesQty"
            v-model="boxesQty"
            v-bind="boxesQtyAttrs"
            :error-message="errors.boxesQty"
            name="boxesQty"
            label="Caixas:"
            type="number"
            :readonly="isSubmitting"
          />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <BaseInput
            id="initialUnits"
            v-model="initialUnits"
            v-bind="initialUnitsAttrs"
            :error-message="errors.initialUnits"
            name="initialUnits"
            label="Estoque inicial:"
            type="number"
            :readonly="isSubmitting"
          />
        </div>

        <div>
          <BaseInput
            id="minimumUnits"
            v-model="minimumUnits"
            v-bind="minimumUnitsAttrs"
            :error-message="errors.minimumUnits"
            name="minimumUnits"
            label="Estoque mínimo:"
            type="number"
            :readonly="isSubmitting"
          />
        </div>
      </div>

      <BaseTextArea
        id="notes"
        v-model="notes"
        v-bind="notesAttrs"
        :error-message="errors.notes"
        name="notes"
        label="Notas:"
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
