<script setup lang="ts">
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import { getBudgetService } from '~/services/budgetService';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const { siteConfig } = await useClientConfig();
const toast = useToast();
const nuxtApp = useNuxtApp();
const budgetService = getBudgetService(nuxtApp.$api);

const eventStore = useEventStore();

const eventTypeId = computed(() => eventStore.eventTypeId);
const eventTypeName = computed(() => eventStore.eventTypeName);
const iconName = computed(() => eventStore.eventTypeIcon || 'event-wedding');
const isControlled = ref<boolean>(true);

const { template, isRefreshing, refreshTemplate } =
  await useBudgetTemplateByCurrentEventType({
    partnerId: Number(siteConfig.partnerId),
  });

const isHeaderModalOpen = ref(false);
const isCreateCategoryModalOpen = ref(false);

const localCategories = ref<BudgetTemplateCategory[]>([]);

const openCreateCategory = () => (isCreateCategoryModalOpen.value = true);

watch(
  () => template.value?.categories,
  (list) => {
    const safe = list ?? [];
    localCategories.value = [...safe].sort(
      (a: BudgetTemplateCategory, b: BudgetTemplateCategory) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  },
  { immediate: true },
);

const draggingId = ref<number | null>(null);
const search = ref('');

function onDragStart(evt: SortableEvent) {
  const id = Number((evt.item as HTMLElement)?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;
}

const onDragEnd = async () => {
  if (!template.value) return;

  try {
    const items = localCategories.value.map(
      (c: BudgetTemplateCategory, idx: number) => ({
        id: c.id,
        sortOrder: idx + 1,
      }),
    );

    await budgetService.reorderTemplateCategories(template.value.id, items);
    refreshTemplate({ force: true });
  } catch (e) {
    toast.error('Não foi possível reordenar as categorias do modelo.');
    toast.error(getServerErrors(e as ServerError));
    refreshTemplate({ force: true });
  } finally {
    draggingId.value = null;
  }
};

const toggleTemplateControlMode = async () => {
  if (!template.value) return;

  try {
    const response = await budgetService.toggleTemplateControlMode(
      template.value.id,
    );

    isControlled.value =
      response.defaultControlMode === BudgetControlMode.Controllable;

    toast.success(
      isControlled.value
        ? 'Modo de controlo actualizado.'
        : 'Modo não controlado actualizado',
    );

    refreshTemplate({ force: true });
  } catch (e) {
    console.log(e);
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

onMounted(() => {
  isControlled.value =
    template.value?.defaultControlMode === BudgetControlMode.Controllable;
});

function matchesBudgetTemplateItem(item: BudgetTemplateItem, term: string) {
  return listContains(item.title, term);
}

function matchesBudgetTemplateCategory(
  category: BudgetTemplateCategory,
  term: string,
) {
  const categoryMatch = listContains(category.title, term);

  if (categoryMatch) return true;

  const items = category.items as BudgetTemplateItem[] | undefined;
  return items?.some((item) => matchesBudgetTemplateItem(item, term)) ?? false;
}

const normalizedSearch = computed(() => listNormalize(search.value));
const isFiltering = computed(() => !!normalizedSearch.value);

const displayedCategories = computed(() => {
  if (!isFiltering.value) return localCategories.value;

  const term = normalizedSearch.value;
  return localCategories.value.filter((cat) =>
    matchesBudgetTemplateCategory(cat, term),
  );
});

// Budget Item Management
const isEditCategoryModalOpen = ref(false);
const isCreateItemModalOpen = ref(false);
const isEditItemModalOpen = ref(false);
const selectedItem = ref<BudgetTemplateItem | undefined>(undefined);
const selectedCategory = ref<BudgetTemplateCategory | undefined | null>(null);

const isRemoveCategoryModalOpen = ref(false);
const isRemoveItemModalOpen = ref(false);
const selectedItemToRemove = ref<BudgetTemplateItem | undefined>(undefined);

const openRemoveCategory = (category: BudgetTemplateCategory) => {
  selectedCategory.value = category;
  isRemoveCategoryModalOpen.value = true;
};

const openCategoryForm = (category: BudgetTemplateCategory) => {
  selectedCategory.value = category;
  isEditCategoryModalOpen.value = true;
};

const openCreateItem = (category: BudgetTemplateCategory) => {
  selectedCategory.value = category;
  selectedItem.value = undefined;
  isCreateItemModalOpen.value = true;
};

const openEditItem = (item: BudgetTemplateItem) => {
  selectedItem.value = item;
  isEditItemModalOpen.value = true;
};

const openRemoveItem = (item: BudgetTemplateItem) => {
  selectedItemToRemove.value = item;
  isRemoveItemModalOpen.value = true;
};

const getSelectedCategory = computed(() => {
  if (!selectedCategory.value) return null;
  return selectedCategory.value as BudgetTemplateCategory;
});
</script>

<template>
  <div class="my-8 flex animate-fadeIn flex-col gap-4">
    <div class="flex flex-col gap-2">
      <span class="text-primary-700/40 font-semibold">Modelo de orçamento</span>

      <div
        class="bg-primary-50 flex w-fit items-end gap-2 rounded-full px-4 py-2"
      >
        <component
          :is="`icon-${iconName}`"
          :font-controlled="false"
          class="text-primary-700 size-[20px]"
        />
        <span class="text-primary-700 font-bold">{{ eventTypeName }}</span>
      </div>

      <div class="my-4">
        <p class="text-grey-500 mb-3 text-sm">
          Aqui podes actualizar o modelo de orçamento para eventos do tipo
          <span class="text-primary-700 font-bold">{{ eventTypeName }}</span
          >.
        </p>
        <p class="text-grey-500 text-sm">
          As alterações feitas neste modelo serão usadas como base nos próximos
          eventos deste tipo.
        </p>
      </div>
    </div>

    <BaseLoading v-if="isRefreshing && !template" />

    <BaseSearchNotFound v-else-if="!template">
      Não foi possível carregar o modelo para este tipo de evento.
    </BaseSearchNotFound>

    <div v-else class="flex flex-col gap-4">
      <!-- Header -->
      <div class="my-3 flex flex-col gap-1 md:my-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <p class="text-grey-300 mb-0 text-sm">Orçamento do modelo</p>
            <div class="flex flex-wrap gap-3">
              <p class="text-primary-700 text-2xl font-bold md:text-3xl">
                {{ formatMoney(template.baseTotalBudget, template.currency) }}
              </p>

              <button
                class="text-grey-400 hover:text-primary-700 transition-colors"
                type="button"
                title="Editar orçamento"
                @click="isHeaderModalOpen = true"
              >
                <IconPencil :font-controlled="false" class="size-[20px]" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <BaseToggle
              :model-value="isControlled"
              :label="isControlled ? 'Desactivar controlo' : 'Activar controlo'"
              @update:model-value="toggleTemplateControlMode"
            />
          </div>
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
        <BaseButton
          icon="add"
          btn-size="sm"
          btn-type="outline-primary"
          @click="openCreateCategory"
          >Adicionar categoria</BaseButton
        >
      </div>

      <!-- Categories (draggable) -->
      <draggable
        v-if="!isFiltering"
        v-model="localCategories"
        item-key="id"
        handle=".drag-handle"
        class="flex w-full flex-col gap-3"
        ghost-class="opacity-50"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element: category }">
          <div
            :data-id="category.id"
            class="flex w-full items-start gap-3 py-2"
          >
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

            <BudgetTemplateCategoryCard
              class="flex-1"
              :template="template"
              :category="category"
              @edit-category="openCategoryForm"
              @remove-category="openRemoveCategory"
              @create-item="openCreateItem"
              @edit-item="openEditItem"
              @remove-item="openRemoveItem"
              @changed="refreshTemplate({ force: true })"
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

          <BudgetTemplateCategoryCard
            class="flex-1"
            :template="template"
            :category="category"
            @changed="refreshTemplate({ force: true })"
          />
        </div>
      </div>
    </div>

    <LazyBudgetHeaderFormModal
      :show="isHeaderModalOpen"
      :mode="'TEMPLATE'"
      :template="template"
      :event-id="eventStore.eventId!"
      :event-type-id="eventTypeId"
      @close="isHeaderModalOpen = false"
      @saved="refreshTemplate({ force: true })"
    />

    <LazyBudgetCategoryFormModal
      :show="isCreateCategoryModalOpen"
      :mode="'TEMPLATE'"
      :parent-id="template?.id ?? 0"
      :category="null"
      @close="isCreateCategoryModalOpen = false"
      @saved="refreshTemplate({ force: true })"
    />

    <!-- Modals -->
    <LazyBudgetCategoryFormModal
      :show="isEditCategoryModalOpen"
      mode="TEMPLATE"
      :parent-id="template?.id ?? 0"
      :category="getSelectedCategory"
      @close="isEditCategoryModalOpen = false"
      @saved="refreshTemplate({ force: true })"
    />

    <!-- Create item -->
    <LazyBudgetItemFormModal
      :show="isCreateItemModalOpen"
      mode="TEMPLATE"
      :category-id="getSelectedCategory?.id"
      :item="undefined"
      @close="isCreateItemModalOpen = false"
      @saved="refreshTemplate({ force: true })"
    />

    <!-- Edit item -->
    <LazyBudgetItemFormModal
      :show="isEditItemModalOpen"
      mode="TEMPLATE"
      :category-id="getSelectedCategory?.id"
      :item="selectedItem"
      @close="isEditItemModalOpen = false"
      @saved="refreshTemplate({ force: true })"
    />

    <!-- Remove Category -->
    <LazyBudgetCategoryRemoveModal
      :show="isRemoveCategoryModalOpen"
      mode="TEMPLATE"
      :category="getSelectedCategory"
      @close-modal="isRemoveCategoryModalOpen = false"
      @success="refreshTemplate({ force: true })"
    />

    <!-- Remove Template Item -->
    <LazyBudgetItemRemoveModal
      :show="isRemoveItemModalOpen"
      :item="selectedItem"
      @close-modal="
        isRemoveItemModalOpen = false;
        selectedItem = undefined;
      "
      @success="
        refreshTemplate({ force: true });
        selectedItem = undefined;
      "
    />
  </div>
</template>
