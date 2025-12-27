<!-- components/beverages/BeverageEventDayManagement.vue -->
<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

const props = defineProps<{
  eventId: number;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const queryParameters = reactive<EventBeveragesParameters>({
  eventId: props.eventId,
  categoryId: null,
  stockStatus: '',
  searchQuery: '',
  pageNumber: 1,
  pageSize: 12,
});

const { beverages, pagination, isRefreshing, isError, refreshEventBeverages } =
  await useEventBeveragesList({ parameters: queryParameters });

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

onMounted(() => {
  refreshEventBeverages({ force: true });
});

// Quick actions
const isUpdating = ref<Record<number, boolean>>({});

const applyOut = async (bev: EventBeverage, quantity: number) => {
  try {
    isUpdating.value[bev.id] = true;

    const result = await beverageService.addStockMovement(
      props.eventId,
      bev.id,
      {
        type: BeverageStockMovementType.Out,
        quantity,
        note: `Consumo rápido (-${quantity})`,
      },
    );

    // actualizar localmente (evitar refresh total)
    if (!beverages.value) return;

    beverages.value = beverages.value.map((x) =>
      x.id === bev.id
        ? { ...x, currentUnits: result.currentUnits, status: result.status }
        : x,
    );
  } catch (e) {
    console.error(e);
    toast.error('Ocorreu um erro ao registar o consumo');
  } finally {
    isUpdating.value[bev.id] = false;
  }
};

const markOutOfStock = async (bev: EventBeverage) => {
  try {
    isUpdating.value[bev.id] = true;

    const result = await beverageService.addStockMovement(
      props.eventId,
      bev.id,
      {
        type: BeverageStockMovementType.MarkOutOfStock,
        quantity: 0,
        note: 'Marcado como fora do estoque',
      },
    );

    if (!beverages.value) return;

    beverages.value = beverages.value.map((x) =>
      x.id === bev.id
        ? { ...x, currentUnits: result.currentUnits, status: result.status }
        : x,
    );
  } catch (e) {
    console.error(e);
    toast.error('Ocorreu um erro ao marcar fora do estoque');
  } finally {
    isUpdating.value[bev.id] = false;
  }
};

// Modais
const showManualModal = ref(false);
const showRestockModal = ref(false);
const showRestockListModal = ref(false);

const selectedBeverage = ref<EventBeverage | null>(null);

const openManual = (bev: EventBeverage) => {
  selectedBeverage.value = bev;
  showManualModal.value = true;
};

const restockCandidates = computed(() => {
  const list = beverages.value ?? [];
  return list.filter((x) => x.status === 'Low' || x.status === 'OutOfStock');
});

const restockCount = computed(() => restockCandidates.value.length);

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}
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
            id="beverageSearchEventDay"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="beverageSearchEventDay"
            label="Pesquisa:"
            placeholder="Filtre categorias ou itens..."
            :readonly="isRefreshing"
          />
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 lg:w-1/2 lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:pt-5"
        >
          <BaseButton
            btn-type="outline-primary"
            btn-size="md"
            icon="list"
            :disabled="restockCount === 0"
            @click="showRestockListModal = true"
          >
            Ver lista de reposição ({{ restockCount }})
          </BaseButton>

          <BaseButton
            icon="add"
            size="md"
            btn-type="primary"
            @click.prevent="showRestockModal = true"
          >
            Abastecer
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

      <!-- Cards -->
      <div
        v-if="!isRefreshing && !isError"
        class="mt-5 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <BaseCard
          v-for="bev in beverages"
          :key="bev.id"
          :title="bev.name"
          :description="bev.beverageCategoryName ?? ''"
        >
          <div class="flex items-center justify-between">
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

            <p class="text-grey-500 text-sm">
              Estoque actual:
              <span class="text-grey-800 font-bold">{{
                bev.currentUnits ?? 0
              }}</span>
            </p>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-2">
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id]"
              @click="applyOut(bev, 1)"
            >
              -1
            </BaseButton>
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id]"
              @click="applyOut(bev, 6)"
            >
              -6
            </BaseButton>
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id]"
              @click="applyOut(bev, 12)"
            >
              -12
            </BaseButton>
          </div>

          <div class="mt-4 flex flex-col gap-2 md:flex-row">
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id]"
              @click="markOutOfStock(bev)"
            >
              Marcar fora do estoque
            </BaseButton>

            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id]"
              @click="openManual(bev)"
            >
              Manual
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- Placeholder: Activity feed -->
      <div v-if="!isRefreshing && !isError" class="mt-6 w-full">
        <BaseCard
          title="Registo de actividades"
          description="Em breve: movimentos recentes (precisamos do endpoint getRecentMovements)."
        >
          <div class="text-grey-600 bg-grey-50 rounded-md px-4 py-3">
            <p class="text-sm">
              Esta secção vai mostrar o histórico de movimentos (consumo,
              ajustes e abastecimentos) em tempo real.
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="pagination && pagination.totalPages > 1"
        :pagination-data="pagination"
        @page-change="onPageChange"
        @page-selected="onPageSelected"
      />
    </div>

    <!-- Modals -->
    <LazyBeverageManualMovementModal
      :show="showManualModal"
      :event-id="props.eventId"
      :beverage="selectedBeverage"
      @close-modal="showManualModal = false"
      @success="
        showManualModal = false;
        refreshEventBeverages({ force: true });
      "
    />

    <LazyBeverageRestockModal
      :show="showRestockModal"
      :event-id="props.eventId"
      :candidates="restockCandidates"
      @close-modal="showRestockModal = false"
      @success="
        showRestockModal = false;
        refreshEventBeverages({ force: true });
      "
    />

    <BeverageRestockListModal
      :show="showRestockListModal"
      :candidates="restockCandidates"
      @close-modal="showRestockListModal = false"
    />
  </section>
</template>
