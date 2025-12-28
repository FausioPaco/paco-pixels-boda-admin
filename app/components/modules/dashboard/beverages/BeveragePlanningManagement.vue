<script setup lang="ts">
import { useToast } from 'vue-toastification';

const toast = useToast();

const { eventId } = useEventStore();
const queryParameters = reactive<EventBeveragesParameters>({
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
  { id: '', name: 'Mostrar todos estados' },
  { id: 'OK', name: 'OK' },
  { id: 'LOW', name: 'Baixo' },
  { id: 'OUTOFSTOCK', name: 'Sem stock' },
]);

const categoryOptions = computed<SelectOption[]>(() => {
  const items = categories?.value ?? [];
  return [
    { id: '', name: 'Mostrar todas categorias' },
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
    toast.error('Ocorreu um erro ao carregar as bebidas');
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
            label="Pesquisa:"
            placeholder="Filtre categorias ou itens..."
            :readonly="isRefreshing"
          />

          <BaseSelect
            id="beverageCategory"
            label="Categoria:"
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
            label="Estado:"
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
                    ? '1 Bebida'
                    : `${pagination ? pagination.totalCount : 0} Bebidas`
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
            Adicionar bebida
          </BaseButton>
        </div>
      </div>

      <!-- Stats cards -->
      <div
        v-if="!isRefreshing && !isError && pageStats"
        class="mt-4 grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <BaseMiniStatCard
          title="Total de bebidas"
          :value="pageStats.totalBeverages"
          icon="beverage"
        />
        <BaseMiniStatCard
          title="Unidades em estoque"
          :value="pageStats.unitsInStock"
          icon="beverage-stock"
        />
        <BaseMiniStatCard
          title="Fora do estoque"
          :value="pageStats.outOfStock"
          icon="warning"
        />
        <BaseMiniStatCard
          title="Precisa de reabastecimento"
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
        Infelizmente, não encontramos bebidas para o filtro aplicado
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-beverage"
        title="Ainda não registou bebidas"
        description="Adicione bebidas para controlar o inventário e gerir o consumo no dia do evento."
        :show-button="true"
        button-label="Adicionar primeira bebida"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (beverages?.length ?? 0) > 0"
        summary="Tabela sobre a lista de bebidas do evento"
      >
        <template #thead>
          <tr>
            <th scope="col">Bebida</th>
            <th scope="col" class="hidden md:table-cell">Categoria</th>
            <th scope="col" class="hidden md:table-cell">Por caixa</th>
            <th scope="col" class="hidden md:table-cell">Caixas</th>
            <th scope="col">Estoque inicial</th>
            <th scope="col">Disponível</th>
            <th scope="col">Mínimo</th>
            <th scope="col">Estado</th>
            <th scope="col">Acções</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="bev in beverages" :key="bev.id">
            <td>{{ bev.name }}</td>
            <td class="hidden md:table-cell">{{ bev.beverageCategoryName }}</td>
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
                    ? 'OK'
                    : bev.status === 'Low'
                      ? 'Baixo'
                      : 'Sem stock'
                "
              />
            </td>
            <td>
              <div class="my-2 flex items-center gap-3">
                <button
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  title="Editar"
                  @click.stop="openEditModal(bev)"
                >
                  <IconPencil :font-controlled="false" class="size-4" />
                </button>

                <button
                  type="button"
                  class="text-grey-500 transition hover:text-red-600"
                  title="Remover"
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
