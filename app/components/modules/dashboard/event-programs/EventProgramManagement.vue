<script setup lang="ts">
type ProgramTab = 'GUESTS' | 'INTERNAL';
const activeTab = ref<ProgramTab>('GUESTS');
</script>

<template>
  <BaseCard
    title="Programa do Evento"
    description="Gestão do programa para convidados e programa interno"
  >
    <BaseTab>
      <BaseTabItem
        id="guests"
        icon="dashboard-program"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'GUESTS'"
        class="w-full md:w-1/2"
        @click="activeTab = 'GUESTS'"
      >
        Convidados
      </BaseTabItem>

      <BaseTabItem
        id="internal"
        icon="dashboard-settings"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'INTERNAL'"
        class="w-full md:w-1/2"
        @click="activeTab = 'INTERNAL'"
      >
        Interno
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <EventProgramEditor v-if="activeTab === 'GUESTS'" :is-internal="false" />
      <EventProgramEditor v-else :is-internal="true" />
    </transition>
  </BaseCard>
</template>
