<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

const props = defineProps<{
  moduleStatus: EventBeverageStatus;
}>();

const toast = useToast();
const { t } = useI18n();
const { eventId } = useEventStore();

const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isEventDayMode = computed(() => props.moduleStatus === 'EventDay');
const isClosed = computed(() => props.moduleStatus === 'Closed');
const isBlocked = computed(() => isEventDayMode.value || isClosed.value);
const showEventDayAlert = ref(isBlocked.value);

const queryParameters = reactive<EventBeverageEstimatesParameters>({
  eventId: eventId!,
  categoryId: undefined,
  includeConfirmed: true,
  searchQuery: '',
  pageNumber: 1,
  pageSize: 8,
});

const { estimates, pagination, isRefreshing, isError, refreshEstimates } =
  await useEventBeverageEstimatesList(queryParameters);

const { categories, isLoading: isRefreshingCategories } =
  await useBeverageCategoriesList({
    parameters: { pageNumber: 1, pageSize: 200, searchQuery: '' },
  });

watch(queryParameters, () => {
  refreshEstimates({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => debouncedSearch());

const categoryOptions = computed<SelectOption[]>(() => {
  const items = categories?.value ?? [];
  return [
    { id: '', name: t('beverages.category_all') },
    ...items.map((c) => ({ id: String(c.id), name: c.name })),
  ];
});

const onCategoryChanged = (val: string) => {
  queryParameters.categoryId = val ? Number(val) : null;
  queryParameters.pageNumber = 1;
};

const showConfirmedToggle = computed({
  get: () => !!queryParameters.includeConfirmed,
  set: (v: boolean) => {
    queryParameters.includeConfirmed = v;
    queryParameters.pageNumber = 1;
  },
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}
function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing.value &&
    !isError.value &&
    (estimates.value?.length ?? 0) === 0 &&
    searchQuery.value === '' &&
    !queryParameters.categoryId &&
    !queryParameters.includeConfirmed,
);

// Selection (checkboxes)
const selectedIds = ref<number[]>([]);

const allSelectedOnPage = computed(() => {
  const ids = (estimates.value ?? []).map((x) => x.id);
  if (ids.length === 0) return false;
  return ids.every((id: number) => selectedIds.value.includes(id));
});

const toggleSelectAllOnPage = (checked: boolean) => {
  const ids = (estimates.value ?? []).map((x) => x.id);
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((id) => !ids.includes(id));
    return;
  }
  const set = new Set(selectedIds.value);
  ids.forEach((id: number) => set.add(id));
  selectedIds.value = Array.from(set);
};

const toggleSelected = (id: number, checked: boolean) => {
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
    return;
  }
  if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
};

watch(
  () => queryParameters.pageNumber,
  () => {
    // mantém selecções globais, mas podes escolher limpar se preferires
  },
);

// Modais (vamos reutilizar o teu padrão)
const showUpsertModal = ref(false);
const showRemoveModal = ref(false);

const selectedEstimate = ref<EventBeverageEstimate | null>(null);

const openCreateModal = () => {
  selectedEstimate.value = null;
  showUpsertModal.value = true;
};

const openEditModal = (item: EventBeverageEstimate) => {
  selectedEstimate.value = item;
  showUpsertModal.value = true;
};

const openRemoveModal = (item: EventBeverageEstimate) => {
  selectedEstimate.value = item;
  showRemoveModal.value = true;
};

// Confirm/Unconfirm actions
const isBulkWorking = ref(false);

const isExporting = ref(false);

const exportEstimates = async () => {
  try {
    isExporting.value = true;

    const blob =
      await beverageService.exportEventBeverageEstimates(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Estimativas_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, '')}.xlsx`;

    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao exportar as estimativas:', err);
    toast.error(t('beverages.toast_export_estimates_error'));
  } finally {
    isExporting.value = false;
  }
};

const confirmSelected = async () => {
  if (isBlocked.value) return;
  if ((selectedIds.value?.length ?? 0) === 0) {
    toast.info(t('beverages.toast_no_selection'));
    return;
  }

  try {
    isBulkWorking.value = true;
    const res = await beverageService.confirmSelectedEventBeverageEstimates(
      eventId!,
      { estimateIds: selectedIds.value },
    );

    toast.success(
      res.createdCount === 1
        ? t('beverages.toast_estimate_confirmed_one')
        : t('beverages.toast_estimate_confirmed_other', {
            n: res.createdCount,
          }),
    );

    // após confirmar, pode acontecer que desapareçam (se includeConfirmed=false)
    selectedIds.value = [];
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_estimate_confirm_selected_error'));
  } finally {
    isBulkWorking.value = false;
  }
};

const unconfirmSelected = async () => {
  if (isBlocked.value) return;
  if ((selectedIds.value?.length ?? 0) === 0) {
    toast.info(t('beverages.toast_no_selection'));
    return;
  }

  try {
    isBulkWorking.value = true;
    const res = await beverageService.unconfirmSelectedEventBeverageEstimates(
      eventId!,
      { estimateIds: selectedIds.value },
    );

    if (res.unconfirmedCount > 0) {
      toast.success(
        res.unconfirmedCount === 1
          ? t('beverages.toast_estimate_unconfirmed_one')
          : t('beverages.toast_estimate_unconfirmed_other', {
              n: res.unconfirmedCount,
            }),
      );
    } else {
      toast.info(t('beverages.toast_estimate_unconfirmed_none'));
    }

    selectedIds.value = [];
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_estimate_unconfirm_selected_error'));
  } finally {
    isBulkWorking.value = false;
  }
};

const confirmSingle = async (item: EventBeverageEstimate) => {
  if (isBlocked.value) return;

  try {
    isBulkWorking.value = true;
    const res = await beverageService.confirmSelectedEventBeverageEstimates(
      eventId!,
      { estimateIds: [item.id] },
    );

    if (res.createdCount > 0) {
      toast.success(t('beverages.toast_estimate_confirmed_single'));
    }
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_estimate_confirm_error'));
  } finally {
    isBulkWorking.value = false;
  }
};

const unconfirmSingle = async (item: EventBeverageEstimate) => {
  if (isBlocked.value) return;

  try {
    isBulkWorking.value = true;
    await beverageService.unconfirmEventBeverageEstimate(eventId!, item.id);
    toast.success(t('beverages.toast_estimate_unconfirmed_single'));
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_estimate_unconfirm_error'));
  } finally {
    isBulkWorking.value = false;
  }
};

watch(isBlocked, (newVal) => {
  if (newVal) {
    showEventDayAlert.value = true;
  } else {
    showEventDayAlert.value = false;
  }
});
</script>

<template>
  <section
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Aviso (quando bloqueado) -->
      <BaseAlert
        v-if="isBlocked"
        :show="showEventDayAlert"
        :title="t('beverages.alert_estimates_readonly_title')"
        :message="t('beverages.alert_estimates_readonly_message')"
        type="informative"
        @close="showEventDayAlert = !showEventDayAlert"
      />

      <!-- Toolbar -->
      <div
        class="flex w-full animate-fadeIn flex-col lg:flex-row lg:justify-between"
      >
        <div class="w-full lg:w-1/2">
          <BaseInput
            id="estimateSearch"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="estimateSearch"
            :label="t('beverages.search_label')"
            :placeholder="t('beverages.search_placeholder')"
            :readonly="isRefreshing"
          />

          <BaseSelect
            v-if="!isRefreshingCategories"
            id="estimateCategory"
            :label="t('beverages.form_category_label')"
            :options="categoryOptions"
            :disabled="isRefreshing"
            :model-value="
              queryParameters.categoryId
                ? String(queryParameters.categoryId)
                : ''
            "
            disable-empty
            @update:model-value="onCategoryChanged"
          />

          <div class="mt-2 flex items-center justify-between">
            <BaseCheckbox
              id="toggleConfirmed"
              :model-value="showConfirmedToggle"
              :label="t('beverages.show_confirmed')"
              :disabled="isRefreshing"
              @update:model-value="(v: boolean) => (showConfirmedToggle = v)"
            />
          </div>

          <div v-if="!isRefreshing" class="flex items-center justify-between">
            <div class="my-4 flex items-center space-x-2">
              <icon-funnel
                :font-controlled="false"
                class="text-primary-700 block h-7 w-7"
              />
              <h3 class="text-primary-700 text-2xl font-bold">
                {{
                  (pagination?.totalCount ?? 0) === 1
                    ? t('beverages.count_estimate_one')
                    : t('beverages.count_estimate_other', {
                        n: pagination ? pagination.totalCount : 0,
                      })
                }}
              </h3>
            </div>
          </div>

          <BaseButton
            v-if="(estimates?.length ?? 0) > 0"
            btn-type="outline-primary"
            btn-size="sm"
            icon="download"
            :disabled="isRefreshing || isExporting"
            class="my-4 w-fit"
            @click="exportEstimates"
          >
            {{
              isExporting
                ? t('beverages.button_export_loading')
                : t('beverages.button_export_estimates')
            }}
          </BaseButton>
        </div>

        <div
          class="mt-4 flex w-full flex-col gap-4 lg:mt-2 lg:max-w-[60%] lg:items-end"
        >
          <BaseButton
            icon="add"
            btn-size="sm"
            btn-type="primary"
            :disabled="isBlocked || isRefreshing"
            class="w-fit"
            @click.prevent="openCreateModal"
          >
            {{ t('beverages.button_add_estimate') }}
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="double-check"
            :disabled="
              isBlocked ||
              isRefreshing ||
              isBulkWorking ||
              (selectedIds?.length ?? 0) === 0
            "
            class="w-fit"
            :loading="isBulkWorking"
            @click="confirmSelected"
          >
            {{ t('beverages.button_confirm_selected') }}
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="refresh"
            :disabled="
              isBlocked ||
              isRefreshing ||
              isBulkWorking ||
              (selectedIds?.length ?? 0) === 0
            "
            :loading="isBulkWorking"
            class="w-fit"
            @click="unconfirmSelected"
          >
            {{ t('beverages.button_unconfirm_selected') }}
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
        v-if="!isFirstTime && (estimates?.length ?? 0) === 0 && !isRefreshing"
        @fallback="refreshEstimates({ force: true })"
      >
        {{ t('beverages.estimates_search_not_found') }}
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-beverage"
        :title="t('beverages.empty_estimates_title')"
        :description="t('beverages.empty_estimates_description')"
        :show-button="true"
        :button-label="t('beverages.empty_estimates_button')"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (estimates?.length ?? 0) > 0"
        :summary="t('beverages.estimates_table_summary')"
      >
        <template #thead>
          <tr>
            <th scope="col" class="w-[40px]">
              <BaseCheckbox
                id="selectAllEstimates"
                :model-value="allSelectedOnPage"
                :disabled="isRefreshing"
                @update:model-value="(v: boolean) => toggleSelectAllOnPage(v)"
              />
            </th>
            <th scope="col">{{ t('beverages.table_beverage') }}</th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('beverages.table_units_per_box') }}
            </th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('beverages.table_boxes') }}
            </th>
            <th scope="col">{{ t('beverages.table_qty') }}</th>
            <th scope="col">{{ t('beverages.table_minimum') }}</th>
            <th scope="col">{{ t('beverages.table_state') }}</th>
            <th scope="col">{{ t('beverages.table_actions') }}</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="item in estimates" :key="item.id">
            <td>
              <BaseCheckbox
                :id="`sel-${item.id}`"
                :model-value="selectedIds.includes(item.id)"
                :disabled="isRefreshing"
                @update:model-value="(v: boolean) => toggleSelected(item.id, v)"
              />
            </td>

            <td>
              <div class="flex-col gap-1">
                <p class="mb-0">{{ item.name }}</p>
                <small class="text-grey-400">{{
                  item.beverageCategoryName
                }}</small>
              </div>
            </td>

            <td class="hidden md:table-cell">{{ item.unitsPerBox ?? '-' }}</td>
            <td class="hidden md:table-cell">{{ item.boxesQty ?? '-' }}</td>
            <td>{{ item.initialUnits ?? 0 }}</td>
            <td>{{ item.minimumUnits ?? 0 }}</td>

            <td>
              <BaseBadge
                :type="item.confirmed ? 'success' : 'default'"
                :text="
                  item.confirmed
                    ? t('beverages.badge_confirmed')
                    : t('beverages.badge_pending')
                "
                :icon="item.confirmed ? 'checkmark' : undefined"
              />
            </td>

            <td>
              <div class="my-2 flex items-center gap-3">
                <button
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  :title="t('common.edit')"
                  :disabled="isBlocked || item.confirmed"
                  @click.stop="openEditModal(item)"
                >
                  <IconPencil :font-controlled="false" class="size-4" />
                </button>

                <button
                  type="button"
                  class="text-grey-500 transition hover:text-red-600"
                  :title="t('common.delete')"
                  :disabled="isBlocked"
                  @click.stop="openRemoveModal(item)"
                >
                  <IconTrash :font-controlled="false" class="size-4" />
                </button>

                <button
                  v-if="!item.confirmed"
                  type="button"
                  class="text-grey-500 hover:text-success-600 transition"
                  :title="t('common.confirm')"
                  :disabled="isBlocked || isBulkWorking"
                  @click.stop="confirmSingle(item)"
                >
                  <IconCheckmark :font-controlled="false" class="size-4" />
                </button>

                <button
                  v-else
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  :title="t('beverages.tooltip_unconfirm')"
                  :disabled="isBlocked || isBulkWorking"
                  @click.stop="unconfirmSingle(item)"
                >
                  <IconRefresh :font-controlled="false" class="size-4" />
                </button>
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
    <LazyBeverageEstimateUpsertModal
      :show="showUpsertModal"
      :event-id="eventId!"
      :estimate="selectedEstimate"
      :module-status="props.moduleStatus"
      @close-modal="showUpsertModal = false"
      @success="
        showUpsertModal = false;
        refreshEstimates({ force: true });
      "
    />

    <LazyBeverageEstimateRemoveModal
      :show="showRemoveModal"
      :event-id="eventId!"
      :estimate="selectedEstimate"
      :module-status="props.moduleStatus"
      @close-modal="showRemoveModal = false"
      @success="
        showRemoveModal = false;
        refreshEstimates({ force: true });
      "
    />
  </section>
</template>
