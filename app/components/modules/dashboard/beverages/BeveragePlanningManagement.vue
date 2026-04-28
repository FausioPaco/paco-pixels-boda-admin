<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

defineProps<{
  moduleStatus: EventBeverageStatus;
}>();

const toast = useToast();
const { t } = useI18n();

const { eventId } = useEventStore();
const queryParameters = reactive<EventBeveragesParameters>({
  eventId: eventId!,
  categoryId: undefined,
  stockStatus: '',
  searchQuery: '',
  pageNumber: 1,
  pageSize: 8,
  startDate: undefined,
  endDate: undefined,
});

const { beverages, pagination, isRefreshing, isError, refreshEventBeverages } =
  await useEventBeveragesList(queryParameters);

const { categories, refreshCategories } = await useBeverageCategoriesList({
  parameters: {
    pageNumber: 1,
    pageSize: 200,
    searchQuery: '',
  },
});

onMounted(async () => {
  await refreshCategories?.({ force: true });
  await refreshEventBeverages({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(queryParameters, () => {
  refreshEventBeverages({ force: true });
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const statusOptions = computed<SelectOption[]>(() => [
  { id: '', name: t('beverages.status_all') },
  { id: 'OK', name: t('beverages.status_ok') },
  { id: 'LOW', name: t('beverages.status_low') },
  { id: 'OUTOFSTOCK', name: t('beverages.status_out_of_stock') },
]);

const categoryOptions = computed<SelectOption[]>(() => {
  const items = categories?.value ?? [];
  return [
    { id: '', name: t('beverages.category_all') },
    ...items.map((c) => ({ id: String(c.id), name: c.name })),
  ];
});

const isFirstTime = computed(
  () =>
    !isRefreshing.value &&
    !isError.value &&
    (beverages.value?.length ?? 0) === 0 &&
    searchQuery.value === '' &&
    !queryParameters.categoryId &&
    !queryParameters.stockStatus,
);

// Modais
const showUpsertModal = ref(false);
const showRemoveModal = ref(false);
const selectedBeverage = ref<EventBeverage | null>(null);

const openCreateModal = () => {
  selectedBeverage.value = null;
  showUpsertModal.value = true;
};

const openEditModal = (bev: EventBeverage) => {
  selectedBeverage.value = bev;
  showUpsertModal.value = true;
};

const openRemoveModal = (bev: EventBeverage) => {
  selectedBeverage.value = bev;
  showRemoveModal.value = true;
};

const pageStats = computed(() => {
  const list = beverages.value ?? [];

  const totalBeverages = pagination.value?.totalCount ?? list.length;

  const unitsInStock = list.reduce((acc, x) => acc + (x.currentUnits ?? 0), 0);
  const outOfStock = list.filter((x) => x.status === 'OutOfStock').length;
  const needsRestock = list.filter((x) => x.status === 'Low').length;

  return {
    totalBeverages,
    unitsInStock,
    outOfStock,
    needsRestock,
  };
});

const onCategoryChanged = (val: string) => {
  queryParameters.categoryId = val ? Number(val) : null;
  queryParameters.pageNumber = 1;
};

const onStatusChanged = (val: EventBeverageStockStatus) => {
  queryParameters.stockStatus = val;
  queryParameters.pageNumber = 1;
};

const onRefresh = async () => {
  try {
    await refreshEventBeverages({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_load_error'));
  }
};

const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);
const isExporting = ref(false);

const exportBeverages = async () => {
  try {
    isExporting.value = true;

    const blob = await beverageService.exportEventBeverages(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Bebidas_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao exportar as bebidas:', err);
    toast.error(t('beverages.toast_export_error'));
  } finally {
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
            id="beverageSearch"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="beverageSearch"
            :label="t('beverages.search_label')"
            :placeholder="t('beverages.search_placeholder')"
            :readonly="isRefreshing"
          />

          <BaseSelect
            id="beverageCategory"
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

          <BaseSelect
            id="beverageStatus"
            :label="t('beverages.form_state_label')"
            :options="statusOptions"
            :disabled="isRefreshing"
            :model-value="queryParameters.stockStatus ?? ''"
            disable-empty
            @update:model-value="onStatusChanged"
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
                    ? t('beverages.count_one')
                    : t('beverages.count_other', {
                        n: pagination ? pagination.totalCount : 0,
                      })
                }}
              </h3>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 lg:w-1/2 lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:pt-5"
        >
          <BaseButton
            icon="add"
            size="md"
            btn-type="primary"
            @click.prevent="openCreateModal"
          >
            {{ t('beverages.button_add_beverage') }}
          </BaseButton>
          <BaseButton
            v-if="(beverages?.length ?? 0) > 0"
            btn-type="outline-primary"
            btn-size="md"
            icon="download"
            :disabled="isExporting"
            @click="exportBeverages"
          >
            {{
              isExporting
                ? t('beverages.button_export_loading')
                : t('beverages.button_export')
            }}
          </BaseButton>
        </div>
      </div>

      <!-- Stats cards -->
      <div
        v-if="!isRefreshing && !isError && pageStats"
        class="mt-4 grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <BaseMiniStatCard
          :title="t('beverages.stat_total_beverages')"
          :value="pageStats.totalBeverages"
          icon="beverage"
        />
        <BaseMiniStatCard
          :title="t('beverages.stat_units_in_stock')"
          :value="pageStats.unitsInStock"
          icon="beverage-stock"
        />
        <BaseMiniStatCard
          :title="t('beverages.stat_out_of_stock')"
          :value="pageStats.outOfStock"
          icon="warning"
        />
        <BaseMiniStatCard
          :title="t('beverages.stat_needs_restock')"
          :value="pageStats.needsRestock"
          icon="restock"
        />
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
        v-if="!isFirstTime && (beverages?.length ?? 0) === 0 && !isRefreshing"
        @fallback="onRefresh"
      >
        {{ t('beverages.search_not_found') }}
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-beverage"
        :title="t('beverages.empty_title')"
        :description="t('beverages.empty_description')"
        :show-button="true"
        :button-label="t('beverages.empty_button')"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (beverages?.length ?? 0) > 0"
        :summary="t('beverages.table_summary')"
      >
        <template #thead>
          <tr>
            <th scope="col">{{ t('beverages.table_beverage') }}</th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('beverages.table_units_per_box') }}
            </th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('beverages.table_boxes') }}
            </th>
            <th scope="col">{{ t('beverages.table_initial_stock') }}</th>
            <th scope="col">{{ t('beverages.table_available') }}</th>
            <th scope="col">{{ t('beverages.table_minimum') }}</th>
            <th scope="col">{{ t('beverages.table_state') }}</th>
            <th scope="col">{{ t('beverages.table_actions') }}</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="bev in beverages" :key="bev.id">
            <td>
              <div class="flex-col gap-1">
                <p class="mb-0">{{ bev.name }}</p>
                <small class="text-grey-400">
                  {{ bev.beverageCategoryName }}</small
                >
              </div>
            </td>
            <td class="hidden md:table-cell">{{ bev.unitsPerBox ?? '-' }}</td>
            <td class="hidden md:table-cell">{{ bev.boxesQty ?? '-' }}</td>
            <td>{{ bev.initialUnits ?? 0 }}</td>
            <td>{{ bev.currentUnits ?? 0 }}</td>
            <td>{{ bev.minimumUnits ?? 0 }}</td>
            <td>
              <BaseBadge
                :type="
                  bev.status === 'OK'
                    ? 'success'
                    : bev.status === 'Low'
                      ? 'warning'
                      : 'error'
                "
                :text="
                  bev.status === 'OK'
                    ? t('beverages.status_ok')
                    : bev.status === 'Low'
                      ? t('beverages.status_low')
                      : t('beverages.status_out_of_stock')
                "
              />
            </td>
            <td>
              <div class="my-2 flex items-center gap-3">
                <button
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  :title="t('common.edit')"
                  @click.stop="openEditModal(bev)"
                >
                  <IconPencil :font-controlled="false" class="size-4" />
                </button>

                <button
                  type="button"
                  class="text-grey-500 transition hover:text-red-600"
                  :title="t('common.delete')"
                  @click.stop="openRemoveModal(bev)"
                >
                  <IconTrash :font-controlled="false" class="size-4" />
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
    <LazyBeverageUpsertModal
      :show="showUpsertModal"
      :event-id="eventId!"
      :beverage="selectedBeverage"
      @close-modal="showUpsertModal = false"
      @success="
        showUpsertModal = false;
        refreshEventBeverages({ force: true });
      "
    />

    <LazyBeverageRemoveModal
      :show="showRemoveModal"
      :event-id="eventId!"
      :beverage="selectedBeverage"
      @close-modal="showRemoveModal = false"
      @success="
        showRemoveModal = false;
        refreshEventBeverages({ force: true });
      "
    />
  </section>
</template>
