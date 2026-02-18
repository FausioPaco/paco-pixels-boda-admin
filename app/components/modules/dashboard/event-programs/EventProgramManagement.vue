<script setup lang="ts">
type ProgramTab = 'GUESTS' | 'INTERNAL';
const activeTab = ref<ProgramTab>('GUESTS');
const { isMultiEventStaffUser } = useAuthStore();
</script>

<template>
  <BaseCard
    title="Gestão do Programa do Evento"
    description="Gestão do programa para convidados e programa interno"
  >
    <BaseTab v-if="isMultiEventStaffUser">
      <BaseTabItem
        id="guests"
        icon="dashboard-program"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'GUESTS'"
        class="w-full md:w-1/2"
        @click="activeTab = 'GUESTS'"
      >
        Para Convidados
      </BaseTabItem>

      <BaseTabItem
        id="internal"
        icon="program-staff"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'INTERNAL'"
        class="w-full md:w-1/2"
        @click="activeTab = 'INTERNAL'"
      >
        Para Equipa Interna
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <EventProgramEditor v-if="activeTab === 'GUESTS'" :is-internal="false" />
      <EventProgramEditor v-else :is-internal="true" />
    </transition>
  </BaseCard>
</template>
