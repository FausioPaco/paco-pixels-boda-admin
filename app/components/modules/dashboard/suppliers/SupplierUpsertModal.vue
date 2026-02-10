<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { object, string, number } from 'yup';
import { getSupplierService } from '~/services/supplierService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    eventId: number;
    supplier?: Supplier | null | undefined;
  }>(),
  { show: false, supplier: undefined },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const supplierService = getSupplierService(nuxtApp.$api);
const { refreshIds } = await useEventSupplierCatalogItemIds(props.eventId);

const isEditing = computed(() => !!props.supplier?.id);

const schema = toTypedSchema(
  object({
    name: string()
      .required('O nome do fornecedor é obrigatório.')
      .min(2, 'O nome deve ter no mínimo 2 caractéres.'),
    job_Description: string()
      .required('O papel do fornecedor é obrigatório.')
      .min(2, 'O papel deve ter no mínimo 2 caractéres.'),
    phone: string().required('O telemóvel do fornecedor é obrigatório.'),
    supplierCatalogItemId: number().nullable(),
    price: string()
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
  useForm<SupplierInput>({
    validationSchema: schema,
    initialValues: {
      name: '',
      job_Description: '',
      phone: '',
      supplierCatalogItemId: null,
      price: null,
    },
  });

const [name, nameAttrs] = defineField('name');
const [job_Description, jobAttrs] = defineField('job_Description');
const [phone, phoneAttrs] = defineField('phone');
const [supplierCatalogItemId] = defineField('supplierCatalogItemId');
const [price, priceAttrs] = defineField('price');

const serverErrors = ref<ServerError>({ hasErrors: false, message: '' });

const close = () => emit('closeModal');

const getInitialFormValues = (): SupplierInput => {
  const s = props.supplier;
  return {
    name: s?.name ?? '',
    job_Description: s?.job_Description ?? '',
    phone: s?.phone ?? '',
    supplierCatalogItemId: s?.supplierCatalogItemId ?? null,
  };
};

// Autocomplete (catálogo)
const catalogSuggestions = ref<SupplierCatalogItem[]>([]);
const isSearchingCatalog = ref(false);

const searchCatalog = useDebounceFn(async (q: string) => {
  const query = q.trim();
  if (query.length < 2) {
    catalogSuggestions.value = [];
    return;
  }

  try {
    isSearchingCatalog.value = true;

    const res = await supplierService.getSupplierCatalog({
      searchQuery: query,
      pageNumber: 1,
      pageSize: 8,
      isActive: true,
    });

    catalogSuggestions.value = res?.data ?? [];
  } catch {
    catalogSuggestions.value = [];
  } finally {
    isSearchingCatalog.value = false;
  }
}, 350);

const onCatalogSearch = (q: string) => searchCatalog(q);

const onCatalogSelect = (item: SupplierCatalogItem) => {
  name.value = item.name;
  job_Description.value = item.job_Description;
  phone.value = item.phone;
  supplierCatalogItemId.value = item.id;
};

const onSubmit = handleSubmit(async (values) => {
  serverErrors.value = { hasErrors: false, message: '' };

  try {
    const priceParsed = values.price ? parseDecimal(values.price) : NaN;

    const payload: SupplierInput = {
      name: values.name,
      job_Description: values.job_Description,
      phone: values.phone,
      eventId: props.eventId,
      supplierCatalogItemId: values.supplierCatalogItemId ?? null,
      price: Number.isFinite(priceParsed) ? priceParsed : null,
    };

    if (props.supplier?.id) {
      await supplierService.updateSupplier(Number(props.supplier.id), payload);
      refreshIds({ force: true });
      toast.success('Fornecedor actualizado com sucesso.');
    } else {
      await supplierService.createSupplier(payload);
      refreshIds({ force: true });
      toast.success('Fornecedor criado com sucesso.');
    }

    emit('success');
    close();
  } catch (e) {
    console.error(e);
    serverErrors.value.message = isFetchErrorLike(e)
      ? getServerErrors(e.data)
      : 'Ocorreu um erro ao guardar o fornecedor';
    serverErrors.value.hasErrors = true;
  }
});

watch(
  () => props.show,
  (open) => {
    if (!open) {
      catalogSuggestions.value = [];
      isSearchingCatalog.value = false;
      return;
    }

    resetForm({ values: getInitialFormValues() });
  },
  { immediate: true },
);
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="isEditing ? 'Editar fornecedor' : 'Adicionar fornecedor'"
    @close-modal="close"
  >
    <form @submit.prevent="onSubmit">
      <BaseAutoCompleteInput
        id="supplierName"
        v-model="name"
        v-bind="nameAttrs"
        name="supplierName"
        label="Nome:"
        placeholder="Ex: Fotógrafo João"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.name"
        :items="catalogSuggestions"
        item-label="name"
        item-key="id"
        :loading="isSearchingCatalog"
        no-results-text="Sem resultados no catálogo."
        :min-chars="2"
        @search="onCatalogSearch"
        @select="onCatalogSelect"
        @keydown.enter.prevent="onSubmit"
      />

      <BaseInput
        id="supplierRole"
        v-model="job_Description"
        v-bind="jobAttrs"
        name="supplierRole"
        label="Papel:"
        placeholder="Ex: Fotografia, DJ, Catering..."
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.job_Description"
        @keydown.enter.prevent="onSubmit"
      />

      <BaseInput
        id="supplierPhone"
        v-model="phone"
        v-bind="phoneAttrs"
        name="supplierPhone"
        label="Telemóvel:"
        placeholder="Ex: 84xxxxxxx"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.phone"
        @keydown.enter.prevent="onSubmit"
      />

      <BaseInput
        id="supplierPrice"
        v-model="price"
        v-bind="priceAttrs"
        name="supplierPrice"
        label="Preço (opcional):"
        type="number"
        placeholder="Ex: 2 500,00"
        :readonly="isSubmitting"
        :disabled="isSubmitting"
        :error-message="errors.price"
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
