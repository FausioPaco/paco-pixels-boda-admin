<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getSupplierService } from '~/services/supplierService';
import { isFetchErrorLike } from '~/utils/serverUtils';

const toast = useToast();
const nuxtApp = useNuxtApp();
const supplierService = getSupplierService(nuxtApp.$api);
const { t } = useI18n();

const queryParameters = reactive<SupplierCatalogParameters>({
  searchQuery: '',
  pageNumber: 1,
  pageSize: 12,
  isActive: undefined,
});

const { eventId } = useEventStore();

const { catalogItems, pagination, isRefreshing, isError, refreshCatalog } =
  await useSupplierCatalogList(queryParameters);

const { ids: eventCatalogIds, refreshIds } =
  await useEventSupplierCatalogItemIds(eventId!);

const eventCatalogIdsSet = computed(() => new Set(eventCatalogIds.value));

const isAlreadyAdded = (catalogItemId: number) =>
  eventCatalogIdsSet.value.has(catalogItemId);

onMounted(async () => {
  await refreshCatalog({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => debouncedSearch());

watch(queryParameters, () => {
  refreshCatalog({ force: true });
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}
function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const statusOptions = computed<SelectOption[]>(() => [
  { id: '', name: t('suppliers.catalog_status_all') },
  { id: 'true', name: t('suppliers.catalog_status_active') },
  { id: 'false', name: t('suppliers.catalog_status_inactive') },
]);

const onStatusChanged = (val: string) => {
  if (val === '') queryParameters.isActive = undefined;
  else queryParameters.isActive = val === 'true';
  queryParameters.pageNumber = 1;
};

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    (catalogItems.value?.length ?? 0) === 0 &&
    searchQuery.value === '' &&
    queryParameters.isActive === undefined,
);

// Modais
const showUpsertModal = ref(false);
const showRemoveModal = ref(false);
const selectedItem = ref<SupplierCatalogItem | null>(null);

const openCreateModal = () => {
  selectedItem.value = null;
  showUpsertModal.value = true;
};

const openEditModal = (it: SupplierCatalogItem) => {
  selectedItem.value = it;
  showUpsertModal.value = true;
};

const openRemoveModal = (it: SupplierCatalogItem) => {
  selectedItem.value = it;
  showRemoveModal.value = true;
};

const onRefresh = async () => {
  try {
    await refreshCatalog({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('suppliers.catalog_load_error'));
  }
};

const addingToEventId = ref<number | null>(null);

const addToEvent = async (it: SupplierCatalogItem) => {
  if (!eventId) {
    toast.error(t('suppliers.event_not_found'));
    return;
  }

  try {
    addingToEventId.value = it.id;
    await supplierService.addSupplierFromCatalogToEvent(it.id, eventId);
    await refreshIds({ force: true });

    eventCatalogIds.value = Array.from(
      new Set([...eventCatalogIds.value, it.id]),
    );

    toast.success(t('suppliers.catalog_added_success'));
  } catch (e) {
    console.error(e);
    toast.error(
      isFetchErrorLike(e)
        ? getServerErrors(e.data)
        : 'Ocorreu um erro ao adicionar o fornecedor ao evento',
    );

    // Se backend devolver 409 (duplicado)
    const status = isFetchErrorLike(e) ? e?.statusCode : null;

    if (status === 409) {
      toast.info(t('suppliers.catalog_duplicate'));
      return;
    }

    toast.error(t('suppliers.catalog_add_error'));
  } finally {
    addingToEventId.value = null;
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
            id="catalogSearch"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="catalogSearch"
            :label="t('suppliers.search_label')"
            :placeholder="t('suppliers.search_placeholder')"
            :readonly="isRefreshing"
          />

          <BaseSelect
            id="catalogStatus"
            label="Estado:"
            :options="statusOptions"
            :disabled="isRefreshing"
            :model-value="
              queryParameters.isActive === undefined
                ? ''
                : String(queryParameters.isActive)
            "
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
            icon="add"
            size="md"
            btn-type="primary"
            @click.prevent="openCreateModal"
          >
            {{ t('suppliers.catalog_add') }}
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
        v-if="
          !isFirstTime && (catalogItems?.length ?? 0) === 0 && !isRefreshing
        "
        @fallback="onRefresh"
      >
        {{ t('suppliers.catalog_not_found') }}
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-suppliers-catalog"
        :title="t('suppliers.catalog_empty_title')"
        :description="t('suppliers.catalog_empty_description')"
        :show-button="true"
        :button-label="t('suppliers.catalog_empty_button')"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (catalogItems?.length ?? 0) > 0"
        summary="Tabela sobre o catálogo de fornecedores"
      >
        <template #thead>
          <tr>
            <th scope="col">{{ t('suppliers.table_supplier') }}</th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('suppliers.table_contact') }}
            </th>
            <th scope="col" class="hidden md:table-cell">
              {{ t('suppliers.catalog_table_base_price') }}
            </th>
            <th scope="col">{{ t('suppliers.catalog_table_status') }}</th>
            <th scope="col">{{ t('suppliers.table_actions') }}</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="it in catalogItems" :key="it.id">
            <td>
              <div class="flex-col gap-1">
                <p class="mb-0 md:max-w-[250px]">{{ it.name }}</p>
                <small class="text-grey-400">{{ it.job_Description }}</small>
              </div>
            </td>
            <td class="hidden md:table-cell">{{ it.phone ?? '-' }}</td>
            <td class="hidden md:table-cell">
              {{ it.base_Price ? formatMoney(it.base_Price, 'MZN') : '-' }}
            </td>

            <td>
              <BaseBadge
                :type="it.isActive ? 'success' : 'default'"
                :text="
                  it.isActive
                    ? t('suppliers.catalog_active_badge')
                    : t('suppliers.catalog_inactive_badge')
                "
              />
            </td>

            <td>
              <div class="my-2 flex items-center gap-3">
                <BaseButton
                  btn-type="primary"
                  btn-size="sm"
                  :icon="isAlreadyAdded(it.id) ? 'checkmark' : 'add'"
                  :icon-size="12"
                  :disabled="
                    addingToEventId === it.id ||
                    !it.isActive ||
                    isAlreadyAdded(it.id)
                  "
                  :loading="addingToEventId === it.id"
                  @click.stop="addToEvent(it)"
                >
                  {{
                    isAlreadyAdded(it.id)
                      ? t('suppliers.catalog_already_added')
                      : t('suppliers.catalog_add_to_event')
                  }}
                </BaseButton>

                <BaseButton
                  btn-type="outline-primary"
                  icon="pencil"
                  btn-size="sm"
                  :icon-size="12"
                  @click.stop="openEditModal(it)"
                  >{{ t('suppliers.edit') }}
                </BaseButton>

                <BaseButton
                  btn-type="outline-primary"
                  icon="trash"
                  btn-size="sm"
                  :icon-size="12"
                  @click.stop="openRemoveModal(it)"
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
    <LazySupplierCatalogUpsertModal
      :show="showUpsertModal"
      :catalog-item="selectedItem"
      @close-modal="showUpsertModal = false"
      @success="
        showUpsertModal = false;
        refreshCatalog({ force: true });
      "
    />

    <LazySupplierCatalogRemoveModal
      :show="showRemoveModal"
      :catalog-item="selectedItem"
      @close-modal="showRemoveModal = false"
      @success="
        showRemoveModal = false;
        refreshCatalog({ force: true });
      "
    />
  </section>
</template>
