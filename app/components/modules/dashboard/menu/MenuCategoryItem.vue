<script setup lang="ts">
const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'add', menuCategoryId: number): void;
  (e: 'remove', item: MenuItem): void;
  (e: 'update', item: MenuItem, menuCategoryId: number): void;
}>();

interface IMenuCategoryProps {
  menuCategory: MenuCategory;
  items: MenuItem[];
}

const props = defineProps<IMenuCategoryProps>();

const categorySelectedItems = computed(() =>
  props.items.filter((item) => item.menuCategory.id === props.menuCategory.id),
);
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
    <ul class="space-y-2">
      <li
        v-for="item in categorySelectedItems"
        :key="item.id"
        class="bg-primary-50 flex items-center justify-between gap-2 rounded-md p-2"
      >
        <span class="text-grey-800 pl-1 text-base">{{ item.name }}</span>
        <div class="flex gap-3">
          <button
            type="button"
            aria-label="Actualizar prato"
            class="focus-visible:ring-primary-300 rounded focus:outline-none focus-visible:ring"
            @click="emit('update', item, menuCategory.id)"
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
            @click="emit('remove', item)"
          >
            <IconCancel
              :font-controlled="false"
              class="text-grey-400 hover:text-primary-500 size-[16px] transition-colors duration-300"
            />
          </button>
        </div>
      </li>
    </ul>

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
