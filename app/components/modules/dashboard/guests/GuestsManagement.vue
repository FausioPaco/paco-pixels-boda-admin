<script setup lang="ts">
import { getEventService } from '~/services/eventService';
import GuestList from './GuestsList.vue';
import GuestsQRCode from './GuestsQRCode.vue';
import InvitationsManagement from '../invitations/InvitationsManagement.vue';
import { useToast } from 'vue-toastification';
import { getInvitationService } from '~/services/invitationService';
import { useExportJob } from '~/composables/useExportJob';
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

const toast = useToast();
const { canExport } = await useInvitationSettings();

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  exportQRCodes();
  showExportFormatModal.value = false;
};

const qrExport = useExportJob({
  toast,
  toastId: `export-qrcodes-${eventStore.eventId}-${textColorExport.value}-${clientCode}`,
  toastTitle: 'Exportação de QR Codes',
  start: () =>
    eventService.startExportQRCards(
      eventStore.eventId!,
      textColorExport.value,
      clientCode,
    ),
  getStatus: (jobId) => eventService.getExportStatus(jobId),
  onCompleted: async (status) => {
    const url = `${apiImageUrl}${status.zipUrl}`;
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `QRCODES_EVENTO_${eventStore.eventInitials}.zip`;
    link.click();

    URL.revokeObjectURL(objectUrl);
  },
});

const invExport = useExportJob({
  toast,
  toastId: `export-invitations-${eventStore.eventId}-${clientCode}`,
  toastTitle: 'Exportação de convites',
  start: () => invitationService.startExportAll(eventStore.eventId!, false),
  getStatus: (jobId) => eventService.getExportStatus(jobId),
  onCompleted: async (status) => {
    const url = `${apiImageUrl}${status.zipUrl}`;
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `CONVITES_EVENTO_${eventStore.eventInitials}.zip`;
    link.click();

    URL.revokeObjectURL(objectUrl);
  },
});

const exportQRCodes = async () => {
  await qrExport.start();
};

const activeExport = computed(() => {
  if (qrExport.isRunning.value || qrExport.showProgressModal.value)
    return qrExport;
  if (invExport.isRunning.value || invExport.showProgressModal.value)
    return invExport;
  return null;
});

const anyExportRunning = computed(
  () => qrExport.isRunning.value || invExport.isRunning.value,
);
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
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="showExportFormatModal = true"
          >{{
            qrExport.isRunning
              ? `A exportar... ${qrExport.percent}%`
              : 'Exportar QRCodes'
          }}</BaseButton
        >

        <BaseButton
          v-if="canManageInvitations && canExport && !eventStore.eventModeView"
          btn-size="sm"
          icon="download"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="invExport.start()"
        >
          {{
            invExport.isRunning
              ? `A exportar... ${invExport.percent}%`
              : 'Exportar convites'
          }}
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
      :show="!!activeExport"
      :export-total="activeExport?.total"
      :export-processed="activeExport?.processed"
      :export-percent="activeExport?.percent"
      @close-modal="
        () => {
          if (activeExport) activeExport.showProgressModal.value = false;
        }
      "
    />
  </BaseCard>
</template>
