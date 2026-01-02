<script setup lang="ts">
import { useToast } from 'vue-toastification';

const toast = useToast();

const queryParameters = reactive<SupplierCatalogParameters>({
  searchQuery: '',
  pageNumber: 1,
  pageSize: 12,
  isActive: undefined,
});

const { catalogItems, pagination, isRefreshing, isError, refreshCatalog } =
  await useSupplierCatalogList(queryParameters);

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
  { id: '', name: 'Mostrar todos estados' },
  { id: 'true', name: 'Activo' },
  { id: 'false', name: 'Inactivo' },
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
    toast.error('Ocorreu um erro ao carregar o catálogo de fornecedores');
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
            label="Pesquisa:"
            placeholder="Filtre por nome, papel ou contacto..."
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
                    ? '1 Item'
                    : `${pagination ? pagination.totalCount : 0} Itens`
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
            Adicionar ao catálogo
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
        Infelizmente, não encontramos fornecedores para o filtro aplicado
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-catalog"
        title="Ainda não tem fornecedores no catálogo"
        description="Adicione fornecedores ao catálogo para facilitar a criação de eventos futuros."
        :show-button="true"
        button-label="Adicionar primeiro fornecedor"
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
            <th scope="col">Fornecedor</th>
            <th scope="col" class="hidden md:table-cell">Contacto</th>
            <th scope="col">Estado</th>
            <th scope="col">Acções</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="it in catalogItems" :key="it.id">
            <td>
              <div class="flex-col gap-1">
                <p class="mb-0">{{ it.name }}</p>
                <small class="text-grey-400">{{ it.job_Description }}</small>
              </div>
            </td>

            <td class="hidden md:table-cell">{{ it.phone ?? '-' }}</td>

            <td>
              <BaseBadge
                :type="it.isActive ? 'success' : 'default'"
                :text="it.isActive ? 'Activo' : 'Inactivo'"
              />
            </td>

            <td>
              <div class="my-2 flex items-center gap-3">
                <button
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  title="Editar"
                  @click.stop="openEditModal(it)"
                >
                  <IconPencil :font-controlled="false" class="size-4" />
                </button>

                <button
                  type="button"
                  class="text-grey-500 transition hover:text-red-600"
                  title="Remover"
                  @click.stop="openRemoveModal(it)"
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
