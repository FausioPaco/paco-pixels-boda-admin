<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/yup';
import { number, object, string, mixed, date } from 'yup';
import { getBudgetService } from '~/services/budgetService';

type Mode = 'EVENT' | 'TEMPLATE';
type TabKey = 'DETAILS' | 'INSTALLMENTS';

interface Props {
  show?: boolean;
  mode: Mode;
  categoryId: number;
  item: BudgetItem | BudgetTemplateItem | undefined;
}

const props = withDefaults(defineProps<Props>(), { show: false });
const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

// ------------------------
// Tabs
// ------------------------
const activeTab = ref<TabKey>('DETAILS');

const showTabs = computed(() => props.mode === 'EVENT' && !!props.item);

watch(
  () => props.show,
  (open) => {
    if (!open) return;
    activeTab.value = 'DETAILS';
  },
  { immediate: true },
);

// ------------------------
// Form (Item)
// ------------------------
const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, 'O título deve ter pelo menos 2 caracteres.')
      .max(200)
      .required(),
    estimatedAmount: number().typeError('Valor inválido.').min(0).required(),
    actualCost: number().typeError('Valor inválido.').min(0).required(),
    paidAmount: number().typeError('Valor inválido.').min(0).required(),
    notes: string().trim().max(2000).optional(),
  }),
);

const { handleSubmit, resetForm, defineField, errors, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    estimatedAmount: 0,
    actualCost: 0,
    paidAmount: 0,
    notes: '',
  },
});

const [title, titleAttrs] = defineField('title');
const [estimatedAmount, estimatedAmountAttrs] = defineField('estimatedAmount');
const [actualCost, actualCostAttrs] = defineField('actualCost');
const [paidAmount, paidAmountAttrs] = defineField('paidAmount');
const [notes, notesAttrs] = defineField('notes');

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

// ------------------------
// Installments
// ------------------------
const installments = ref<BudgetItemInstallment[]>([]);
const isLoadingInstallments = ref(false);

const loadInstallments = async () => {
  if (!showTabs.value) return;

  try {
    isLoadingInstallments.value = true;
    installments.value = await budgetService.getInstallments(props.item!.id);

    // opcional: reflectir total pago imediatamente no form
    const sum = installments.value.reduce((acc, x) => acc + (x.amount ?? 0), 0);
    paidAmount.value = Number(sum.toFixed(2));
  } catch (e) {
    console.log(e);
  } finally {
    isLoadingInstallments.value = false;
  }
};

// Form inline para criar/editar prestação
const editingInstallmentId = ref<number | null>(null);
const instSchema = toTypedSchema(
  object({
    amount: number().typeError('Valor inválido.').min(0).required(),
    descriptive: string().required('A descrição da prestação é obrigatória.'),
    receiptDate: date().optional(),
    paidInDate: date().optional(),
    paymentMethod: mixed<BudgetPaymentMethod>().required(),
  }),
);

const {
  handleSubmit: handleSubmitInst,
  resetForm: resetInstallmentForm,
  defineField: defineFieldInst,
  errors: instErrors,
  isSubmitting: isSavingInstallment,
} = useForm({
  validationSchema: instSchema,
  initialValues: {
    amount: 0,
    receiptDate: undefined,
    paidInDate: undefined,
    paymentMethod: BudgetPaymentMethod.Deposit,
    descriptive: '',
  },
});

const [instAmount, instAmountAttrs] = defineFieldInst('amount');
const [instReceiptDate, instReceiptDateAttrs] = defineFieldInst('receiptDate');
const [instPaidInDate, instPaidInDateAttrs] = defineFieldInst('paidInDate');
const [instPaymentMethod, instPaymentMethodAttrs] =
  defineFieldInst('paymentMethod');
const [instDescriptive, instDescriptiveAttrs] = defineFieldInst('descriptive');

const showInstallmentForm = ref(false);

const startCreateInstallment = () => {
  editingInstallmentId.value = null;

  resetInstallmentForm({
    values: {
      amount: 0,
      receiptDate: undefined,
      paidInDate: undefined,
      paymentMethod: BudgetPaymentMethod.Deposit,
      descriptive: '',
    },
  });

  // showInstallmentForm.value = true;
};

