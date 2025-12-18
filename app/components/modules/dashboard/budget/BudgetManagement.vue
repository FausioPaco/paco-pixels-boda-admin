<script setup lang="ts">
import BudgetEventManagement from './BudgetEventManagement.vue';
import BudgetTemplateManagement from './BudgetTemplateManagement.vue';

type BudgetTab = 'EVENT' | 'TEMPLATE';

const activeTab = ref<BudgetTab>('EVENT');
const { isMultiEventStaffUser } = useAuthStore();
</script>

<template>
  <BaseCard
    title="Orçamento"
    description="Controla custos, pagamentos e categorias do orçamento do evento."
  >
    <BaseTab v-if="isMultiEventStaffUser">
      <BaseTabItem
        id="budget-event"
        icon="budget"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'EVENT'"
        class="w-full md:w-1/2"
        @click="activeTab = 'EVENT'"
      >
        Custos gerais
      </BaseTabItem>

      <BaseTabItem
        id="budget-template"
        icon="budget-template"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'TEMPLATE'"
        class="w-full md:w-1/2"
        @click="activeTab = 'TEMPLATE'"
      >
        Modelo de orçamento
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <component
        :is="
          activeTab === 'EVENT'
            ? BudgetEventManagement
            : BudgetTemplateManagement
        "
      />
    </transition>
  </BaseCard>
</template>
