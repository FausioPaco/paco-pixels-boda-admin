<script setup lang="ts">
import { getEventService } from '~/services/eventService';
import GuestList from './GuestsList.vue';
import GuestsQRCode from './GuestsQRCode.vue';
import { useToast } from 'vue-toastification';
type GuestTab = 'LIST' | 'QRCODE';

const activeTab = ref<GuestTab>('LIST');
const eventStore = useEventStore();

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);
const { clientCode } = useRuntimeConfig().public;

const textColorExport = ref<ExportTextColor>('black');

const showExportFormatModal = ref<boolean>(false);
const isExporting = ref<boolean>(false);
const toast = useToast();

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  exportQRCodes();
  showExportFormatModal.value = false;
};

const exportQRCodes = async () => {
  try {
    isExporting.value = true;
    const blob = await eventService.exportQRCards(
      eventStore.eventId!,
      textColorExport.value,
      clientCode,
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `QRCODES_EVENTO_${eventStore.eventInitials}.zip`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    isExporting.value = false;
  } catch (err) {
    console.error('Erro ao exportar os QRCodes dos convidados:', err);
    toast.error('Ocorreu um erro ao exportar os QR Codes');
    isExporting.value = false;
  }
};
</script>
<template>
  <BaseCard
    title="Gestão de Convidados"
    description="Faça a gestão dos convidados deste evento aqui"
  >
    <template #right-content>
      <div class="flex gap-2">
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
        <BaseButton
          v-if="eventStore.eventQRCodeUrl && !eventStore.eventModeView"
          btn-size="md"
          icon="download"
          :disabled="isExporting"
          class="animate-fadeIn"
          @click="showExportFormatModal = true"
          >{{ isExporting ? 'A exportar...' : 'Exportar QRCodes' }}</BaseButton
        >
      </div>
    </template>

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

    <LazyGuestsExportAllQRCodesModal
      :show="showExportFormatModal"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />
  </BaseCard>
</template>
