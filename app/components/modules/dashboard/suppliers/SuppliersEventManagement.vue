<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getSupplierService } from '~/services/supplierService';

type SupplierAction = 'confirm' | 'arrive' | 'absent' | 'unconfirm';
const actionLoading = ref<{
  supplierId: number;
  action: SupplierAction;
} | null>(null);

const toast = useToast();
const nuxtApp = useNuxtApp();
const supplierService = getSupplierService(nuxtApp.$api);
const { t } = useI18n();

const { eventId } = useEventStore();

const queryParameters = reactive<SupplierParameters>({
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 10,
  eventId: eventId!,
});

const { suppliers, pagination, isRefreshing, isError, refreshSuppliers } =
  await useSuppliersList(queryParameters);

onMounted(async () => {
  await refreshSuppliers({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => debouncedSearch());

watch(queryParameters, () => {
  refreshSuppliers({ force: true });
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}
function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    (suppliers.value?.length ?? 0) === 0 &&
    searchQuery.value === '',
);

// Modais
const showUpsertModal = ref(false);
const showRemoveModal = ref(false);
const selectedSupplier = ref<Supplier | null>(null);

const openCreateModal = () => {
  selectedSupplier.value = null;
  showUpsertModal.value = true;
};

const openEditModal = (s: Supplier) => {
  selectedSupplier.value = s;
  showUpsertModal.value = true;
};

const openRemoveModal = (s: Supplier) => {
  selectedSupplier.value = s;
  showRemoveModal.value = true;
};

const isLoading = (s: Supplier, action: SupplierAction) =>
  actionLoading.value?.supplierId === Number(s.id) &&
  actionLoading.value?.action === action;

const setLoading = (s: Supplier, action: SupplierAction) => {
  actionLoading.value = { supplierId: Number(s.id), action };
};
const clearLoading = () => (actionLoading.value = null);

const onConfirm = async (s: Supplier) => {
  try {
    setLoading(s, 'confirm');
    await supplierService.confirmSupplier(s.id);
    toast.success(t('suppliers.confirmed_success'));
    await refreshSuppliers({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('suppliers.confirm_error'));
  } finally {
    clearLoading();
  }
};

const onArrive = async (s: Supplier) => {
  try {
    setLoading(s, 'arrive');
    await supplierService.arriveSupplier(s.id);
    toast.success(t('suppliers.arrival_registered'));
    await refreshSuppliers({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('suppliers.arrival_error'));
  } finally {
    clearLoading();
  }
};

const onAbsent = async (s: Supplier) => {
  try {
    setLoading(s, 'absent');
    await supplierService.absentSupplier(s.id);
    toast.success(t('suppliers.absent_registered'));
    await refreshSuppliers({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('suppliers.absent_error'));
  } finally {
    clearLoading();
  }
};

const onUnconfirm = async (s: Supplier) => {
  try {
    setLoading(s, 'unconfirm');
    await supplierService.unconfirmSupplier(s.id);

    if (s.isArrived) toast.success(t('suppliers.arrival_removed'));
    else if (s.isConfirmed) toast.success(t('suppliers.unconfirmed_success'));
    else if (s.isAbsent) toast.success(t('suppliers.absence_removed'));
    else toast.success(t('suppliers.status_updated'));

    await refreshSuppliers({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('suppliers.update_error'));
  } finally {
    clearLoading();
  }
};

const unconfirmTooltip = (s: Supplier) => {
  if (s.isArrived) return t('suppliers.tooltip_remove_arrival');
  if (s.isConfirmed) return t('suppliers.tooltip_unconfirm');
  if (s.isAbsent) return t('suppliers.tooltip_remove_absence');
  return t('suppliers.tooltip_update_status');
};

const absenceRowClass = (s: Supplier) => {
  if (s.isAbsent) {
    return 'opacity-60 grayscale';
  }
  return '';
};

const { eventInitials } = useEventStore();
const isExporting = ref<boolean>(false);

const exportSuppliersToPdf = async () => {
  try {
    isExporting.value = true;
    const blob = await supplierService.exportSuppliersAsPdf(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Fornecedores_${eventInitials}_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.pdf`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    isExporting.value = false;
  } catch (err) {
    console.error('Erro ao exportar os fornecedores:', err);
    toast.error(t('suppliers.export_error'));
    isExporting.value = false;
  }
};
</script>

<template>
  <section
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Toolbar -->
      <div
        class="flex w-full animate-fadeIn flex-col lg:flex-row lg:justify-between"
      >
        <div class="w-full lg:w-1/2">
          <BaseInput
            id="supplierSearch"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="supplierSearch"
            :label="t('suppliers.search_label')"
            :placeholder="t('suppliers.search_placeholder')"
            :readonly="isRefreshing"
          />

          <div v-if="!isRefreshing" class="flex items-center justify-between">
            <div class="my-4 flex items-center space-x-2">
              <icon-funnel
                :font-controlled="false"
                class="text-primary-700 block h-7 w-7"
              />
              <h3 class="text-primary-700 text-2xl font-bold">
                {{
                  (pagination?.totalCount ?? 0) === 1
                    ? '1 Fornecedor'
                    : `${pagination ? pagination.totalCount : 0} Fornecedores`
                }}
              </h3>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 lg:w-1/2 lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:pt-5"
        >
          <BaseButton
            v-if="(suppliers?.length ?? 0) > 0"
            btn-size="sm"
            icon="download"
            btn-type="outline-primary"
            :loading="isExporting"
            :disabled="isExporting"
            @click="exportSuppliersToPdf"
          >
            {{ t('suppliers.export_pdf') }}
          </BaseButton>

          <BaseButton
            icon="add"
            btn-size="sm"
            btn-type="primary"
            @click.prevent="openCreateModal"
          >
            {{ t('suppliers.add') }}
          </BaseButton>
        </div>
      </div>

      <!-- Loading -->
      <BaseTableLoading v-if="isRefreshing" class="hidden md:block" />
      <BaseLoading
        v-if="isRefreshing"
        size="lg"
        orientation="vertical"
        class="block md:hidden"
      />

      <!-- SearchNotFound -->
      <BaseSearchNotFound
        v-if="!isFirstTime && (suppliers?.length ?? 0) === 0 && !isRefreshing"
        @fallback="() => refreshSuppliers({ force: true })"
      >
        {{ t('suppliers.not_found') }}
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-suppliers-event"
        :title="t('suppliers.empty_title')"
        :description="t('suppliers.empty_description')"
        :show-button="true"
        :button-label="t('suppliers.empty_button')"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (suppliers?.length ?? 0) > 0"
        summary="Tabela sobre a lista de fornecedores do evento"
      >
        <template #thead>
          <tr>
            <th scope="col">{{ t('suppliers.table_supplier') }}</th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('suppliers.table_contact') }}
            </th>
            <th scope="col" class="hidden lg:table-cell">
              {{ t('suppliers.table_price') }}
            </th>
            <th scope="col">{{ t('suppliers.table_presence') }}</th>
            <th scope="col">{{ t('suppliers.table_arrival') }}</th>
            <th scope="col">{{ t('suppliers.table_actions') }}</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="s in suppliers" :key="s.id" :class="absenceRowClass(s)">
            <td class="flex items-start gap-3">
              <div class="flex-col gap-1">
                <p class="mb-0">
                  {{ s.name }}
                </p>

                <small class="text-grey-400">{{ s.job_Description }}</small>
              </div>
              <SuppliersStatusIcon :supplier="s" />
            </td>

            <td class="hidden md:table-cell">
              {{ s.phone ?? '-' }}
            </td>

            <td class="hidden lg:table-cell">
              {{ s.price ? formatMoney(s.price, 'MZN') : '-' }}
            </td>
            <td>
              <div class="flex items-center gap-2">
                <!-- Confirmar presença -->
                <BaseTooltip
                  v-if="!s.isConfirmed && !s.isAbsent"
                  :text="t('suppliers.tooltip_confirm')"
                  placement="top"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="bg-primary-50 hover:bg-primary-100 inline-flex items-center rounded-md px-3.5 py-2 transition disabled:opacity-50"
                      :disabled="isLoading(s, 'confirm')"
                      @click.stop="onConfirm(s)"
                    >
                      <IconCheckmark
                        :font-controlled="false"
                        class="text-primary-700 size-[14px]"
                      />
                    </button>
                  </template>
                </BaseTooltip>

                <!-- Registar chegada -->
                <BaseTooltip
                  v-if="!s.isArrived && !s.isAbsent"
                  :text="t('suppliers.tooltip_arrive')"
                  placement="top"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="bg-success-50 hover:bg-success-100 inline-flex items-center rounded-md px-3.5 py-2 transition disabled:opacity-50"
                      :disabled="isLoading(s, 'arrive')"
                      @click.stop="onArrive(s)"
                    >
                      <IconDoorEnter
                        :font-controlled="false"
                        class="text-success-700 size-[14px]"
                      />
                    </button>
                  </template>
                </BaseTooltip>

                <!-- Declarar ausência -->
                <BaseTooltip
                  v-if="!s.isAbsent"
                  :text="t('suppliers.tooltip_absent')"
                  placement="top"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="bg-danger-50 hover:bg-danger-100 inline-flex items-center rounded-md px-3.5 py-2 transition disabled:opacity-50"
                      :disabled="isLoading(s, 'absent')"
                      @click.stop="onAbsent(s)"
                    >
                      <IconCloseSimple
                        :font-controlled="false"
                        class="text-danger-600 size-[14px]"
                      />
                    </button>
                  </template>
                </BaseTooltip>

                <!-- Desconfirmar (UNDO contextual) -->
                <BaseTooltip
                  v-if="s.isArrived || s.isConfirmed || s.isAbsent"
                  :text="unconfirmTooltip(s)"
                  placement="top"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="bg-grey-50 hover:bg-grey-100 inline-flex items-center rounded-md px-3.5 py-2 transition disabled:opacity-50"
                      :disabled="isLoading(s, 'unconfirm')"
                      @click.stop="onUnconfirm(s)"
                    >
                      <IconRefresh
                        :font-controlled="false"
                        class="text-grey-700 size-[14px]"
                      />
                    </button>
                  </template>
                </BaseTooltip>
              </div>
            </td>
            <td>
              {{ s.arrived_At ? formatDateWithTime(s.arrived_At) : '-' }}
            </td>

            <td>
              <div class="my-2 flex items-center gap-3">
                <BaseButton
                  btn-type="outline-primary"
                  icon="pencil"
                  btn-size="sm"
                  :icon-size="12"
                  @click.stop="openEditModal(s)"
                  >{{ t('suppliers.edit') }}
                </BaseButton>

                <BaseButton
                  btn-type="outline-primary"
                  icon="trash"
                  btn-size="sm"
                  :icon-size="12"
                  @click.stop="openRemoveModal(s)"
                  >{{ t('suppliers.remove') }}
                </BaseButton>
              </div>
            </td>
          </tr>
        </template>
      </BaseTable>

      <!-- Pagination -->
      <BasePagination
        v-if="pagination && pagination.totalPages > 1"
        :pagination-data="pagination"
        @page-change="onPageChange"
        @page-selected="onPageSelected"
      />
    </div>

    <!-- Modals -->
    <LazySupplierUpsertModal
      :show="showUpsertModal"
      :event-id="eventId!"
      :supplier="selectedSupplier"
      @close-modal="showUpsertModal = false"
      @success="
        showUpsertModal = false;
        refreshSuppliers({ force: true });
      "
    />

    <LazySupplierRemoveModal
      :show="showRemoveModal"
      :event-id="eventId!"
      :supplier="selectedSupplier"
      @close-modal="showRemoveModal = false"
      @success="
        showRemoveModal = false;
        refreshSuppliers({ force: true });
      "
    />
  </section>
</template>
