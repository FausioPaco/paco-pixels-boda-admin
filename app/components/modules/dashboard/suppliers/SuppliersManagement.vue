<script setup lang="ts">
import SuppliersEventManagement from './SuppliersEventManagement.vue';
import SuppliersCatalogManagement from './SuppliersCatalogManagement.vue';

type SupplierTab = 'EVENT' | 'CATALOG';
const activeTab = ref<SupplierTab>('EVENT');
</script>

<template>
  <BaseCard
    title="Gestão de fornecedores"
    description="Registe fornecedores no evento, confirme presença/deal e reutilize fornecedores através do catálogo."
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
        Fornecedores do evento
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
        Catálogo de fornecedores
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
