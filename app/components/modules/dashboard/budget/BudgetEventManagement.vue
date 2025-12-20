<script setup lang="ts">
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';

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
    toast.error('Não foi possível alterar o modo de controlo.');
    toast.error(getServerErrors(e as ServerError));
  }
};

const openHeaderEdit = () => (isHeaderModalOpen.value = true);
const openCreateCategory = () => (isCreateCategoryModalOpen.value = true);
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
                {{ formatToMZN(budget.totalBudget) }}
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

        <div
          v-if="budget?.totals?.isOverBudget"
          class="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          O custo actual ultrapassou o orçamento em
          {{ formatToMZN(budget.totals.overBudgetBy) }}.
        </div>
      </div>

      <!-- Search + Actions -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="w-full md:w-[40%]">
          <BaseInput
            id="searchCategory"
            v-model="search"
            label="Pesquisa:"
            type="search"
            placeholder="Filtrar categorias ou itens..."
          />
        </div>
        <BaseButton @click="openCreateCategory">Adicionar categoria</BaseButton>
      </div>

      <!-- Categories (draggable) -->
      <draggable
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
            />
          </div>
        </template>
      </draggable>

      <!-- Totals footer -->
      <div class="border-grey-100/50 mt-8 border-t pt-5 md:mx-4">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div>
            <div class="text-grey-500 text-xs">Total estimado</div>
            <div class="text-primary-700 font-semibold">
              {{ formatToMZN(budget.totals!.estimatedTotal) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Custo actual</div>
            <div class="text-primary-700 font-semibold">
              {{ formatToMZN(budget.totals!.actualTotal) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Pago</div>
            <div class="font-semibold text-green-700">
              {{ formatToMZN(budget.totals!.paidTotal) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Devido</div>
            <div class="text-primary-700 font-semibold">
              {{ formatToMZN(budget.totals!.dueTotal) }}
            </div>
          </div>
          <div>
            <div class="text-grey-500 text-xs">Orçamento</div>
            <div class="text-primary-700 font-semibold">
              {{ formatToMZN(budget.totalBudget) }}
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
  </div>
</template>
