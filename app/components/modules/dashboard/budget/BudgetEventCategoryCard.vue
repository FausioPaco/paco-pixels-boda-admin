<script setup lang="ts">
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';
import { getServerErrors } from '~/utils/serverUtils';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

type ReorderItem = { id: number; sortOrder: number };

type Draft = {
  title: string;
  estimatedAmount: number | null;
  actualCost: number | null;
};

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

// ===== Inline edit state =====
const draftsById = ref<Record<number, Draft>>({});
const dirtyById = ref<Record<number, boolean>>({});
const savingById = ref<Record<number, boolean>>({});
const pendingById = ref<Record<number, boolean>>({});
const timersById = ref<Record<number, ReturnType<typeof setTimeout> | null>>(
  {},
);

const ensureDraft = (item: BudgetItem) => {
  if (!draftsById.value[item.id]) {
    draftsById.value[item.id] = {
      title: item.title ?? '',
      estimatedAmount: item.estimatedAmount ?? 0,
      actualCost: item.actualCost ?? 0,
    };
  }
};

watch(
  () => localItems.value,
  (items) => {
    for (const i of items) ensureDraft(i);
  },
  { immediate: true },
);

const getPaid = (i: BudgetItem) => i.paidAmount ?? 0;

const getDraftEstimated = (i: BudgetItem) =>
  draftsById.value[i.id]?.estimatedAmount ?? i.estimatedAmount ?? 0;

const getDraftActual = (i: BudgetItem) =>
  draftsById.value[i.id]?.actualCost ?? i.actualCost ?? 0;

const getDraftDue = (i: BudgetItem) => {
  const actual = Number(getDraftActual(i) ?? 0);
  const paid = Number(getPaid(i) ?? 0);
  return Math.max(actual - paid, 0);
};

const markDirty = (id: number) => {
  dirtyById.value[id] = true;
};

const clearTimer = (id: number) => {
  const t = timersById.value[id];
  if (t) clearTimeout(t);
  timersById.value[id] = null;
};

const scheduleSave = (id: number) => {
  markDirty(id);
  clearTimer(id);

  timersById.value[id] = setTimeout(() => {
    saveNow(id);
  }, 700);
};

const saveNow = async (id: number) => {
  clearTimer(id);

  const item = localItems.value.find((x) => x.id === id);
  const draft = draftsById.value[id];
  if (!item || !draft) return;

  // Evita salvar em paralelo
  if (savingById.value[id]) {
    pendingById.value[id] = true;
    return;
  }

  // Normalização
  const title = (draft.title ?? '').trim();
  const estimatedAmount = draft.estimatedAmount ?? item.estimatedAmount ?? 0;
  const actualCost = draft.actualCost ?? item.actualCost ?? 0;

  if (!title) {
    toast.error('O título do item não pode ficar vazio.');
    ensureDraft(item);

    draftsById.value[id] = {
      title: item.title ?? '',
      estimatedAmount: item.estimatedAmount ?? 0,
      actualCost: item.actualCost ?? 0,
    };

    dirtyById.value[id] = false;
    return;
  }

  savingById.value[id] = true;

  try {
    const updated = await budgetService.updateItem(id, {
      title,
      estimatedAmount: Number(estimatedAmount),
      actualCost: Number(actualCost),
      notes: item.notes ?? null,
    });

    // Atualiza a row com resposta do backend
    const idx = localItems.value.findIndex((x) => x.id === id);
    if (idx >= 0)
      localItems.value[idx] = { ...localItems.value[idx], ...updated };

    // mantém draft alinhado
    draftsById.value[id] = {
      title: updated.title,
      estimatedAmount: updated.estimatedAmount,
      actualCost: updated.actualCost,
    };

    dirtyById.value[id] = false;

    // Importante: para atualizar totais globais, avisa o pai (o pai já faz refreshBudget)
    emit('changed');
  } catch (e) {
    console.log(e);

    const msg = isFetchErrorLike(e)
      ? getServerErrors(e.data)
      : 'Não foi possível guardar o item.';

    toast.error(msg);

    // reverte draft para o item actual
    draftsById.value[id] = {
      title: item.title ?? '',
      estimatedAmount: item.estimatedAmount ?? 0,
      actualCost: item.actualCost ?? 0,
    };
    dirtyById.value[id] = false;
  } finally {
    savingById.value[id] = false;

    if (pendingById.value[id]) {
      pendingById.value[id] = false;
      saveNow(id);
    }
  }
};

