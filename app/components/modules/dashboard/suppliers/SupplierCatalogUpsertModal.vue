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
    },
  });

const [name, nameAttrs] = defineField('name');
const [job_Description, jobAttrs] = defineField('job_Description');
const [phone, phoneAttrs] = defineField('phone');
const [isActive, isActiveAttrs] = defineField('isActive');

const serverErrors = ref<ServerError>({ hasErrors: false, message: '' });

const close = () => emit('closeModal');

const getInitialFormValues = (): SupplierCatalogItemInput => {
  const it = props.catalogItem;
  return {
    name: it?.name ?? '',
    job_Description: it?.job_Description ?? '',
    phone: it?.phone ?? '',
    isActive: it?.isActive ?? true,
  };
};

const onSubmit = handleSubmit(async (values) => {
  serverErrors.value = { hasErrors: false, message: '' };

  try {
    const payload: SupplierCatalogItemInput = {
      name: values.name,
      job_Description: values.job_Description,
      phone: values.phone,
      isActive: values.isActive,
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
    <form @submit.prevent="onSubmit">
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
        >
          {{ isSubmitting ? 'A guardar...' : 'Guardar' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
