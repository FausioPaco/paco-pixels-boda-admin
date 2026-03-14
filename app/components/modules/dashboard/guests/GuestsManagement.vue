<script setup lang="ts">
import { getEventService } from '~/services/eventService';
import GuestList from './GuestsList.vue';
import GuestsQRCode from './GuestsQRCode.vue';
import InvitationsManagement from '../invitations/InvitationsManagement.vue';
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
const { refreshGuests } = await useGuestsList();

const textColorExport = ref<ExportTextColor>('black');
const showExportFormatModal = ref<boolean>(false);
const { canExport } = await useInvitationSettings();

const whatsAppTextColor = ref<ExportTextColor>('black');
const whatsAppForce = ref(false);
const whatsAppReason = ref<string | undefined>(undefined);
const waSummary = ref<WhatsAppQrLogsSummary | null>(null);
const showWhatsAppSendStatusModal = ref(false);
const showWhatsAppSendModal = ref(false);

const backgroundJobs = useBackgroundJobsStore();

const qrJobKey = computed(
  () =>
    `qr-export:${eventStore.eventId}:${textColorExport.value}:${clientCode}`,
);

const invitationJobKey = computed(
  () => `invitation-export:${eventStore.eventId}:${clientCode}`,
);

const whatsAppJobKey = computed(
  () =>
    `whatsapp-send:${eventStore.eventId}:${eventStore.eventSlug}:${whatsAppTextColor.value}:${whatsAppForce.value}:${whatsAppReason.value ?? ''}`,
);

const qrJob = computed(() => backgroundJobs.getJobByKey(qrJobKey.value).value);
const invitationJob = computed(
  () => backgroundJobs.getJobByKey(invitationJobKey.value).value,
);
const waJob = computed(
  () => backgroundJobs.getJobByKey(whatsAppJobKey.value).value,
);

const normalizeZipUrl = (zipUrl?: string | null) => {
  if (!zipUrl) return null;
  return zipUrl.startsWith('http') ? zipUrl : `${apiImageUrl}${zipUrl}`;
};

const exportQRCodes = async () => {
  await backgroundJobs.startTrackedJob({
    key: qrJobKey.value,
    kind: 'qr-export',
    title: 'Exportação de QR Codes',
    toastId: qrJobKey.value,
    eventId: eventStore.eventId!,
    eventSlug: eventStore.eventSlug ?? undefined,
    eventName: eventStore.eventName,
    start: async () => {
      const res = await eventService.startExportQRCards(
        eventStore.eventId!,
        textColorExport.value,
        clientCode,
      );

      return {
        jobId: res.jobId,
        total: res.total,
      };
    },
    onCompleted: async (job) => {
      const url = normalizeZipUrl(job.zipUrl);
      if (!url) return;
      window.location.assign(url);
    },
  });
};

const exportInvitations = async () => {
  await backgroundJobs.startTrackedJob({
    key: invitationJobKey.value,
    kind: 'invitation-export',
    title: 'Exportação de convites',
    toastId: invitationJobKey.value,
    eventId: eventStore.eventId!,
    eventSlug: eventStore.eventSlug ?? undefined,
    eventName: eventStore.eventName,
    start: async () => {
      const res = await invitationService.startExportAll(
        eventStore.eventId!,
        false,
      );

      return {
        jobId: res.jobId,
        total: res.total,
      };
    },
    onCompleted: async (job) => {
      const url = normalizeZipUrl(job.zipUrl);
      if (!url) return;
      window.location.assign(url);
    },
  });
};

const fetchWhatsAppSummary = async () => {
  try {
    waSummary.value = await eventService.getSendQrCardsWhatsappSummary(
      eventStore.eventId!,
    );
  } catch (error) {
    waSummary.value = null;
    console.error('Erro ao obter resumo do envio WhatsApp:', error);
  }
};

