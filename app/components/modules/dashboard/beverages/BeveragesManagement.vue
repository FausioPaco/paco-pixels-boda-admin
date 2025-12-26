<!-- components/beverages/BeverageManagement.vue -->
<script setup lang="ts">
import BeveragePlanningManagement from './BeveragePlanningManagement.vue';
import BeverageEventDayManagement from './BeverageEventDayManagement.vue';

type BeverageTab = 'PLANNING' | 'EVENT_DAY';

const activeTab = ref<BeverageTab>('PLANNING');
const { eventId } = useEventStore();
</script>

<template>
  <BaseCard
    title="Gestão de bebidas"
    description="Registe as bebidas, controle o stock e faça a gestão do consumo no dia do evento."
  >
    <BaseTab>
      <BaseTabItem
        id="beverages-planning"
        icon="beverage"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'PLANNING'"
        class="w-full md:w-1/2"
        @click="activeTab = 'PLANNING'"
      >
        Registo e inventário
      </BaseTabItem>

      <BaseTabItem
        id="beverages-eventday"
        icon="beverage-eventday"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'EVENT_DAY'"
        class="w-full md:w-1/2"
        @click="activeTab = 'EVENT_DAY'"
      >
        Dia do evento
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <component
        :is="
          activeTab === 'PLANNING'
            ? BeveragePlanningManagement
            : BeverageEventDayManagement
        "
        :event-id="eventId"
      />
    </transition>
  </BaseCard>
</template>
