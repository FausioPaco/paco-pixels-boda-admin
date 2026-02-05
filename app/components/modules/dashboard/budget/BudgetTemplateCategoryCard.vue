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

type EditableField = 'title' | 'estimated' | 'actual' | 'paid';
type EditingState = { id: number; field: EditableField } | null;

type Draft = {
  title: string;
  estimatedAmount: number | null;
  actualCost: number | null;
  paidAmount: number | null;
};

// Mantive os types como "any" para não quebrar caso o teu budget.ts tenha nomes diferentes.
// Se quiseres, depois eu tipifico certinho com os teus types reais.
const props = defineProps<{
  template: BudgetTemplate;
  category: BudgetTemplateCategory;
}>();

const emit = defineEmits<{
  (e: 'changed'): void;
  (
    e: 'edit-category' | 'remove-category' | 'create-item',
    category: BudgetTemplateCategory,
  ): void;
  (e: 'edit-item' | 'remove-item', item: BudgetTemplateItem): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

const isOpen = ref(true);

const localItems = ref<BudgetTemplateItem[]>([]);

// ===== Inline edit state (igual ao BudgetEventCategoryCard) =====
const editing = ref<EditingState>(null);

const isEditing = (id: number, field: EditableField) =>
  editing.value?.id === id && editing.value?.field === field;

const focusById = async (elId: string) => {
  if (!import.meta.client) return;
  await nextTick();
  const el = document.getElementById(elId) as HTMLInputElement | null;
  el?.focus?.();
  el?.select?.();
};

const startEdit = async (id: number, field: EditableField) => {
  editing.value = { id, field };

  if (field === 'title') await focusById(`budget-template-item-title-${id}`);
  if (field === 'estimated') await focusById(`budget-template-item-est-${id}`);
  if (field === 'actual') await focusById(`budget-template-item-actual-${id}`);
  if (field === 'paid') await focusById(`budget-template-item-paid-${id}`);
};

const stopEdit = () => {
  editing.value = null;
};

const draftsById = ref<Record<number, Draft | undefined>>({});
const dirtyById = ref<Record<number, boolean>>({});
const savingById = ref<Record<number, boolean>>({});
const pendingById = ref<Record<number, boolean>>({});
const timersById = ref<
  Record<number, ReturnType<typeof setTimeout> | undefined | null>
>({});

const syncDraftFromItem = (item: BudgetTemplateItem) => {
  const id = item.id;
  if (dirtyById.value[id] || savingById.value[id] || pendingById.value[id])
    return;

  draftsById.value[id] = {
    title: item.title ?? '',
    estimatedAmount: item.estimatedAmount ?? 0,
    actualCost: item.actualCost ?? 0,
    paidAmount: item.paidAmount ?? 0,
  };
};

function ensureDraft(item: BudgetTemplateItem) {
  const id = item.id;

  if (!draftsById.value[id]) {
    draftsById.value[id] = {
      title: item.title ?? '',
      estimatedAmount: item.estimatedAmount ?? 0,
      actualCost: item.actualCost ?? 0,
      paidAmount: item.paidAmount ?? 0,
    };
    return;
  }

  syncDraftFromItem(item);
}

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
  }, 1200);
};

const resetDraft = (id: number) => {
  const item = localItems.value.find((x) => x.id === id);
  if (!item) return;

  draftsById.value[id] = {
    title: item.title ?? '',
    estimatedAmount: item.estimatedAmount ?? 0,
    actualCost: item.actualCost ?? 0,
    paidAmount: item.paidAmount ?? 0,
  };

  dirtyById.value[id] = false;
  clearTimer(id);
};

const onEditKeydown = async (evt: KeyboardEvent, id: number) => {
  if (evt.key === 'Enter') {
    evt.preventDefault();
    await saveNow(id);
    stopEdit();
    return;
  }

  if (evt.key === 'Escape') {
    evt.preventDefault();
    resetDraft(id);
    stopEdit();
  }
};

const getDraftEstimated = (i: BudgetTemplateItem) =>
  draftsById.value[i.id]?.estimatedAmount ?? i.estimatedAmount ?? 0;

