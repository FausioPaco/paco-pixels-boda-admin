<script setup lang="ts">
import { getEventService } from '~/services/eventService';
import GuestList from './GuestsList.vue';
import GuestsQRCode from './GuestsQRCode.vue';
import InvitationsManagement from '../invitations/InvitationsManagement.vue';
import { useToast } from 'vue-toastification';
import { getInvitationService } from '~/services/invitationService';
type GuestTab = 'LIST' | 'QRCODE' | 'INVITATIONS';

const activeTab = ref<GuestTab>('LIST');
const eventStore = useEventStore();

const { isAdministrator, isSuperAdministrator } = useAuthStore();
const canManageInvitations = computed(
  () => isAdministrator || isSuperAdministrator,
);

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);
const invitationService = getInvitationService(nuxtApp.$api);

const { clientCode, apiImageUrl } = useRuntimeConfig().public;

const textColorExport = ref<ExportTextColor>('black');

const showExportFormatModal = ref<boolean>(false);
const isExporting = ref<boolean>(false);
const isExportingInvitations = ref<boolean>(false);

const showExportProgressModal = ref(false);
const exportJobId = ref<string | null>(null);
const exportTotal = ref(0);
const exportProcessed = ref(0);
const exportPercent = computed(() =>
  exportTotal.value <= 0
    ? 0
    : Math.round((exportProcessed.value * 100) / exportTotal.value),
);

let exportPollTimer: number | null = null;

const toast = useToast();
const { canExport } = await useInvitationSettings();

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  exportQRCodes();
  showExportFormatModal.value = false;
};

// const exportQRCodes = async () => {
//   try {
//     isExporting.value = true;
//     const blob = await eventService.exportQRCards(
//       eventStore.eventId!,
//       textColorExport.value,
//       clientCode,
//     );

//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;

//     const fileName = `QRCODES_EVENTO_${eventStore.eventInitials}.zip`;
//     link.setAttribute('download', fileName);

//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     window.URL.revokeObjectURL(url);

//     isExporting.value = false;
//   } catch (err) {
//     console.error('Erro ao exportar os QRCodes dos convidados:', err);
//     toast.error('Ocorreu um erro ao exportar os QR Codes');
//     isExporting.value = false;
//   }
// };

const exportQRCodes = async () => {
  try {
    isExporting.value = true;

    // 1) start
    const start = await eventService.startExportQRCards(
      eventStore.eventId!,
      textColorExport.value,
      clientCode,
    );

    exportJobId.value = start.jobId;
    exportTotal.value = start.total ?? 0;
    exportProcessed.value = 0;

    showExportProgressModal.value = true;

    // 2) polling
    if (exportPollTimer) window.clearInterval(exportPollTimer);

    exportPollTimer = window.setInterval(async () => {
      if (!exportJobId.value) return;

      const status = await eventService.getExportStatus(exportJobId.value);

      exportTotal.value = status.total ?? exportTotal.value;
      exportProcessed.value = status.processed ?? exportProcessed.value;

      if (status.status === 'Completed') {
        window.clearInterval(exportPollTimer!);
        exportPollTimer = null;

        const url = `${apiImageUrl}${status.zipUrl}`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `QRCODES_EVENTO_${eventStore.eventInitials}.zip`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('QR Codes exportados com sucesso!');
        showExportProgressModal.value = false;
        isExporting.value = false;
      }

      if (status.status === 'Failed') {
        window.clearInterval(exportPollTimer!);
        exportPollTimer = null;

        toast.error(status.error || 'Ocorreu um erro ao exportar os QR Codes');
        showExportProgressModal.value = false;
        isExporting.value = false;
      }

      if (status.status === 'Cancelled') {
        window.clearInterval(exportPollTimer!);
        exportPollTimer = null;

        toast.info('Exportação cancelada.');
        showExportProgressModal.value = false;
        isExporting.value = false;
      }
    }, 1200);
  } catch (err) {
    window.clearInterval(exportPollTimer!);
    exportPollTimer = null;

    console.error('Erro ao exportar os QR Codes dos convidados:', err);
    toast.error('Ocorreu um erro ao exportar os QR Codes');
    isExporting.value = false;
    showExportProgressModal.value = false;
  }
};

const exportInvitations = async () => {
  try {
    isExportingInvitations.value = true;

    const result = await invitationService.exportAll(
      eventStore.eventId!,
      false,
    );

    const url = `${apiImageUrl}${result.zipUrl}`;
    const link = document.createElement('a');
    link.href = url;

    const fileName = `CONVITES_EVENTO_${eventStore.eventInitials}.zip`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    isExportingInvitations.value = false;
  } catch (err) {
    console.error('Erro ao exportar convites:', err);
    toast.error('Ocorreu um erro ao exportar os convites');
    isExportingInvitations.value = false;
  }
};

onBeforeUnmount(() => {
  if (exportPollTimer) {
    window.clearInterval(exportPollTimer);
    exportPollTimer = null;
  }
});
</script>
<template>
  <BaseCard
    title="Gestão de Convidados"
    description="Faça a gestão dos convidados deste evento aqui"
  >
    <template #right-content>
      <div class="flex flex-wrap gap-2">
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
          btn-type="outline-primary"
          btn-size="sm"
          icon="download"
          :disabled="isExporting"
          class="animate-fadeIn"
          @click="showExportFormatModal = true"
          >{{ isExporting ? 'A exportar...' : 'Exportar QRCodes' }}</BaseButton
        >

        <BaseButton
          v-if="canManageInvitations && canExport && !eventStore.eventModeView"
          btn-size="sm"
          icon="download"
          :disabled="isExportingInvitations"
          class="animate-fadeIn"
          @click="exportInvitations"
        >
          {{ isExportingInvitations ? 'A exportar...' : 'Exportar convites' }}
        </BaseButton>
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
        >Modelo de QR Codes</BaseTabItem
      >

      <BaseTabItem
        v-if="canManageInvitations"
        id="invitations"
        icon="invitation-model"
        :tab-position="3"
        :total-tabs="3"
        :is-active="activeTab === 'INVITATIONS'"
        class="w-full md:w-1/2"
        @click="activeTab = 'INVITATIONS'"
      >
        Modelo de Convites
      </BaseTabItem>
    </BaseTab>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <component
        :is="
          activeTab === 'LIST'
            ? GuestList
            : activeTab === 'QRCODE'
              ? GuestsQRCode
              : InvitationsManagement
        "
      />
    </transition>

    <LazyGuestsExportAllQRCodesModal
      :show="showExportFormatModal"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />

    <LazyGuestsExportStatusModal
      :show="showExportProgressModal"
      :export-total="exportTotal"
      :export-processed="exportProcessed"
      :export-percent="exportPercent"
      @close-modal="showExportProgressModal = false"
    />
  </BaseCard>
</template>
