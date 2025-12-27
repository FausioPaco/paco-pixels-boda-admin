<!-- components/beverages/modals/BeverageRestockModal.vue -->
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { array, mixed, number, object } from 'yup';
import { getBeverageService } from '~/services/beverageService';

type RestockMode = 'UNITS' | 'BOXES';

type RestockRow = {
  eventBeverageId: number;
  mode: RestockMode;
  quantity: number | null;
  boxesQty: number | null;
  note?: string | null;
};

type RestockRowErrors = {
  mode?: string;
  quantity?: string;
  boxesQty?: string;
};

const props = withDefaults(
  defineProps<{
    show?: boolean;
    eventId: number;
    candidates?: EventBeverage[];
  }>(),
  { show: false, candidates: () => [] },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const modeOptions = computed<SelectOption[]>(() => [
  { id: 'UNITS', name: 'Unidades' },
  { id: 'BOXES', name: 'Caixas' },
]);

// valida só "shape" do array (não valida regra qty vs mode)
const schema = toTypedSchema(
  object({
    items: array()
      .of(
        object({
          eventBeverageId: number().required('Bebida é obrigatória'),
          mode: mixed<RestockMode>()
            .oneOf(['UNITS', 'BOXES'])
            .required('Modo é obrigatório'),
          quantity: number().nullable(),
          boxesQty: number().nullable(),
        }),
      )
      .min(1),
  }),
);

const { handleSubmit, resetForm, defineField, isSubmitting } = useForm<{
  items: RestockRow[];
}>({
  validationSchema: schema,
  initialValues: { items: [] },
});

const [items, itemsAttrs] = defineField('items');

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

// ERROS POR ITEM (UI)
const itemErrors = ref<Record<number, RestockRowErrors>>({});

const clearItemErrors = () => {
  itemErrors.value = {};
};

const setItemError = (eventBeverageId: number, err: RestockRowErrors) => {
  itemErrors.value[eventBeverageId] = {
    ...(itemErrors.value[eventBeverageId] ?? {}),
    ...err,
  };
};

const getInitialRows = (): RestockRow[] => {
  const list = props.candidates ?? [];
  return list.map((b) => ({
    eventBeverageId: b.id,
    mode: b.purchaseMode === BeveragePurchaseMode.Unit ? 'UNITS' : 'BOXES',
    quantity: null,
    boxesQty: null,
    note: null,
  }));
};

watch(
  () => props.show,
  (open) => {
    if (!open) return;

    clearItemErrors();
    serverErrors.value = { hasErrors: false, message: '' };

    resetForm({
      values: { items: getInitialRows() },
    });
  },
  { immediate: true },
);

const close = () => emit('closeModal');

// validação semântica: exige quantidade conforme o mode
const validateItems = (rows: RestockRow[]): boolean => {
  clearItemErrors();

  let hasAnyValid = false;

  rows.forEach((r) => {
    // modo obrigatório (já vem do schema mas mantemos mensagem por item)
    if (!r.mode) {
      setItemError(r.eventBeverageId, { mode: 'Modo é obrigatório.' });
      return;
    }

    if (r.mode === 'UNITS') {
      // deve preencher quantity > 0
      if (r.quantity === null || r.quantity === undefined || r.quantity <= 0) {
        setItemError(r.eventBeverageId, {
          quantity: 'Indique uma quantidade válida em unidades.',
        });
      } else {
        hasAnyValid = true;
      }
    }

    if (r.mode === 'BOXES') {
      // deve preencher boxesQty > 0
      if (r.boxesQty === null || r.boxesQty === undefined || r.boxesQty <= 0) {
        setItemError(r.eventBeverageId, {
          boxesQty: 'Indique uma quantidade válida em caixas.',
        });
      } else {
        hasAnyValid = true;
      }
    }
  });

  // se não tiver nada válido, erro geral
  if (!hasAnyValid) {
    serverErrors.value = {
      hasErrors: true,
      message: 'Indique pelo menos uma bebida com quantidade válida.',
    };
  }

  return Object.keys(itemErrors.value).length === 0 && hasAnyValid;
};

const onSubmit = handleSubmit(async (values) => {
  serverErrors.value = { hasErrors: false, message: '' };

  try {
    const rows = values.items ?? [];

    // validação semântica e mostrar erros por item
    const ok = validateItems(rows);
    if (!ok) return;

    // transformar para DTO (sem mode!)
    const dtoItems: RestockBeveragesInput['items'] = rows.map((r) => ({
      eventBeverageId: r.eventBeverageId,
      quantity: r.mode === 'UNITS' ? r.quantity : null,
      boxesQty: r.mode === 'BOXES' ? r.boxesQty : null,
      note: r.note ?? null,
    }));

    await beverageService.restock(props.eventId, {
      note: 'Abastecimento',
      items: dtoItems,
    });

    toast.success('Abastecimento registado com sucesso');
    emit('success');
    close();
  } catch (err: unknown) {
    console.error(err);
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao abastecer';
    }
    serverErrors.value.hasErrors = true;
  }
});
</script>

