<script setup lang="ts">
import GuestList from './GuestsList.vue';
import GuestsInvitatIonModel from './GuestsInvitationModel.vue';
type GuestTab = 'LIST' | 'INVITATION';

const activeTab = ref<GuestTab>('LIST');
</script>
<template>
  <BaseCard
    title="Gestão de Convidados"
    description="Faça a gestão dos convidados deste evento aqui"
  >
    <!-- Tabs -->
    <BaseTab>
      <BaseTabItem
        id="dashboard-guests"
        icon="dashboard-guests"
        :tab-position="1"
        :total-tabs="2"
        :is-active="activeTab === 'LIST'"
        class="w-full md:w-1/2"
        @click="activeTab = 'LIST'"
        >Lista de Convidados</BaseTabItem
      >

      <BaseTabItem
        id="invitation-model"
        icon="invitation-model"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'INVITATION'"
        class="w-full md:w-1/2"
        @click="activeTab = 'INVITATION'"
        >Modelo de Convite</BaseTabItem
      >
    </BaseTab>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <component
        :is="activeTab === 'LIST' ? GuestList : GuestsInvitatIonModel"
      ></component>
    </transition>
  </BaseCard>
</template>