// ===== Subtotals (usam draft para estimado/actual) =====
const subtotalEstimated = computed(() =>
  localItems.value.reduce(
    (acc, i) => acc + Number(getDraftEstimated(i) ?? 0),
    0,
  ),
);

const subtotalActual = computed(() =>
  localItems.value.reduce((acc, i) => acc + Number(getDraftActual(i) ?? 0), 0),
);

const subtotalPaid = computed(() =>
  localItems.value.reduce((acc, i) => acc + Number(getPaid(i) ?? 0), 0),
);

const subtotalDue = computed(() =>
  localItems.value.reduce((acc, i) => acc + Number(getDraftDue(i) ?? 0), 0),
);

const isRemoveCategoryModalOpen = ref(false);
const isRemoveItemModalOpen = ref(false);
const selectedItemToRemove = ref<BudgetItem | undefined>(undefined);

const openRemoveCategory = () => (isRemoveCategoryModalOpen.value = true);

const openRemoveItem = (item: BudgetItem) => {
  selectedItemToRemove.value = item;
  isRemoveItemModalOpen.value = true;
};

const titleModel = (id: number) =>
  computed<string>({
    get() {
      const d = draftsById.value[id];
      return d?.title ?? '';
    },
    set(v) {
      const item = localItems.value.find((x) => x.id === id);
      if (item) ensureDraft(item);
      if (!draftsById.value[id])
        draftsById.value[id] = { title: '', estimatedAmount: 0, actualCost: 0 };
      draftsById.value[id]!.title = v;
      scheduleSave(id);
    },
  });

const estimatedModel = (id: number) =>
  computed<number | null>({
    get() {
      const d = draftsById.value[id];
      return d?.estimatedAmount ?? 0;
    },
    set(v) {
      const item = localItems.value.find((x) => x.id === id);
      if (item) ensureDraft(item);
      if (!draftsById.value[id])
        draftsById.value[id] = { title: '', estimatedAmount: 0, actualCost: 0 };
      draftsById.value[id]!.estimatedAmount = v;
      scheduleSave(id);
    },
  });

const actualModel = (id: number) =>
  computed<number | null>({
    get() {
      const d = draftsById.value[id];
      return d?.actualCost ?? 0;
    },
    set(v) {
      const item = localItems.value.find((x) => x.id === id);
      if (item) ensureDraft(item);
      if (!draftsById.value[id])
        draftsById.value[id] = { title: '', estimatedAmount: 0, actualCost: 0 };
      draftsById.value[id]!.actualCost = v;
      scheduleSave(id);
    },
  });
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
            @click.stop="openRemoveCategory"
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
          <div class="-ml-2">Montante devido</div>
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

                <div class="flex-1">
                  <BaseInputCompact
                    :id="`budget-item-title-${item.id}`"
                    v-model="titleModel(item.id).value"
                    type="text"
                    align="left"
                    :disabled="savingById[item.id]"
                    @blur="saveNow(item.id)"
                  />
                </div>
              </div>

              <div>
                <BaseInputCompact
                  :id="`budget-item-est-${item.id}`"
                  v-model="estimatedModel(item.id).value"
                  type="number"
                  align="right"
                  :disabled="savingById[item.id]"
                  step="0.01"
                  min="0"
                  @blur="saveNow(item.id)"
                />
              </div>

              <div>
                <BaseInputCompact
                  :id="`budget-item-actual-${item.id}`"
                  v-model="actualModel(item.id).value"
                  type="number"
                  align="right"
                  :disabled="savingById[item.id]"
                  step="0.01"
                  min="0"
                  @blur="saveNow(item.id)"
                />
              </div>

              <div class="text-sm text-green-700">
                {{ formatMoney(getPaid(item), budget.currency) }}
              </div>

              <div class="flex items-center justify-between gap-2">
                <span class="text-grey-900 text-sm">
                  {{ formatMoney(getDraftDue(item), budget.currency) }}
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
                    @click.stop="openRemoveItem(item)"
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
              {{ formatMoney(subtotalEstimated, budget.currency) }}
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatMoney(subtotalActual, budget.currency) }}
            </div>
            <div class="text-sm font-semibold text-green-700">
              {{ formatMoney(subtotalPaid, budget.currency) }}
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatMoney(subtotalDue, budget.currency) }}
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

    <!-- Remove Category -->
    <LazyBudgetCategoryRemoveModal
      :show="isRemoveCategoryModalOpen"
      :category="category"
      @close-modal="isRemoveCategoryModalOpen = false"
      @success="emit('changed')"
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
        emit('changed');
        selectedItemToRemove = undefined;
      "
    />
  </div>
</template>
