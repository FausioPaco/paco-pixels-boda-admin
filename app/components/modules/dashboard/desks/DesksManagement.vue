<script setup lang="ts">
import DesksList from './DesksList.vue';
import DesksMap from './DesksMap.vue';
type DeskTab = 'LIST' | 'MAP';

const activeTab = ref<DeskTab>('LIST');
const eventStore = useEventStore();
</script>
<template>
  <BaseCard
    title="Gestão de Mesas"
    description="Faça a gestão das mesas deste evento aqui"
  >
    <template #right-content>
      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        :icon="eventStore.eventModeView ? 'hide' : 'view'"
        @click="eventStore.toggleEventMode()"
      >
        {{
          eventStore.eventModeView
            ? 'Desactivar modo evento'
            : 'Ver em modo evento'
        }}
      </BaseButton>
    </template>

    <!-- Tabs -->
    <BaseTab>
      <BaseTabItem
        id="list"
        icon="dashboard-desks"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'LIST'"
        class="w-full md:w-1/2"
        @click="activeTab = 'LIST'"
        >Lista de Mesas</BaseTabItem
      >

      <BaseTabItem
        id="desks-map"
        icon="desks-map"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'MAP'"
        class="w-full md:w-1/2"
        @click="activeTab = 'MAP'"
        >Mapa de Mesas</BaseTabItem
      >
    </BaseTab>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <component :is="activeTab === 'LIST' ? DesksList : DesksMap"></component>
    </transition>
  </BaseCard>
</template>