const startEditInstallment = (p: BudgetItemInstallment) => {
  editingInstallmentId.value = p.id;
  resetInstallmentForm({
    values: {
      amount: p.amount ?? 0,
      receiptDate: p.receiptDate ?? undefined,
      paidInDate: p.paidInDate ?? undefined,
      paymentMethod: p.paymentMethod ?? BudgetPaymentMethod.Deposit,
      descriptive: p.descriptive ?? '',
    },
  });

  showInstallmentForm.value = true;
};

function cancelInstallmentEdit() {
  showInstallmentForm.value = false;
}

const saveInstallment = handleSubmitInst(async (values) => {
  if (!showTabs.value) return;

  try {
    if (!editingInstallmentId.value) {
      await budgetService.addInstallment(props.item!.id, { ...values });
      toast.success('Prestação adicionada.');
    } else {
      await budgetService.updateInstallment(editingInstallmentId.value, {
        ...values,
      });
      toast.success('Prestação actualizada.');
    }

    await loadInstallments();
    emit('saved'); // para refreshBudget no pai
    showInstallmentForm.value = false;
  } catch (e) {
    console.log(e);
    toast.error('Não foi possível guardar a prestação.');
  }
});

const removeInstallment = async (id: number) => {
  if (!showTabs.value) return;

  // confirmação simples (podemos depois trocar por BaseConfirm se tiveres)
  const ok = window.confirm('Remover esta prestação?');
  if (!ok) return;

  try {
    await budgetService.deleteInstallment(id);
    toast.success('Prestação removida.');
    await loadInstallments();
    emit('saved');
  } catch (e) {
    console.log(e);
    toast.error('Não foi possível remover a prestação.');
  }
};

// ------------------------
// Open modal: hydrate item + installments
// ------------------------
watch(
  () => props.show,
  async (open) => {
    if (!open) return;

    const i = props.item;

    resetForm({
      values: {
        title: i?.title ?? '',
        estimatedAmount: i?.estimatedAmount ?? 0,
        actualCost: i?.actualCost ?? 0,
        paidAmount: i?.paidAmount ?? 0,
        notes: i?.notes ?? '',
      },
    });

    // instalar tab + carregar prestações só quando EVENT e edit
    installments.value = [];
    startCreateInstallment();
    await loadInstallments();
  },
  { immediate: true },
);

const close = () => emit('close');