const getDraftActual = (i: BudgetTemplateItem) =>
  draftsById.value[i.id]?.actualCost ?? i.actualCost ?? 0;

const getDraftPaid = (i: BudgetTemplateItem) =>
  draftsById.value[i.id]?.paidAmount ?? i.paidAmount ?? 0;

const getDraftDue = (i: BudgetTemplateItem) => {
  const actual = Number(getDraftActual(i) ?? 0);
  const paid = Number(getDraftPaid(i) ?? 0);
  return Math.max(actual - paid, 0);
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
        draftsById.value[id] = {
          title: '',
          estimatedAmount: 0,
          actualCost: 0,
          paidAmount: 0,
        };
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
        draftsById.value[id] = {
          title: '',
          estimatedAmount: 0,
          actualCost: 0,
          paidAmount: 0,
        };
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
        draftsById.value[id] = {
          title: '',
          estimatedAmount: 0,
          actualCost: 0,
          paidAmount: 0,
        };
      draftsById.value[id]!.actualCost = v;
      scheduleSave(id);
    },
  });

const paidModel = (id: number) =>
  computed<number | null>({
    get() {
      const d = draftsById.value[id];
      return d?.paidAmount ?? 0;
    },
    set(v) {
      const item = localItems.value.find((x) => x.id === id);
      if (item) ensureDraft(item);
      if (!draftsById.value[id])
        draftsById.value[id] = {
          title: '',
          estimatedAmount: 0,
          actualCost: 0,
          paidAmount: 0,
        };
      draftsById.value[id]!.paidAmount = v;
      scheduleSave(id);
    },
  });

const saveNow = async (id: number) => {
  clearTimer(id);

  const item = localItems.value.find((x) => x.id === id);
  const draft = draftsById.value[id];
  if (!item || !draft) return;

  if (savingById.value[id]) {
    pendingById.value[id] = true;
    return;
  }

  const title = (draft.title ?? '').trim();
  const estimatedAmount = draft.estimatedAmount ?? item.estimatedAmount ?? 0;
  const actualCost = draft.actualCost ?? item.actualCost ?? 0;
  const paidAmount = draft.paidAmount ?? item.paidAmount ?? 0;

  if (!title) {
    toast.error('O título do item não pode ficar vazio.');
    ensureDraft(item);
    draftsById.value[id] = {
      title: item.title ?? '',
      estimatedAmount: item.estimatedAmount ?? 0,
      actualCost: item.actualCost ?? 0,
      paidAmount: item.paidAmount ?? 0,
    };
    dirtyById.value[id] = false;
    return;
  }

  savingById.value[id] = true;

  try {
    // Nota: se o nome do método no teu budgetService for diferente, ajusta aqui.
    const updated = await budgetService.updateTemplateItem(id, {
      title,
      estimatedAmount: Number(estimatedAmount),
      actualCost: Number(actualCost),
      paidAmount: Number(paidAmount),
      notes: item.notes ?? null,
    });

    const idx = localItems.value.findIndex((x) => x.id === id);
    if (idx >= 0)
      localItems.value[idx] = { ...localItems.value[idx], ...updated };

    draftsById.value[id] = {
      title: updated.title,
      estimatedAmount: updated.estimatedAmount,
      actualCost: updated.actualCost,
      paidAmount: updated.paidAmount,
    };

    dirtyById.value[id] = false;
    emit('changed');
  } catch (e) {
    console.log(e);

    const msg = isFetchErrorLike(e)
      ? getServerErrors(e.data)
      : 'Não foi possível guardar o item.';

    toast.error(msg);

    draftsById.value[id] = {
      title: item.title ?? '',
      estimatedAmount: item.estimatedAmount ?? 0,
      actualCost: item.actualCost ?? 0,
      paidAmount: item.paidAmount ?? 0,
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

watch(
  () => props.category?.items,
  (list) => {
    const safe = list ?? [];
    localItems.value = [...safe].sort(
      (a: BudgetTemplateItem, b: BudgetTemplateItem) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
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
      (i: BudgetTemplateItem, idx: number) => ({
        id: i.id,
        sortOrder: idx + 1,
      }),
    );

    await budgetService.reorderTemplateItems(props.category.id, items);
    emit('changed');
  } catch (e) {
    toast.error('Não foi possível reordenar os itens desta categoria.');
    console.log(e);
    emit('changed');
  } finally {
    draggingItemId.value = null;
  }
}

// helpers (template pode ter apenas estimatedAmount; mas mantive compatível com o teu design)
// const getEstimated = (i: BudgetTemplateItem) => i.estimatedAmount ?? 0;
// const getActual = (i: BudgetTemplateItem) =>
//   i.actualCost ?? getEstimated(i) ?? 0;
// const getPaid = (i: BudgetTemplateItem) => i.paidAmount ?? 0;

watch(
  () => localItems.value,
  (items) => {
    for (const i of items) ensureDraft(i);
  },
  { immediate: true },
);

const subtotalEstimated = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetTemplateItem) =>
      acc + Number(getDraftEstimated(i) ?? 0),
    0,
  ),
);

