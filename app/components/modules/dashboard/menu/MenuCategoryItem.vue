<script setup lang="ts">
import Draggable from 'vuedraggable';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const emit = defineEmits<{
  (e: 'add', menuCategoryId: number): void;
  (e: 'remove', item: MenuItem): void;
  (e: 'update', item: MenuItem, menuCategoryId: number): void;
  (e: 'reorder', menuCategoryId: number, orderedItemIds: number[]): void;
}>();

interface IMenuCategoryProps {
  menuId: number;
  menuCategory: MenuCategory;
  items: MenuItem[];
  isReordering?: boolean;
}

const props = withDefaults(defineProps<IMenuCategoryProps>(), {
  isReordering: false,
});

const draggingId = ref<number | null>(null);

// itens da categoria (ordenados por "order" se existir)
const categorySelectedItems = computed(() =>
  props.items
    .filter((item) => item.menuCategory.id === props.menuCategory.id)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

// lista local (draggable precisa de v-model mutável)
const localItems = ref<MenuItem[]>([]);

// sincronizar quando vier refresh do backend
watch(
  categorySelectedItems,
  (val) => {
    localItems.value = val ? [...val] : [];
  },
  { immediate: true },
);

const beforeDragIds = ref<number[]>([]);

function onDragStart(evt: SortableEvent) {
  const el = evt.item as HTMLElement;
  const id = Number(el?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;

  beforeDragIds.value = localItems.value.map((i) => i.id);
}

function onDragEnd() {
  draggingId.value = null;

  const orderedIds = localItems.value.map((i) => i.id);

  if (orderedIds.join(',') === beforeDragIds.value.join(',')) return;

  emit('reorder', props.menuCategory.id, orderedIds);
}
</script>

<template>
  <div class="text-primary-700 my-3 flex flex-col space-y-3">
    <!-- Header da categoria -->
    <div class="flex items-end space-x-2 text-left">
      <component
        :is="`icon-${menuCategory.icon}`"
        :font-controlled="false"
        class="text-primary-500 h-10 w-10"
      />
      <h3 class="text-grey-700 text-2xl font-bold">
        {{ menuCategory.title }}
      </h3>
    </div>

    <!-- Lista de pratos -->
    <Draggable
      v-model="localItems"
      item-key="id"
      handle=".drag-handle"
      ghost-class="opacity-50"
      :disabled="isReordering"
      class="space-y-2"
      @start="onDragStart"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <div
          class="bg-primary-50 flex items-center justify-between gap-2 rounded-md p-2"
          :data-id="element.id"
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="drag-handle cursor-grab"
              :disabled="isReordering"
              aria-label="Reordenar"
            >
              <IconGripvertical
                :font-controlled="false"
                class="size-[18px] transition-colors duration-200"
                :class="[
                  draggingId === element.id
                    ? 'text-primary-500 opacity-100'
                    : 'text-grey-500 hover:text-primary-500 opacity-60',
                ]"
              />
            </button>

            <span class="text-grey-800 pl-1 text-base">
              {{ element.name }}
            </span>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              aria-label="Actualizar prato"
              class="focus-visible:ring-primary-300 rounded focus:outline-none focus-visible:ring"
              :disabled="isReordering"
              @click="emit('update', element, menuCategory.id)"
            >
              <IconPencil
                :font-controlled="false"
                class="text-grey-400 hover:text-primary-500 size-[16px] transition-colors duration-300"
              />
            </button>

            <button
              type="button"
              aria-label="Remover prato"
              class="focus-visible:ring-primary-300 rounded focus:outline-none focus-visible:ring"
              :disabled="isReordering"
              @click="emit('remove', element)"
            >
              <IconCancel
                :font-controlled="false"
                class="text-grey-400 hover:text-primary-500 size-[16px] transition-colors duration-300"
              />
            </button>
          </div>
        </div>
      </template>
    </Draggable>

    <div class="my-2">
      <BaseButton
        size="sm"
        icon="add"
        btn-type="outline-primary"
        @click.prevent="emit('add', menuCategory.id)"
      >
        Adicionar Item
      </BaseButton>
    </div>
  </div>
</template>
