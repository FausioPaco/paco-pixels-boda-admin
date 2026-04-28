<script setup lang="ts">
import BudgetEventManagement from './BudgetEventManagement.vue';
import BudgetTemplateManagement from './BudgetTemplateManagement.vue';

type BudgetTab = 'EVENT' | 'TEMPLATE';

const activeTab = ref<BudgetTab>('EVENT');
const { isMultiEventStaffUser } = useAuthStore();
const { t } = useI18n();
</script>

<template>
  <BaseCard
    :title="t('budget.card_title')"
    :description="t('budget.card_description')"
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
        {{ t('budget.tab_general') }}
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
        {{ t('budget.tab_template') }}
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
