<script setup lang="ts">
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

type ReorderItem = { id: number; sortOrder: number };

const props = defineProps<{
  budget: Budget;
  category: BudgetCategory;
}>();

const emit = defineEmits<{
  (e: 'changed'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

const isOpen = ref(true);

const isEditCategoryModalOpen = ref(false);
const isCreateItemModalOpen = ref(false);
const isEditItemModalOpen = ref(false);
const selectedItem = ref<BudgetItem | undefined>(undefined);

const localItems = ref<BudgetItem[]>([]);

watch(
  () => props.category?.items,
  (list) => {
    const safe = list ?? [];
    localItems.value = [...safe].sort(
      (a: BudgetItem, b: BudgetItem) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  },
  { immediate: true },
);

const draggingItemId = ref<number | null>(null);

function onItemDragStart(evt: SortableEvent) {
  const el = evt.item as HTMLElement;
  const id = Number(el?.dataset?.id);
  draggingItemId.value = Number.isFinite(id) ? id : null;
}

async function onItemsDragEnd() {
  try {
    const items: ReorderItem[] = localItems.value.map(
      (i: BudgetItem, idx: number) => ({
        id: i.id,
        sortOrder: idx + 1,
      }),
    );

    await budgetService.reorderItems(props.category.id, items);
    emit('changed');
  } catch (e) {
    toast.error('Não foi possível reordenar os itens desta categoria.');
    console.log(e);
    emit('changed');
  } finally {
    draggingItemId.value = null;
  }
}

const openCreateItem = () => {
  selectedItem.value = undefined;
  isCreateItemModalOpen.value = true;
};

const openEditItem = (item: BudgetItem) => {
  selectedItem.value = item;
  isEditItemModalOpen.value = true;
};

async function removeCategory() {
  try {
    await budgetService.deleteCategory(props.category.id);
    toast.success('Categoria removida.');
    emit('changed');
  } catch (e) {
    toast.error('Não foi possível remover a categoria.');
    console.log(e);
  }
}

async function removeItem(itemId: number) {
  try {
    await budgetService.deleteItem(itemId);
    toast.success('Item removido.');
    emit('changed');
  } catch (e) {
    toast.error('Não foi possível remover o item.');
    console.log(e);
  }
}

// helpers (event tem valores reais, mas mantemos compatível com o design)
const getEstimated = (i: BudgetItem) => i.estimatedAmount ?? 0;
const getActual = (i: BudgetItem) => i.actualCost ?? 0;
const getPaid = (i: BudgetItem) => i.paidAmount ?? 0;

const getDue = (i: BudgetItem) => {
  const due = Math.max(Number(getActual(i)) - Number(getPaid(i)), 0);
  return due ?? 0;
};

const subtotalEstimated = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetItem) => acc + Number(getEstimated(i) ?? 0),
    0,
  ),
);

const subtotalActual = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetItem) => acc + Number(getActual(i) ?? 0),
    0,
  ),
);

const subtotalPaid = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetItem) => acc + Number(getPaid(i) ?? 0),
    0,
  ),
);

const subtotalDue = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetItem) => acc + Number(getDue(i) ?? 0),
    0,
  ),
);
</script>