<template>
  <BaseModal :show="props.show" title="Abastecer" @close-modal="close">
    <form @submit.prevent="onSubmit">
      <p class="text-grey-700 text-sm">
        Indique as quantidades a adicionar. Pode usar unidades ou caixas (quando
        aplicável).
      </p>

      <div v-bind="itemsAttrs" class="mt-4 space-y-3">
        <div
          v-for="r in items"
          :key="r.eventBeverageId"
          class="border-grey-200 rounded-md border p-3"
        >
          <div class="flex items-center justify-between">
            <p class="text-grey-900 font-bold">
              {{
                props.candidates?.find((x) => x.id === r.eventBeverageId)
                  ?.name ?? '-'
              }}
            </p>

            <BaseBadge
              :variant="
                (props.candidates?.find((x) => x.id === r.eventBeverageId)
                  ?.status ?? 'OK') === 'OK'
                  ? 'success'
                  : (props.candidates?.find((x) => x.id === r.eventBeverageId)
                        ?.status ?? 'OK') === 'Low'
                    ? 'warning'
                    : 'danger'
              "
              :text="
                (props.candidates?.find((x) => x.id === r.eventBeverageId)
                  ?.status ?? 'OK') === 'OK'
                  ? 'OK'
                  : (props.candidates?.find((x) => x.id === r.eventBeverageId)
                        ?.status ?? 'OK') === 'Low'
                    ? 'Baixo'
                    : 'Sem stock'
              "
            />
          </div>

          <div class="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <BaseSelect
                :id="`mode-${r.eventBeverageId}`"
                v-model="r.mode"
                label="Modo:"
                :options="modeOptions"
                :disabled="isSubmitting"
              />
              <BaseError
                v-if="itemErrors[r.eventBeverageId]?.mode"
                class="mt-1"
              >
                {{ itemErrors[r.eventBeverageId]?.mode }}
              </BaseError>
            </div>

            <div v-if="r.mode === 'UNITS'">
              <BaseInput
                :id="`qty-${r.eventBeverageId}`"
                v-model.number="r.quantity"
                label="Unidades:"
                type="number"
                :readonly="isSubmitting"
              />
              <BaseError
                v-if="itemErrors[r.eventBeverageId]?.quantity"
                class="mt-1"
              >
                {{ itemErrors[r.eventBeverageId]?.quantity }}
              </BaseError>
            </div>

            <div v-else>
              <BaseInput
                :id="`boxes-${r.eventBeverageId}`"
                v-model.number="r.boxesQty"
                label="Caixas:"
                type="number"
                :readonly="isSubmitting"
              />
              <BaseError
                v-if="itemErrors[r.eventBeverageId]?.boxesQty"
                class="mt-1"
              >
                {{ itemErrors[r.eventBeverageId]?.boxesQty }}
              </BaseError>
            </div>
          </div>
        </div>
      </div>

      <BaseError v-if="serverErrors.hasErrors" class="mt-3">
        {{ serverErrors.message }}
      </BaseError>

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
          {{ isSubmitting ? 'A guardar...' : 'Confirmar abastecimento' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
