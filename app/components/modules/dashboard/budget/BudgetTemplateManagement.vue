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

const eventStore = useEventStore();
const eventTypeId = computed(() => eventStore.eventTypeId);
const eventTypeName = computed(() => eventStore.eventTypeName);
const iconName = computed(() => eventStore.eventTypeIcon || 'event-wedding');
const isControlled = ref<boolean>(true);

const { template, isRefreshing, refreshTemplate } =
  await useBudgetTemplateByCurrentEventType(); // já tens este composable

const isHeaderModalOpen = ref(false);
const isCreateCategoryModalOpen = ref(false);

const localCategories = ref<BudgetTemplateCategory[]>([]);

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
    isControlled.value = !isControlled.value;

    const response = await budgetService.toggleTemplateControlMode(
      template.value.id,
      isControlled.value
        ? BudgetControlMode.Controllable
        : BudgetControlMode.NonControllable,
    );

    isControlled.value =
      response.defaultControlMode === BudgetControlMode.Controllable;

    toast.success(
      isControlled.value
        ? 'Modo de controlo para o modelo actualizado.'
        : 'Modo não controlado para o modelo actualizado',
    );

    refreshTemplate({ force: true });
  } catch (e) {
    toast.error('Não foi possível alterar o modo de controlo.');
    toast.error(getServerErrors(e as ServerError));
  }
};

onMounted(() => {
  isControlled.value =
    template.value?.defaultControlMode === BudgetControlMode.Controllable;
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
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="text-primary-700/50 text-base font-semibold">
            Categorias deste modelo
          </div>

          <button
            class="text-grey-500 hover:text-primary-700 transition-colors"
            type="button"
            title="Editar cabeçalho do template"
            @click="isHeaderModalOpen = true"
          >
            <IconPencil :font-controlled="false" class="size-4" />
          </button>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-grey-500 text-sm">Modo controlável</span>
          <BaseToggle
            :model-value="isControlled"
            @update:model-value="toggleTemplateControlMode"
          />
          <BaseButton @click="isCreateCategoryModalOpen = true"
            >Adicionar categoria</BaseButton
          >
        </div>
      </div>

      <draggable
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
              @changed="refreshTemplate({ force: true })"
            />
          </div>
        </template>
      </draggable>
    </div>

    <LazyBudgetHeaderFormModal
      :show="isHeaderModalOpen"
      :mode="'TEMPLATE'"
      :template="template"
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
  </div>
</template>
