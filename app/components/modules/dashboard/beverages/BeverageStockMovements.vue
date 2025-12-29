<script setup lang="ts">
import {
  StockMovementIcons,
  type StockMovementType,
} from '~~/shared/types/beverage';

const props = defineProps<{
  eventId: number;
}>();

const movementParams = reactive({
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 10,
  eventId: props.eventId,
});

const {
  stockMovements,
  pagination,
  isRefreshing,
  isError,
  refreshStockMovements,
} = await useBeverageStockMovements(movementParams);

onMounted(() => {
  refreshStockMovements({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  movementParams.searchQuery = searchQuery.value;
  movementParams.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(movementParams, () => {
  refreshStockMovements({ force: true });
});

function onPageChange(newPage: number) {
  movementParams.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  movementParams.pageNumber = newPage;
}

function getMovementIcon(type: StockMovementType) {
  return StockMovementIcons[type];
}
</script>
<template>
  <div v-if="!isRefreshing && !isError" class="mt-20 w-full">
    <div class="border-primary-100 rounded-xl border p-4 md:p-5">
      <div class="mb-3 mt-2">
        <h4 class="text-xl font-bold">Registo de actividades</h4>
        <p class="text-grey-600">
          Movimentos recentes (consumo, ajustes e abastecimentos).
        </p>
      </div>

      <div v-if="!isRefreshing && !isError" class="w-full lg:w-1/2">
        <BaseInput
          id="beverageSearchStockMovements"
          v-model="searchQuery"
          autocomplete="off"
          type="search"
          name="beverageSearchEventDay"
          label="Pesquisa:"
          placeholder="Filtre categorias ou itens..."
          :readonly="isRefreshing"
          disable-margins
        />
      </div>

      <BaseLoading
        v-if="isRefreshing"
        size="md"
        orientation="horizontal"
        class="my-3"
      />

      <BaseSearchNotFound
        v-else-if="isError"
        @fallback="refreshStockMovements({ force: true })"
      >
        Não foi possível carregar o registo de actividades.
      </BaseSearchNotFound>

      <!-- Stock Movements List -->
      <div
        v-else
        class="divide-grey-100/60 animate-fadeIn space-y-3 divide-y p-3"
      >
        <div v-for="m in stockMovements" :key="m.id" class="pb-2 pt-3">
          <div class="flex items-center justify-between">
            <p class="text-grey-600 text-base font-semibold">
              {{ m.beverageName }}
            </p>

            <p class="text-grey-500 text-xs">
              {{ new Date(m.occurredAt).toLocaleString('pt-PT') }}
            </p>
          </div>

          <div class="mt-1 flex items-center justify-between">
            <p
              class="text-primary-700 flex items-center gap-2 text-sm font-semibold"
            >
              <component
                :is="`icon-${getMovementIcon(m.type)}`"
                :font-controlled="false"
                class="h-4 w-4"
              />
              <span v-if="m.type === 'Out'">Consumo</span>
              <span v-else-if="m.type === 'In'">Abastecimento</span>
              <span v-else-if="m.type === 'Adjust'">Ajuste</span>
              <span v-else>Fora do stock</span>

              <span v-if="m.type === 'Out'"> (-{{ m.quantity }})</span>
              <span v-else-if="m.type === 'In'"> (+{{ m.quantity }})</span>
            </p>

            <p class="text-grey-500 text-xs">
              {{ m.createdByName }}
            </p>
          </div>

          <p v-if="m.note" class="text-grey-300 mt-2 text-sm">
            {{ m.note }}
          </p>
        </div>

        <BaseSearchNotFound
          v-if="(stockMovements?.length ?? 0) === 0"
          @fallback="refreshStockMovements({ force: true })"
        >
          Ainda sem actividades registadas.
        </BaseSearchNotFound>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="pagination && pagination.totalPages > 1"
        :pagination-data="pagination"
        @page-change="onPageChange"
        @page-selected="onPageSelected"
      />
    </div>
  </div>
</template>
