<script setup lang="ts">
import ChecklistEventManagement from './ChecklistEventManagement.vue';
import ChecklistTemplateManagement from './ChecklistTemplateManagement.vue';

type ChecklistTab = 'EVENT' | 'TEMPLATE';

const activeTab = ref<ChecklistTab>('EVENT');
const { isMultiEventStaffUser } = useAuthStore();
</script>
<template>
  <BaseCard
    title="Cronograma do Evento"
    description="Organize e actualize facilmente todas as actividades e horários importantes deste evento."
  >
    <!-- Tabs -->
    <BaseTab v-if="isMultiEventStaffUser">
      <BaseTabItem
        id="checklist"
        icon="calendar"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'EVENT'"
        class="w-full md:w-1/2"
        @click="activeTab = 'EVENT'"
        >Cronograma</BaseTabItem
      >

      <BaseTabItem
        id="checklist-template"
        icon="checklist-template"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'TEMPLATE'"
        class="w-full md:w-1/2"
        @click="activeTab = 'TEMPLATE'"
        >Modelo de Cronograma</BaseTabItem
      >
    </BaseTab>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <component
        :is="
          activeTab === 'EVENT'
            ? ChecklistEventManagement
            : ChecklistTemplateManagement
        "
      ></component>
    </transition>
  </BaseCard>
</template>
