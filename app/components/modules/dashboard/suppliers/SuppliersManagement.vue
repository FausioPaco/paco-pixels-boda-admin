<script setup lang="ts">
import SuppliersEventManagement from './SuppliersEventManagement.vue';
import SuppliersCatalogManagement from './SuppliersCatalogManagement.vue';

const { t } = useI18n();
type SupplierTab = 'EVENT' | 'CATALOG';
const activeTab = ref<SupplierTab>('EVENT');
</script>

<template>
  <BaseCard
    :title="t('suppliers.card_title')"
    :description="t('suppliers.card_description')"
  >
    <BaseTab>
      <BaseTabItem
        id="suppliers-event"
        icon="suppliers-event"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'EVENT'"
        class="w-full md:w-1/2"
        @click="activeTab = 'EVENT'"
      >
        {{ t('suppliers.tab_event') }}
      </BaseTabItem>

      <BaseTabItem
        id="suppliers-catalog"
        icon="suppliers-catalog"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'CATALOG'"
        class="w-full md:w-1/2"
        @click="activeTab = 'CATALOG'"
      >
        {{ t('suppliers.tab_catalog') }}
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <component
        :is="
          activeTab === 'EVENT'
            ? SuppliersEventManagement
            : SuppliersCatalogManagement
        "
      />
    </transition>
  </BaseCard>
</template>