const startBulkWhatsAppSend = async (payload: {
  color: ExportTextColor;
  force: boolean;
  reason?: string;
}) => {
  whatsAppTextColor.value = payload.color;
  whatsAppForce.value = payload.force;
  whatsAppReason.value = payload.reason;

  showWhatsAppSendModal.value = false;
  showWhatsAppSendStatusModal.value = true;
  waSummary.value = null;

  await backgroundJobs.startTrackedJob({
    key: whatsAppJobKey.value,
    kind: 'whatsapp-send',
    title: 'Envio de QR Codes via WhatsApp',
    toastId: whatsAppJobKey.value,
    eventId: eventStore.eventId!,
    eventSlug: eventStore.eventSlug ?? undefined,
    eventName: eventStore.eventName,
    start: async () => {
      const res = await eventService.startSendQrCardsWhatsapp(
        eventStore.eventId!,
        whatsAppTextColor.value,
        clientCode,
        whatsAppForce.value,
        whatsAppReason.value,
      );

      return {
        jobId: res.jobId,
        total: res.total,
        uiNote: res.uiNote,
      };
    },
    onCompleted: async () => {
      await fetchWhatsAppSummary();
      await refreshGuests({ force: true });
      showWhatsAppSendStatusModal.value = true;
    },
    onFailed: async () => {
      await fetchWhatsAppSummary();
      showWhatsAppSendStatusModal.value = true;
    },
    onCancelled: async () => {
      waSummary.value = null;
      showWhatsAppSendStatusModal.value = false;
    },
  });
};

const closeWhatsAppSendStatusModal = () => {
  waSummary.value = null;
  showWhatsAppSendStatusModal.value = false;
};

watch(
  waJob,
  (job) => {
    if (!job) return;

    const isActive = job.status === 'Pending' || job.status === 'Running';
    if (isActive) {
      showWhatsAppSendStatusModal.value = true;
    }
  },
  { immediate: true },
);

const activeExport = computed(() => {
  if (
    qrJob.value &&
    (qrJob.value.status === 'Pending' || qrJob.value.status === 'Running')
  ) {
    return qrJob.value;
  }

  if (
    invitationJob.value &&
    (invitationJob.value.status === 'Pending' ||
      invitationJob.value.status === 'Running')
  ) {
    return invitationJob.value;
  }

  return null;
});

const anyExportRunning = computed(
  () =>
    qrJob.value?.status === 'Pending' ||
    qrJob.value?.status === 'Running' ||
    invitationJob.value?.status === 'Pending' ||
    invitationJob.value?.status === 'Running' ||
    waJob.value?.status === 'Pending' ||
    waJob.value?.status === 'Running',
);

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  exportQRCodes();
  showExportFormatModal.value = false;
};
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
        >
          {{
            qrJob?.status === 'Pending' || qrJob?.status === 'Running'
              ? `A exportar... ${qrJob?.percent ?? 0}%`
              : 'Exportar QRCodes'
          }}
        </BaseButton>

        <BaseButton
          v-if="canManageInvitations && canExport && !eventStore.eventModeView"
          btn-size="sm"
          icon="download"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="exportInvitations()"
        >
          {{
            invitationJob?.status === 'Pending' ||
            invitationJob?.status === 'Running'
              ? `A exportar... ${invitationJob?.percent ?? 0}%`
              : 'Exportar convites'
          }}
        </BaseButton>

        <BaseButton
          v-if="eventStore.eventQRCodeUrl && !eventStore.eventModeView"
          btn-type="outline-primary"
          btn-size="sm"
          icon="whatsapp"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="showWhatsAppSendModal = true"
        >
          {{
            waJob?.status === 'Pending' || waJob?.status === 'Running'
              ? `A enviar... ${waJob?.percent ?? 0}%`
              : 'Enviar QRs via WhatsApp'
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

    <LazyGuestsAllQRCodesColorModal
      :show="showExportFormatModal"
      mode="export"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />

    <GuestsExportStatusModal
      v-if="activeExport"
      :show="true"
      :export-total="activeExport.total"
      :export-processed="activeExport.processed"
      :export-percent="activeExport.percent"
      @close-modal="backgroundJobs.closeJob()"
    />

    <LazyGuestsSendAllWhatsappQRCodesModal
      :show="showWhatsAppSendModal"
      @close-modal="showWhatsAppSendModal = false"
      @send="startBulkWhatsAppSend"
    />

    <GuestsWhatsAppSendStatusModal
      :show="showWhatsAppSendStatusModal"
      :export-total="waJob?.total ?? 0"
      :export-processed="waJob?.processed ?? 0"
      :export-percent="waJob?.percent ?? 0"
      :summary="waSummary"
      @close-modal="closeWhatsAppSendStatusModal"
    />
  </BaseCard>
</template>
