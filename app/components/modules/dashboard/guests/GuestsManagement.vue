<script setup lang="ts">
import GuestList from './GuestsList.vue';
import GuestsQRCode from './GuestsQRCode.vue';
type GuestTab = 'LIST' | 'QRCODE';

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
        id="qrcode"
        icon="qr-code"
        :tab-position="2"
        :total-tabs="2"
        :is-active="activeTab === 'QRCODE'"
        class="w-full md:w-1/2"
        @click="activeTab = 'QRCODE'"
        >QR Code</BaseTabItem
      >
    </BaseTab>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <component
        :is="activeTab === 'LIST' ? GuestList : GuestsQRCode"
      ></component>
    </transition>
  </BaseCard>
</template>
