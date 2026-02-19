<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getMenuService } from '~/services/menuService';

const { menu, isRefreshing, isError, refreshMenu } = await useMenu();
const { categories } = await useMenuCategories();
const { isAdministrator, isSuperAdministrator } = useAuthStore();
const showFormModal = ref<boolean>(false);
const showAddOrUpdateItemModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const selectedCategoryId = ref<number | undefined>(undefined);
const selectedMenuItem = ref<MenuItem | undefined>(undefined);

const handleAddItem = (menuCategoryId: number) => {
  selectedCategoryId.value = menuCategoryId;
  showAddOrUpdateItemModal.value = true;
};

const handleUpdateItem = (item: MenuItem, menuCategoryId: number) => {
  selectedCategoryId.value = menuCategoryId;
  selectedMenuItem.value = item;
  showAddOrUpdateItemModal.value = true;
};

const resetAllValues = () => {
  refreshMenu();
  resetValues();
};

const resetValues = () => {
  selectedCategoryId.value = undefined;
  selectedMenuItem.value = undefined;
  showAddOrUpdateItemModal.value = false;
  showRemoveModal.value = false;
};

const handleRemoveItem = (item: MenuItem) => {
  selectedMenuItem.value = item;
  showRemoveModal.value = true;
};

const getMenuCategoryName = computed(() => {
  if (!selectedCategoryId.value) return undefined;

  return categories.value.find((c) => c.id === selectedCategoryId.value)?.title;
});

const nuxtApp = useNuxtApp();
const menuService = getMenuService(nuxtApp.$api);
const toast = useToast();
const isReorderingItems = ref(false);

const handleReorderItems = async (
  menuCategoryId: number,
  orderedItemIds: number[],
) => {
  if (!menu.value) return;

  isReorderingItems.value = true;

  try {
    // chamada ao backend (reorder por categoria)
    await menuService.reorderMenuItems(menu.value.id, menuCategoryId, {
      itemIds: orderedItemIds,
    });

    // refresh para garantir consistência (e resolver possíveis diferenças de order do backend)
    await refreshMenu();
  } catch (error) {
    console.error('Erro ao reordenar itens do menu', error);
    toast.error('Não foi possível reordenar os itens. Tente novamente.');
    await refreshMenu();
  } finally {
    isReorderingItems.value = false;
  }
};
</script>
<template>
  <section
    id="menuManagement"
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      v-if="isRefreshing || isError || !menu"
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch md:min-w-[45vw] lg:min-w-[60vw] xl:min-w-[75vw]"
    >
      <!-- Loading -->
      <BaseLoading
        v-if="isRefreshing"
        size="lg"
        orientation="vertical"
        class="block md:hidden"
      />

      <!-- Error -->
      <BaseSearchNotFound v-if="isError" @fallback="refreshMenu">
        Infelizmente, ocorreu um erro ao buscar o menu, contacte-nos para
        resolução do problema
      </BaseSearchNotFound>

      <!-- No menu: first Time -->
      <LazyBaseFirstEmptyState
        v-if="!isRefreshing && !isError && !menu"
        icon="icon-menu-desks"
        title="Ainda não criou nenhum menu"
        description="Crie o seu menu para começar a organizar os pratos que serão servidos no evento."
        :show-button="isAdministrator || isSuperAdministrator"
        button-label="Criar menu"
        button-icon="add"
        @action="showFormModal = true"
      />
    </div>

    <!-- Menu categories -->
    <p
      v-if="menu"
      class="text-grey-400 ml-2 animate-fadeIn text-sm font-bold md:ml-0"
    >
      Personalize o menu abaixo ao adicionar ou remover pratos nas diferentes
      categorias
    </p>
    <div
      v-if="menu"
      class="grid-auto-rows mx-4 mt-3 grid gap-2 md:grid-cols-3 md:gap-11"
    >
      <LazyMenuCategoryItem
        v-for="category in categories"
        :key="category.id"
        :menu-category="category"
        :menu-id="menu.id"
        :items="menu.items"
        :is-reordering="isReorderingItems"
        @add="handleAddItem"
        @remove="handleRemoveItem"
        @update="handleUpdateItem"
        @reorder="handleReorderItems"
      />
    </div>

    <!-- Modals -->
    <LazyMenuCreateModal
      :show="showFormModal"
      @close-modal="showFormModal = false"
      @success="resetAllValues"
    />

    <LazyMenuItemFormModal
      v-if="menu"
      :show="showAddOrUpdateItemModal"
      :item="selectedMenuItem"
      :menu-category-id="selectedCategoryId"
      :menu-category-name="getMenuCategoryName"
      :menu-id="menu.id"
      @close-modal="resetValues"
      @success="resetAllValues"
    />

    <LazyMenuItemRemoveModal
      :show="showRemoveModal"
      :item="selectedMenuItem"
      @close-modal="showRemoveModal = false"
      @success="resetAllValues"
    />
  </section>
</template>