<template>
  <div
    class="border-grey-100 w-full overflow-hidden rounded-2xl border bg-white"
  >
    <!-- Header -->
    <button
      type="button"
      class="bg-primary-100/20 flex w-full items-center justify-between gap-3 px-4 py-4"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-4">
        <!-- ícone genérico para categorias criadas pelo user -->
        <component
          :is="`icon-${category.iconKey}`"
          :font-controlled="false"
          class="text-primary-600 inline-block size-[24px]"
        />

        <div class="text-left">
          <div class="text-grey-900 font-semibold">
            {{ category.title }}
          </div>
          <div class="text-primary-900 text-xs">
            {{
              category.items?.length === 1
                ? '1 item'
                : `${category.items?.length} itens`
            }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Category Edit & Remove -->
        <div class="hidden flex-wrap items-center justify-end gap-2 md:flex">
          <button
            type="button"
            class="bg-primary-100 text-grey-500 hover:bg-primary-600 rounded-full p-2 transition hover:text-white"
            title="Editar"
            @click.stop="isEditCategoryModalOpen = true"
          >
            <IconPencil :font-controlled="false" class="size-3" />
          </button>

          <button
            type="button"
            class="bg-primary-100 text-grey-500 hover:bg-primary-600 rounded-full p-2 transition hover:text-white"
            title="Editar"
            @click.stop="removeCategory"
          >
            <IconTrash :font-controlled="false" class="size-3" />
          </button>
        </div>

        <IconChevronDown
          :font-controlled="false"
          class="text-grey-500 size-4 transition"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </div>
    </button>

    <!-- Content -->
    <transition name="slide-down" mode="out-in">
      <div v-if="isOpen" class="border-grey-100 border-t px-4 pb-4 pt-3">
        <!-- No Items -->
        <div
          v-if="localItems.length === 0"
          class="my-4 flex animate-fadeIn flex-wrap items-center gap-2"
        >
          <icon-warning
            :font-controlled="false"
            class="text-grey-400 block size-[20px]"
            aria-hidden="true"
            focusable="false"
          ></icon-warning>
          <p class="text-grey-400 animate-fadeIn text-sm font-medium">
            Até agora, não existem itens para esta categoria
          </p>
        </div>

        <!-- Table head -->
        <div
          v-if="localItems.length > 0"
          class="text-grey-500 mt-5 hidden animate-fadeIn grid-cols-5 gap-3 pb-4 text-xs md:grid"
        >
          <div class="pl-6">Título</div>
          <div>Estimado</div>
          <div>Custo actual</div>
          <div>Montante pago</div>
          <div>Montante devido</div>
        </div>

        <!-- Items (draggable) -->
        <draggable
          v-model="localItems"
          item-key="id"
          handle=".drag-handle"
          class="flex flex-col gap-2"
          ghost-class="opacity-50"
          @start="onItemDragStart"
          @end="onItemsDragEnd"
        >
          <template #item="{ element: item }">
            <div
              :data-id="item.id"
              class="border-grey-100 grid grid-cols-1 items-center gap-3 rounded-xl border p-3 md:grid-cols-5"
            >
              <!-- Title + drag -->
              <div class="flex items-center gap-2 md:pl-3">
                <button class="drag-handle cursor-grab" type="button">
                  <IconGripvertical
                    :font-controlled="false"
                    class="text-grey-500 size-4 transition-colors"
                    :class="
                      draggingItemId === item.id ? 'opacity-100' : 'opacity-60'
                    "
                  />
                </button>

                <span class="text-grey-900 text-sm font-medium">
                  {{ item.title }}
                </span>
              </div>

              <div class="text-grey-700 text-sm">
                {{ formatToMZN(getEstimated(item)) }}
              </div>

              <div class="text-grey-700 text-sm">
                {{ formatToMZN(getActual(item)) }}
              </div>

              <div class="text-sm text-green-700">
                {{ formatToMZN(getPaid(item)) }}
              </div>

              <div class="flex items-center justify-between gap-2">
                <span class="text-grey-900 text-sm">
                  {{ formatToMZN(getDue(item)) }}
                </span>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-grey-500 hover:text-primary-700 transition"
                    title="Editar"
                    @click.stop="openEditItem(item)"
                  >
                    <IconPencil :font-controlled="false" class="size-4" />
                  </button>

                  <button
                    type="button"
                    class="text-grey-500 transition hover:text-red-600"
                    title="Remover"
                    @click.stop="removeItem(item.id)"
                  >
                    <IconTrash :font-controlled="false" class="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Add item -->
        <button
          type="button"
          class="text-grey-300 hover:text-primary-700 group my-4 inline-flex items-center gap-1 text-sm transition"
          @click="openCreateItem"
        >
          <IconPlusSimple
            :font-controlled="false"
            class="text-primary-700 block size-[18px]"
          />
          <span>Adicionar novo item</span>
        </button>

        <!-- Subtotal -->
        <div class="border-grey-100/60 my-4 border-t pt-3">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div class="text-grey-500 text-sm font-semibold md:pl-6">
              Subtotal
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatToMZN(subtotalEstimated) }}
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatToMZN(subtotalActual) }}
            </div>
            <div class="text-sm font-semibold text-green-700">
              {{ formatToMZN(subtotalPaid) }}
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatToMZN(subtotalDue) }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modals -->
    <LazyBudgetCategoryFormModal
      :show="isEditCategoryModalOpen"
      mode="EVENT"
      :parent-id="budget?.id ?? 0"
      :category="category"
      @close="isEditCategoryModalOpen = false"
      @saved="emit('changed')"
    />

    <!-- Create item -->
    <LazyBudgetItemFormModal
      :show="isCreateItemModalOpen"
      mode="EVENT"
      :category-id="category.id"
      :item="undefined"
      @close="isCreateItemModalOpen = false"
      @saved="emit('changed')"
    />

    <!-- Edit item -->
    <LazyBudgetItemFormModal
      :show="isEditItemModalOpen"
      mode="EVENT"
      :category-id="category.id"
      :item="selectedItem"
      @close="isEditItemModalOpen = false"
      @saved="emit('changed')"
    />
  </div>
</template>
