<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { object, string, boolean } from 'yup';
import { getSupplierService } from '~/services/supplierService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    catalogItem?: SupplierCatalogItem | null | undefined;
  }>(),
  { show: false, catalogItem: undefined },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const supplierService = getSupplierService(nuxtApp.$api);

const isEditing = computed(() => !!props.catalogItem?.id);

const schema = toTypedSchema(
  object({
    name: string()
      .required('O nome do fornecedor é obrigatório.')
      .min(2, 'O nome deve ter no mínimo 2 caractéres.'),
    job_Description: string()
      .required('O papel do fornecedor é obrigatório.')
      .min(2, 'O papel deve ter no mínimo 2 caractéres.'),
    phone: string().required('O telemóvel do fornecedor é obrigatório.'),
    isActive: boolean().default(true),
    base_Price: string()
      .nullable()
      .test(
        'is-valid-money',
        'O preço deve ser um valor numérico válido.',
        (v) => {
          if (v == null) return true;
          const t = String(v).trim();
          if (t === '') return true;
          return Number.isFinite(parseDecimal(t));
        },
      ),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } =
  useForm<SupplierCatalogItemInput>({
    validationSchema: schema,
    initialValues: {
      name: '',
      job_Description: '',
      phone: '',
      isActive: true,
      base_Price: null,
    },
  });

const [name, nameAttrs] = defineField('name');
const [job_Description, jobAttrs] = defineField('job_Description');
const [phone, phoneAttrs] = defineField('phone');
const [isActive, isActiveAttrs] = defineField('isActive');
const [base_Price, basePriceAttrs] = defineField('base_Price');

const serverErrors = ref<ServerError>({ hasErrors: false, message: '' });

const close = () => emit('closeModal');

const getInitialFormValues = (): SupplierCatalogItemInput => {
  const it = props.catalogItem;
  return {
    name: it?.name ?? '',
    job_Description: it?.job_Description ?? '',
    phone: it?.phone ?? '',
    isActive: it?.isActive ?? true,
    base_Price: it?.base_Price ?? null,
  };
};

const onSubmit = handleSubmit(async (values) => {
  serverErrors.value = { hasErrors: false, message: '' };

  try {
    const basePriceParsed = values.base_Price
      ? parseDecimal(values.base_Price)
      : NaN;

    const payload: SupplierCatalogItemInput = {
      name: values.name,
      job_Description: values.job_Description,
      phone: values.phone,
      isActive: values.isActive,
      base_Price: Number.isFinite(basePriceParsed) ? basePriceParsed : null,
    };

    if (props.catalogItem?.id) {
      await supplierService.updateSupplierCatalogItem(
        props.catalogItem.id,
        payload,
      );
      toast.success('Item do catálogo actualizado com sucesso.');
    } else {
      await supplierService.createSupplierCatalogItem(payload);
      toast.success('Item do catálogo criado com sucesso.');
    }

    emit('success');
    close();
  } catch (e) {
    console.error(e);
    serverErrors.value.message = isFetchErrorLike(e)
      ? getServerErrors(e.data)
      : 'Ocorreu um erro ao guardar o item do catálogo';
    serverErrors.value.hasErrors = true;
  }
});

watch(
  () => props.show,
  (open) => {
    if (!open) return;
    resetForm({ values: getInitialFormValues() });
  },
  { immediate: true },
);
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="
      isEditing
        ? 'Editar fornecedor (catálogo)'
        : 'Adicionar fornecedor (catálogo)'
    "
    @close-modal="close"
  >
    <form id="supplierCatalogForm" @submit.prevent="onSubmit">
      <BaseInput
        id="catalogName"
        v-model="name"
        v-bind="nameAttrs"
        name="catalogName"
        label="Nome:"
        placeholder="Ex: DJ Paulo"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.name"
      />

      <BaseInput
        id="catalogRole"
        v-model="job_Description"
        v-bind="jobAttrs"
        name="catalogRole"
        label="Papel:"
        placeholder="Ex: DJ, Catering, Fotografia..."
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.job_Description"
      />

      <BaseInput
        id="catalogPhone"
        v-model="phone"
        v-bind="phoneAttrs"
        name="catalogPhone"
        label="Telemóvel:"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.phone"
      />

      <BaseInput
        id="catalogBasePrice"
        v-model="base_Price"
        v-bind="basePriceAttrs"
        name="catalogBasePrice"
        label="Preço base (opcional):"
        placeholder="Ex: 2 500,00"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.base_Price"
      />

      <BaseToggle
        id="catalogActive"
        v-model="isActive"
        v-bind="isActiveAttrs"
        label="Activo"
        :disabled="isSubmitting"
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="mt-4 flex w-full justify-center gap-3">
        <BaseButton
          type="button"
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
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
          @click.prevent="onSubmit"
        >
          {{ isSubmitting ? 'A guardar...' : 'Guardar' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
