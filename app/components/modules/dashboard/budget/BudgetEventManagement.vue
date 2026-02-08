<script setup lang="ts">
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';
import { downloadBlob } from '~/utils/fileUtils';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

const { eventId } = useEventStore();

const { budget, isRefreshing, refreshBudget } = await useBudget(eventId!);

const search = ref('');
const isHeaderModalOpen = ref(false);
const isCreateCategoryModalOpen = ref(false);
const localCategories = ref<BudgetCategory[]>([]);
const isControlled = ref<boolean>(true);

onMounted(() => {
  isControlled.value =
    budget.value?.controlMode === BudgetControlMode.Controllable;
});

watch(
  () => budget.value?.categories,
  (list) => {
    const safe = list ?? [];
    localCategories.value = [...safe].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  },
  { immediate: true },
);

const draggingId = ref<number | null>(null);

function onDragStart(evt: SortableEvent) {
  const id = Number((evt.item as HTMLElement)?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;
}

const onDragEnd = async () => {
  if (!budget.value) return;

  try {
    const items = localCategories.value.map(
      (c: BudgetCategory, idx: number) => ({
        id: c.id,
        sortOrder: idx + 1,
      }),
    );

    await budgetService.reorderCategories(budget.value.id, items);
    refreshBudget({ force: true });
  } catch (e) {
    toast.error('Não foi possível reordenar as categorias.');
    console.log(e);
    refreshBudget({ force: true });
  } finally {
    draggingId.value = null;
  }
};

const toggleControlMode = async () => {
  if (!budget.value) return;

  try {
    const response = await budgetService.toggleControlMode(budget.value.id);
    isControlled.value =
      response.controlMode === BudgetControlMode.Controllable;

    toast.success(
      isControlled.value
        ? 'Modo de controlo actualizado.'
        : 'Modo não controlado actualizado',
    );

    refreshBudget({ force: true });
  } catch (e) {
    if (isFetchErrorLike(e)) {
      toast.error(getServerErrors(e.data), {
        timeout: false,
      });
    } else {
      toast.error('Não foi possível alterar o modo de controlo.', {
        timeout: false,
      });
    }
  }
};

const openHeaderEdit = () => (isHeaderModalOpen.value = true);
const openCreateCategory = () => (isCreateCategoryModalOpen.value = true);

function matchesBudgetItem(item: BudgetItem, term: string) {
  return listContains(item.title, term);
}

function matchesBudgetCategory(category: BudgetCategory, term: string) {
  const categoryMatch = listContains(category.title, term);

  if (categoryMatch) return true;

  const items = category.items as BudgetItem[] | undefined;
  return items?.some((item) => matchesBudgetItem(item, term)) ?? false;
}

const normalizedSearch = computed(() => listNormalize(search.value));
const isFiltering = computed(() => !!normalizedSearch.value);

const displayedCategories = computed(() => {
  if (!isFiltering.value) return localCategories.value;

  const term = normalizedSearch.value;
  return localCategories.value.filter((cat) =>
    matchesBudgetCategory(cat, term),
  );
});

const isExporting = ref(false);
const { eventInitials } = useEventStore();

const exportExcel = async () => {
  if (!budget.value) return;

  try {
    isExporting.value = true;

    const blob = await budgetService.exportBudgetExcel(budget.value.id);
    const fileName = `ORCAMENTO_${eventInitials}.xlsx`;

    downloadBlob(blob, fileName);
  } catch (e) {
    if (isFetchErrorLike(e)) {
      toast.error(getServerErrors(e.data), { timeout: false });
    } else {
      toast.error('Não foi possível exportar o orçamento para Excel.', {
        timeout: false,
      });
    }
  } finally {
    isExporting.value = false;
  }
};

// Budget Item Management
const isEditCategoryModalOpen = ref(false);
const isCreateItemModalOpen = ref(false);
const isEditItemModalOpen = ref(false);
const selectedItem = ref<BudgetItem | undefined>(undefined);
const selectedCategory = ref<BudgetCategory | undefined>(undefined);

const isRemoveCategoryModalOpen = ref(false);
const isRemoveItemModalOpen = ref(false);
const selectedItemToRemove = ref<BudgetItem | undefined>(undefined);
const initialItemTab = ref<'DETAILS' | 'INSTALLMENTS'>('DETAILS');

const openRemoveCategory = (category: BudgetCategory) => {
  selectedCategory.value = category;
  isRemoveCategoryModalOpen.value = true;
};

const openCategoryForm = (category: BudgetCategory) => {
  selectedCategory.value = category;
  isEditCategoryModalOpen.value = true;
};

const openCreateItem = (category: BudgetCategory) => {
  selectedCategory.value = category;
  selectedItem.value = undefined;
  isCreateItemModalOpen.value = true;
};

const openEditItem = (item: BudgetItem) => {
  selectedItem.value = item;
  isEditItemModalOpen.value = true;
};

const openRemoveItem = (item: BudgetItem) => {
  selectedItemToRemove.value = item;
  isRemoveItemModalOpen.value = true;
};

const getSelectedCategory = computed(() => {
  if (!selectedCategory.value) return null;
  return selectedCategory.value;
});

const openInstallments = (item: BudgetItem) => {
  selectedItem.value = item;
  initialItemTab.value = 'INSTALLMENTS';
  isEditItemModalOpen.value = true;
};
</script>

<template>
  <div class="my-8 flex animate-fadeIn flex-col gap-4">
    <BaseLoading v-if="isRefreshing && !budget" />
    <div v-else-if="!budget" class="flex flex-col items-center">
      <BaseSearchNotFound>
        Ainda não existe orçamento para este evento.
      </BaseSearchNotFound>
      <BaseButton @click="openHeaderEdit">Criar orçamento</BaseButton>
    </div>

    <div v-else class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <p class="text-grey-300 mb-0 text-sm">Orçamento</p>
            <div class="flex flex-wrap gap-3">
              <p class="text-primary-700 text-2xl font-bold md:text-3xl">
                {{ formatMoney(budget.totalBudget, budget.currency) }}
              </p>

              <button
                class="text-grey-400 hover:text-primary-700 transition-colors"
                type="button"
                title="Editar orçamento"
                @click="openHeaderEdit"
              >
                <IconPencil :font-controlled="false" class="size-[20px]" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <BaseToggle
              :model-value="isControlled"
              :label="isControlled ? 'Desactivar controlo' : 'Activar controlo'"
              @update:model-value="toggleControlMode"
            />
          </div>
        </div>

        <!-- Ultrapassou budget -->
        <div
          v-if="budget?.totals?.isOverBudget"
          class="bg-warning-50 text-warning-700 my-4 flex animate-fadeIn flex-wrap items-center gap-2 rounded-lg p-3 text-sm"
        >
          <IconWarning
            :font-controlled="false"
            class="text-warning-700 block size-[16px]"
          />
          O custo actual ultrapassou o orçamento em
          <b>{{ formatMoney(budget.totals.overBudgetBy, budget.currency) }}</b
          >.
        </div>
      </div>

      <!-- Search + Actions -->
      <div class="my-4 flex flex-wrap items-end justify-between gap-3">
        <div class="w-full md:w-[40%]">
          <BaseInput
            id="searchCategory"
            v-model="search"
            label="Pesquisa:"
            type="search"
            placeholder="Filtrar categorias ou itens..."
            disable-margins
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton
            icon="add"
            btn-size="sm"
            btn-type="outline-primary"
            @click="openCreateCategory"
            >Adicionar categoria</BaseButton
          >
          <BaseButton
            btn-size="sm"
            icon="download"
            btn-type="outline-primary"
            :loading="isExporting"
            :disabled="isExporting"
            @click="exportExcel"
          >
            Exportar para Excel
          </BaseButton>
        </div>
      </div>

      <!-- Categories (draggable) -->
      <draggable
        v-if="!isFiltering"
        v-model="localCategories"
        item-key="id"
        handle=".drag-handle"
        class="flex w-full flex-col gap-4"
        ghost-class="opacity-50"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element: category }">
          <div :data-id="category.id" class="flex w-full items-start gap-3">
            <button class="drag-handle cursor-grab pt-4" type="button">
              <IconGripvertical
                :font-controlled="false"
                class="size-5 transition-colors duration-200"
                :class="[
                  draggingId === category.id
                    ? 'text-primary-500 opacity-100'
                    : 'text-grey-500 hover:text-primary-500 opacity-60',
                ]"
              />
            </button>

            <BudgetEventCategoryCard
              class="flex-1"
              :budget="budget"
              :category="category"
              :search="search"
              @changed="refreshBudget({ force: true })"
              @edit-category="openCategoryForm"
              @remove-category="openRemoveCategory"
              @create-item="openCreateItem"
              @edit-item="openEditItem"
              @remove-item="openRemoveItem"
              @open-installments="openInstallments"
            />
          </div>
        </template>
      </draggable>

      <!-- Categories (searching) -->
      <div v-else class="flex w-full flex-col gap-4">
        <div
          v-for="category in displayedCategories"
          :key="category.id"
          class="flex w-full items-start gap-3"
        >
          <!-- Sem drag handle (ou desactivado) -->
          <button class="pt-4 opacity-30" type="button" disabled>
            <IconGripvertical :font-controlled="false" class="size-5" />
          </button>

          <BudgetEventCategoryCard
            class="flex-1"
            :budget="budget"
            :category="category"
            :search="search"
            @changed="refreshBudget({ force: true })"
            @edit-category="openCategoryForm"
            @remove-category="openRemoveCategory"
            @create-item="openCreateItem"
            @edit-item="openEditItem"
            @remove-item="openRemoveItem"
            @open-installments="openInstallments"
          />
        </div>
      </div>

      <!-- Categories (search not found) -->
      <BaseSearchNotFound
        v-if="isFiltering && displayedCategories.length === 0"
        :show-fallback="false"
      >
        Infelizmente, não encontramos categorias para o filtro aplicado
      </BaseSearchNotFound>

      <!-- Totals footer -->
      <div class="border-grey-100/50 mt-8 border-t pt-5 md:mx-4">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div>
            <div class="text-grey-500 text-xs">Total estimado</div>
            <div class="text-primary-800 font-semibold">
              {{ formatMoney(budget.totals!.estimatedTotal, budget.currency) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Custo actual</div>
            <div class="text-primary-800 font-semibold">
              {{ formatMoney(budget.totals!.actualTotal, budget.currency) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Pago</div>
            <div class="font-semibold text-green-700">
              {{ formatMoney(budget.totals!.paidTotal, budget.currency) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Devido</div>
            <div class="font-semibold text-red-700">
              {{ formatMoney(budget.totals!.dueTotal, budget.currency) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Orçamento</div>
            <div class="text-primary-800 font-semibold">
              {{ formatMoney(budget.totalBudget, budget.currency) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <LazyBudgetHeaderFormModal
      :show="isHeaderModalOpen"
      :budget="budget"
      :event-id="eventId!"
      @close="isHeaderModalOpen = false"
      @saved="refreshBudget({ force: true })"
    />

    <LazyBudgetCategoryFormModal
      :show="isCreateCategoryModalOpen"
      :mode="'EVENT'"
      :parent-id="budget?.id ?? 0"
      :category="null"
      @close="isCreateCategoryModalOpen = false"
      @saved="refreshBudget({ force: true })"
    />

    <!-- Event Category Modals -->
    <LazyBudgetCategoryFormModal
      v-if="budget"
      :show="isEditCategoryModalOpen"
      mode="EVENT"
      :parent-id="budget!.id"
      :category="getSelectedCategory"
      @saved="refreshBudget({ force: true })"
      @close="isEditCategoryModalOpen = false"
    />

    <!-- Remove Category -->
    <LazyBudgetCategoryRemoveModal
      :show="isRemoveCategoryModalOpen"
      :category="selectedCategory"
      @close-modal="isRemoveCategoryModalOpen = false"
      @success="refreshBudget({ force: true })"
    />

    <!-- Create item -->
    <LazyBudgetItemFormModal
      v-if="selectedCategory"
      :show="isCreateItemModalOpen"
      mode="EVENT"
      :category-id="selectedCategory.id"
      :item="undefined"
      @close="isCreateItemModalOpen = false"
      @saved="refreshBudget({ force: true })"
    />

    <!-- Edit item -->
    <LazyBudgetItemFormModal
      :show="isEditItemModalOpen"
      mode="EVENT"
      :category-id="selectedCategory?.id"
      :item="selectedItem"
      :initial-tab="initialItemTab"
      @close="isEditItemModalOpen = false"
      @saved="refreshBudget({ force: true })"
    />

    <!-- Remove Budget Item -->
    <LazyBudgetItemRemoveModal
      :show="isRemoveItemModalOpen"
      :item="selectedItemToRemove"
      @close-modal="
        isRemoveItemModalOpen = false;
        selectedItemToRemove = undefined;
      "
      @success="
        refreshBudget({ force: true });
        selectedItemToRemove = undefined;
      "
    />
  </div>
</template>