const subtotalActual = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetTemplateItem) =>
      acc + Number(getDraftActual(i) ?? 0),
    0,
  ),
);

const subtotalPaid = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetTemplateItem) => acc + Number(getDraftPaid(i) ?? 0),
    0,
  ),
);

const subtotalDue = computed(() =>
  localItems.value.reduce(
    (acc: number, i: BudgetTemplateItem) => acc + Number(getDraftDue(i) ?? 0),
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
            @click.stop="emit('edit-category', category)"
          >
            <IconPencil :font-controlled="false" class="size-3" />
          </button>

          <button
            type="button"
            class="bg-primary-100 text-grey-500 hover:bg-primary-600 rounded-full p-2 transition hover:text-white"
            title="Editar"
            @click.stop="$emit('remove-category', category)"
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
          <div class="md:pl-3">Estimado</div>
          <div class="md:pl-2">Custo actual</div>
          <div class="md:pl-2">Montante pago</div>
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

                <!-- Titulo -->
                <div class="flex-1">
                  <transition name="inline-edit" mode="out-in">
                    <BaseInputCompact
                      v-if="isEditing(item.id, 'title')"
                      :id="`budget-template-item-title-${item.id}`"
                      v-model="titleModel(item.id).value"
                      type="text"
                      align="left"
                      :disabled="savingById[item.id]"
                      @blur="
                        saveNow(item.id);
                        stopEdit();
                      "
                      @keydown="(e: KeyboardEvent) => onEditKeydown(e, item.id)"
                    />

                    <button
                      v-else
                      type="button"
                      class="hover:bg-grey-50 group flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition"
                      :class="
                        savingById[item.id]
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-text'
                      "
                      :disabled="savingById[item.id]"
                      @click.stop="startEdit(item.id, 'title')"
                    >
                      <span class="text-grey-900 text-sm font-medium">
                        {{ draftsById[item.id]?.title ?? item.title }}
                      </span>

                      <IconPencil
                        :font-controlled="false"
                        class="text-grey-400 ml-2 size-3 opacity-0 transition group-hover:opacity-100"
                      />
                    </button>
                  </transition>
                </div>
              </div>

              <!-- Estimated -->
              <div>
                <transition name="inline-edit" mode="out-in">
                  <BaseInputCompact
                    v-if="isEditing(item.id, 'estimated')"
                    :id="`budget-template-item-est-${item.id}`"
                    v-model="estimatedModel(item.id).value"
                    type="number"
                    align="left"
                    :disabled="savingById[item.id]"
                    step="0.01"
                    min="0"
                    @blur="
                      saveNow(item.id);
                      stopEdit();
                    "
                    @keydown="(e: KeyboardEvent) => onEditKeydown(e, item.id)"
                  />

                  <button
                    v-else
                    type="button"
                    class="hover:bg-grey-50 group flex w-full items-center justify-between rounded-lg py-1 pr-2 transition"
                    :class="
                      savingById[item.id]
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-text'
                    "
                    :disabled="savingById[item.id]"
                    @click.stop="startEdit(item.id, 'estimated')"
                  >
                    <span class="text-grey-900 text-sm">
                      {{
                        formatMoney(getDraftEstimated(item), template.currency)
                      }}
                    </span>

                    <IconPencil
                      :font-controlled="false"
                      class="text-grey-400 ml-2 size-3 opacity-0 transition group-hover:opacity-100"
                    />
                  </button>
                </transition>
              </div>

              <!-- Actual -->
              <div>
                <transition name="inline-edit" mode="out-in">
                  <BaseInputCompact
                    v-if="isEditing(item.id, 'actual')"
                    :id="`budget-template-item-actual-${item.id}`"
                    v-model="actualModel(item.id).value"
                    type="number"
                    align="left"
                    :disabled="savingById[item.id]"
                    step="0.01"
                    min="0"
                    @blur="
                      saveNow(item.id);
                      stopEdit();
                    "
                    @keydown="(e: KeyboardEvent) => onEditKeydown(e, item.id)"
                  />

                  <button
                    v-else
                    type="button"
                    class="hover:bg-grey-50 group flex w-full items-center justify-between rounded-lg px-2 py-1 transition"
                    :class="
                      savingById[item.id]
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-text'
                    "
                    :disabled="savingById[item.id]"
                    @click.stop="startEdit(item.id, 'actual')"
                  >
                    <span class="text-grey-900 text-sm">
                      {{ formatMoney(getDraftActual(item), template.currency) }}
                    </span>

                    <IconPencil
                      :font-controlled="false"
                      class="text-grey-400 ml-2 size-3 opacity-0 transition group-hover:opacity-100"
                    />
                  </button>
                </transition>
              </div>

              <!-- Paid (editável no template) -->
              <div>
                <transition name="inline-edit" mode="out-in">
                  <BaseInputCompact
                    v-if="isEditing(item.id, 'paid')"
                    :id="`budget-template-item-paid-${item.id}`"
                    v-model="paidModel(item.id).value"
                    type="number"
                    align="left"
                    :disabled="savingById[item.id]"
                    step="0.01"
                    min="0"
                    @blur="
                      saveNow(item.id);
                      stopEdit();
                    "
                    @keydown="(e: KeyboardEvent) => onEditKeydown(e, item.id)"
                  />

                  <button
                    v-else
                    type="button"
                    class="hover:bg-grey-50 group flex w-full items-center justify-between rounded-lg px-2 py-1 transition"
                    :class="
                      savingById[item.id]
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-text'
                    "
                    :disabled="savingById[item.id]"
                    @click.stop="startEdit(item.id, 'paid')"
                  >
                    <span class="text-sm text-green-700">
                      {{ formatMoney(getDraftPaid(item), template.currency) }}
                    </span>

                    <IconPencil
                      :font-controlled="false"
                      class="text-grey-400 ml-2 size-3 opacity-0 transition group-hover:opacity-100"
                    />
                  </button>
                </transition>
              </div>

              <div class="flex items-center justify-between gap-2">
                <span class="text-grey-900 text-sm">
                  {{ formatMoney(getDraftDue(item), template.currency) }}
                </span>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-grey-500 hover:text-primary-700 transition"
                    title="Editar"
                    @click.stop="emit('edit-item', item)"
                  >
                    <IconPencil :font-controlled="false" class="size-4" />
                  </button>

                  <button
                    type="button"
                    class="text-grey-500 transition hover:text-red-600"
                    title="Remover"
                    @click.stop="emit('remove-item', item)"
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
          @click="emit('create-item', category)"
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
              {{ formatMoney(subtotalEstimated, template.currency) }}
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatMoney(subtotalActual, template.currency) }}
            </div>
            <div class="text-sm font-semibold text-green-700">
              {{ formatMoney(subtotalPaid, template.currency) }}
            </div>
            <div class="text-grey-900 text-sm font-semibold">
              {{ formatMoney(subtotalDue, template.currency) }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