const onSubmitItem = handleSubmit(async (values) => {
  try {
    serverErrors.value.hasErrors = false;
    serverErrors.value.message = '';

    if (props.mode === 'EVENT') {
      if (!props.item) {
        await budgetService.addItem(props.categoryId, values);
        toast.success('Item criado.');
      } else {
        await budgetService.updateItem(props.item.id, values);
        toast.success('Item actualizado.');
      }
    } else {
      if (!props.item) {
        await budgetService.addTemplateItem(props.categoryId, values);
        toast.success('Item do modelo criado.');
      } else {
        await budgetService.updateTemplateItem(props.item.id, values);
        toast.success('Item do modelo actualizado.');
      }
    }

    emit('saved');
    close();
  } catch (e) {
    serverErrors.value.hasErrors = true;

    if (isFetchErrorLike(e)) {
      serverErrors.value.message = getServerErrors(e.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro inesperado.';
    }
  }
});
</script>

<template>
  <BaseModal
    :show="show"
    :title="item ? `Editar: ${item.title}` : 'Adicionar item'"
    size="large"
    @close-modal="close"
  >
    <BaseTab v-if="showTabs">
      <BaseTabItem
        id="budget-item-details"
        icon="budget"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'DETAILS'"
        class="w-full md:w-1/2"
        @click="activeTab = 'DETAILS'"
      >
        Detalhes do item
      </BaseTabItem>

      <BaseTabItem
        id="budget-item-installments"
        icon="installments"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'INSTALLMENTS'"
        class="w-full md:w-1/2"
        @click="activeTab = 'INSTALLMENTS'"
      >
        Prestações
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <div :key="activeTab" class="mt-4">
        <form v-if="activeTab === 'DETAILS'" @submit.prevent="onSubmitItem">
          <BaseInput
            id="budgetTitleItem"
            v-model="title"
            v-bind="titleAttrs"
            :error-message="errors.title"
            :readonly="isSubmitting"
            label="Título"
            placeholder="Ex: Organizador de casamento"
          />

          <BaseInput
            id="budgetEstimatedAmount"
            v-model="estimatedAmount"
            v-bind="estimatedAmountAttrs"
            :error-message="errors.estimatedAmount"
            :readonly="isSubmitting"
            label="Custo estimado"
            type="number"
            step="0.01"
          />

          <BaseInput
            id="budgetActualCost"
            v-model="actualCost"
            v-bind="actualCostAttrs"
            :error-message="errors.actualCost"
            :readonly="isSubmitting"
            label="Custo actual"
            type="number"
            step="0.01"
          />

          <BaseInput
            id="budgetPaidAmount"
            v-model="paidAmount"
            v-bind="paidAmountAttrs"
            :error-message="errors.paidAmount"
            helper-text="Calculado automaticamente a partir das prestações."
            label="Montante pago"
            type="number"
            step="0.01"
            :disabled="mode === 'EVENT'"
          />

          <BaseTextArea
            id="budgetNotes"
            v-model="notes"
            v-bind="notesAttrs"
            :error-message="errors.notes"
            :readonly="isSubmitting"
            label="Notas (opcional)"
            placeholder="Notas internas..."
          />

          <BaseError v-if="serverErrors.hasErrors">{{
            serverErrors.message
          }}</BaseError>

          <div class="flex w-full justify-center gap-3">
            <BaseButton
              type="button"
              btn-type="outline-primary"
              :disabled="isSubmitting"
              @click="close"
            >
              Cancelar
            </BaseButton>

            <BaseButton
              type="submit"
              :disabled="isSubmitting"
              :loading="isSubmitting"
            >
              Guardar
            </BaseButton>
          </div>
        </form>

        <div v-else>
          <div class="flex items-center justify-between">
            <p class="text-grey-400 text-lg font-semibold">
              Lista de prestações
            </p>

            <BaseButton
              type="button"
              icon="add"
              btn-size="sm"
              btn-type="outline-primary"
              :disabled="isSavingInstallment || isLoadingInstallments"
              @click="showInstallmentForm = true"
            >
              Nova prestação
            </BaseButton>
          </div>

          <BaseLoading v-if="isLoadingInstallments" class="mt-3" />

          <div v-else class="mt-3">
            <div
              v-if="installments.length === 0"
              class="text-grey-400 flex gap-2 text-sm"
            >
              <IconInstallments
                :font-controlled="false"
                class="inline size-6"
              />
              <span class="font-medium">Nenhuma prestação adicionada.</span>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="text-grey-500 text-xs">
                  <tr>
                    <th class="py-2 text-sm">Descritivo</th>
                    <th class="py-2 text-sm">Valor</th>
                    <th class="py-2 text-sm">Data do comprovativo</th>
                    <th class="py-2 text-sm">Data de entrada</th>
                    <th class="py-2 text-sm">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in installments"
                    :key="p.id"
                    class="border-grey-100 border-t"
                  >
                    <td class="py-2 text-sm">
                      {{ truncate(p.descriptive, 90) }}
                    </td>
                    <td class="py-2 text-sm">{{ formatMoney(p.amount) }}</td>
                    <td class="py-2 text-sm">
                      {{
                        p.receiptDate
                          ? formatDate(new Date(p.receiptDate))
                          : '—'
                      }}
                    </td>
                    <td class="py-2 text-sm">
                      {{
                        p.paidInDate ? formatDate(new Date(p.paidInDate)) : '—'
                      }}
                    </td>
                    <td class="py-2 text-sm">
                      {{
                        p.paymentMethod === BudgetPaymentMethod.Deposit
                          ? 'Depósito'
                          : 'Cash'
                      }}
                    </td>
                    <td class="py-2 text-sm">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="text-grey-500 hover:text-primary-700 transition"
                          title="Editar prestação"
                          @click="startEditInstallment(p)"
                        >
                          <IconPencil :font-controlled="false" class="size-4" />
                        </button>

                        <button
                          type="button"
                          class="text-grey-500 transition hover:text-red-600"
                          title="Remover prestação"
                          @click="removeInstallment(p.id)"
                        >
                          <IconTrash :font-controlled="false" class="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <transition name="inst-form" mode="out-in">
              <div
                v-if="showInstallmentForm"
                class="border-grey-100 mt-5 rounded-2xl border p-4"
              >
                <p class="text-grey-900 text-sm font-semibold">
                  {{
                    editingInstallmentId
                      ? 'Editar prestação'
                      : 'Adicionar prestação'
                  }}
                </p>

                <form class="mt-3" @submit.prevent="saveInstallment">
                  <BaseInput
                    id="instAmount"
                    v-model="instAmount"
                    v-bind="instAmountAttrs"
                    :error-message="instErrors.amount"
                    :readonly="isSavingInstallment"
                    label="Valor"
                    type="number"
                    step="0.01"
                  />

                  <div class="my-3">
                    <label class="mb-1 block text-sm font-medium"
                      >Data do comprovativo</label
                    >
                    <DatePicker
                      v-model="instReceiptDate"
                      v-bind="instReceiptDateAttrs"
                      locale="pt-PT"
                      :enable-time-picker="false"
                      :clearable="true"
                      :teleport="true"
                      :format="'dd/MM/yyyy'"
                      model-type="yyyy-MM-dd"
                      :auto-apply="true"
                      select-text="Selecionar"
                      cancel-text="Cancelar"
                      placeholder="Seleccione a data"
                    />
                    <p
                      v-if="instErrors.receiptDate"
                      class="text-danger-800 mt-1 animate-fadeIn text-sm"
                    >
                      {{ instErrors.receiptDate }}
                    </p>
                  </div>

                  <div class="my-3">
                    <label class="mb-1 block text-sm font-medium"
                      >Data de entrada</label
                    >
                    <DatePicker
                      v-model="instPaidInDate"
                      v-bind="instPaidInDateAttrs"
                      locale="pt-PT"
                      :enable-time-picker="false"
                      :clearable="true"
                      :teleport="true"
                      :format="'dd/MM/yyyy'"
                      model-type="yyyy-MM-dd"
                      :auto-apply="true"
                      select-text="Selecionar"
                      cancel-text="Cancelar"
                      placeholder="Seleccione a data"
                    />
                    <p
                      v-if="instErrors.paidInDate"
                      class="text-danger-800 mt-1 animate-fadeIn text-sm"
                    >
                      {{ instErrors.paidInDate }}
                    </p>
                  </div>

                  <BaseSelect
                    id="instPaymentMethod"
                    v-model="instPaymentMethod"
                    v-bind="instPaymentMethodAttrs"
                    :error-message="instErrors.paymentMethod"
                    :disabled="isSavingInstallment"
                    label="Forma de pagamento"
                    :options="BUDGET_PAYMENT_METHODS"
                  />

                  <BaseInput
                    id="instDescriptive"
                    v-model="instDescriptive"
                    v-bind="instDescriptiveAttrs"
                    :error-message="instErrors.descriptive"
                    :readonly="isSavingInstallment"
                    label="Descritivo:"
                    type="text"
                  />

                  <div class="mt-4 flex justify-center gap-3">
                    <BaseButton
                      type="button"
                      btn-type="outline-primary"
                      :disabled="isSavingInstallment"
                      @click="cancelInstallmentEdit"
                    >
                      Cancelar
                    </BaseButton>

                    <BaseButton
                      type="submit"
                      :disabled="isSavingInstallment"
                      :loading="isSavingInstallment"
                    >
                      Guardar prestação
                    </BaseButton>
                  </div>
                </form>
              </div>
            </transition>
          </div>

          <div class="mt-5 flex w-full justify-center">
            <BaseButton type="button" btn-type="outline-primary" @click="close">
              Fechar
            </BaseButton>
          </div>
        </div>
      </div>
    </transition>
  </BaseModal>
</template>
