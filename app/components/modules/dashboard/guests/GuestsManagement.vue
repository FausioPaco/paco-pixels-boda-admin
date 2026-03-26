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

const showInvitationWhatsAppSendModal = ref(false);
const activeWhatsAppMessageType = ref<GuestWhatsAppOutboundType>(
  GuestWhatsAppOutboundType.QrCode,
);

const invitationWaSummary = ref<WhatsAppDeliverySummary | null>(null);

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
    `whatsapp-send-qr:${eventStore.eventId}:${eventStore.eventSlug}:${whatsAppTextColor.value}:${whatsAppForce.value}:${whatsAppReason.value ?? ''}`,
);

const invitationWhatsAppJobKey = computed(
  () => `whatsapp-send-invitation:${eventStore.eventId}`,
);

const invitationWhatsAppJob = computed(
  () => backgroundJobs.getJobByKey(invitationWhatsAppJobKey.value).value,
);

const qrJob = computed(() => backgroundJobs.getJobByKey(qrJobKey.value).value);
const invitationJob = computed(
  () => backgroundJobs.getJobByKey(invitationJobKey.value).value,
);
const waJob = computed(
  () => backgroundJobs.getJobByKey(whatsAppJobKey.value).value,
);

const activeWhatsAppJob = computed(() =>
  activeWhatsAppMessageType.value === GuestWhatsAppOutboundType.Invitation
    ? invitationWhatsAppJob.value
    : waJob.value,
);

const activeWhatsAppSummary = computed(() =>
  activeWhatsAppMessageType.value === GuestWhatsAppOutboundType.Invitation
    ? invitationWaSummary.value
    : waSummary.value,
);

const normalizeZipUrl = (zipUrl?: string | null) => {
  if (!zipUrl) return null;
  return `${apiImageUrl}${zipUrl}`;
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
      refreshGuests({ force: true });
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
      refreshGuests({ force: true });
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

const startBulkQRWhatsAppSend = async (payload: {
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

  dismissedWhatsAppJobKeys.value = dismissedWhatsAppJobKeys.value.filter(
    (key) => key !== whatsAppJobKey.value,
  );

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

const startBulkInvitationWhatsAppSend = async () => {
  activeWhatsAppMessageType.value = GuestWhatsAppOutboundType.Invitation;

  showInvitationWhatsAppSendModal.value = false;
  showWhatsAppSendStatusModal.value = true;
  invitationWaSummary.value = null;

  dismissedWhatsAppJobKeys.value = dismissedWhatsAppJobKeys.value.filter(
    (key) => key !== invitationWhatsAppJobKey.value,
  );

  await backgroundJobs.startTrackedJob({
    key: invitationWhatsAppJobKey.value,
    kind: 'whatsapp-send',
    title: 'Envio de convites via WhatsApp',
    toastId: invitationWhatsAppJobKey.value,
    eventId: eventStore.eventId!,
    eventSlug: eventStore.eventSlug ?? undefined,
    eventName: eventStore.eventName,
    start: async () => {
      const res = await invitationService.startSendInvitationsWhatsapp(
        eventStore.eventId!,
      );

      return {
        jobId: res.jobId,
        total: res.total,
        uiNote: res.uiNote ?? undefined,
      };
    },
    onCompleted: async () => {
      invitationWaSummary.value =
        await invitationService.getInvitationWhatsappSummary(
          eventStore.eventId!,
        );
      await refreshGuests({ force: true });
      showWhatsAppSendStatusModal.value = true;
    },
    onFailed: async () => {
      invitationWaSummary.value =
        await invitationService.getInvitationWhatsappSummary(
          eventStore.eventId!,
        );
      showWhatsAppSendStatusModal.value = true;
    },
    onCancelled: async () => {
      invitationWaSummary.value = null;
      showWhatsAppSendStatusModal.value = false;
    },
  });
};

const closeWhatsAppSendStatusModal = () => {
  if (waJob.value?.key) {
    if (!dismissedWhatsAppJobKeys.value.includes(waJob.value.key)) {
      dismissedWhatsAppJobKeys.value.push(waJob.value.key);
    }
  }

  showWhatsAppSendStatusModal.value = false;
};

const dismissedWhatsAppJobKeys = ref<string[]>([]);

watch(
  activeWhatsAppJob,
  (job, previousJob) => {
    if (!job) return;

    const isActive = job.status === 'Pending' || job.status === 'Running';
    const wasActive =
      previousJob?.status === 'Pending' || previousJob?.status === 'Running';

    if (
      isActive &&
      !wasActive &&
      !dismissedWhatsAppJobKeys.value.includes(job.key)
    ) {
      showWhatsAppSendStatusModal.value = true;
    }
  },
  { immediate: true },
);

const anyExportRunning = computed(
  () =>
    qrJob.value?.status === 'Pending' ||
    qrJob.value?.status === 'Running' ||
    invitationJob.value?.status === 'Pending' ||
    invitationJob.value?.status === 'Running' ||
    waJob.value?.status === 'Pending' ||
    waJob.value?.status === 'Running' ||
    invitationWhatsAppJob.value?.status === 'Pending' ||
    invitationWhatsAppJob.value?.status === 'Running',
);

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  exportQRCodes();
  showExportFormatModal.value = false;
};

const activeTrackedJob = computed(() => {
  if (!backgroundJobs.activeJobKey) return null;

  return (
    backgroundJobs.jobs.find(
      (job) => job.key === backgroundJobs.activeJobKey,
    ) ?? null
  );
});

const activeExportModalJob = computed(() => {
  const job = activeTrackedJob.value;
  if (!job) return null;

  if (job.kind === 'qr-export' || job.kind === 'invitation-export') {
    return job;
  }

  return null;
});
</script>
<template>
  <BaseCard
    title="Gestão de Convidados"
    description="Faça a gestão dos convidados deste evento aqui"
  >
    <template #right-content>
      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        :icon-size="24"
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

    <div
      class="mb-8 mt-3 flex flex-wrap justify-start gap-2 md:justify-between"
    >
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-if="eventStore.eventQRCodeUrl && !eventStore.eventModeView"
          btn-type="outline-primary"
          btn-size="sm"
          icon="whatsapp"
          :icon-size="20"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="showWhatsAppSendModal = true"
        >
          {{
            waJob?.status === 'Pending' || waJob?.status === 'Running'
              ? `A enviar... ${waJob?.percent ?? 0}%`
              : 'Enviar QRs'
          }}
        </BaseButton>

        <BaseButton
          v-if="canManageInvitations && canExport && !eventStore.eventModeView"
          btn-type="outline-primary"
          btn-size="sm"
          icon="whatsapp"
          :icon-size="20"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="showInvitationWhatsAppSendModal = true"
        >
          {{
            invitationWhatsAppJob?.status === 'Pending' ||
            invitationWhatsAppJob?.status === 'Running'
              ? `A enviar... ${invitationWhatsAppJob?.percent ?? 0}%`
              : 'Enviar convites'
          }}
        </BaseButton>
      </div>

      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-if="eventStore.eventQRCodeUrl && !eventStore.eventModeView"
          btn-type="outline-primary"
          btn-size="sm"
          :icon-size="20"
          icon="download"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          @click="showExportFormatModal = true"
        >
          {{
            qrJob?.status === 'Pending' || qrJob?.status === 'Running'
              ? `A exportar... ${qrJob?.percent ?? 0}%`
              : 'Exportar QR Codes'
          }}
        </BaseButton>
        <BaseButton
          v-if="canManageInvitations && canExport && !eventStore.eventModeView"
          btn-size="sm"
          :icon-size="20"
          icon="download"
          :disabled="anyExportRunning"
          class="animate-fadeIn"
          btn-type="outline-primary"
          @click="exportInvitations()"
        >
          {{
            invitationJob?.status === 'Pending' ||
            invitationJob?.status === 'Running'
              ? `A exportar... ${invitationJob?.percent ?? 0}%`
              : 'Exportar Convites'
          }}
        </BaseButton>
      </div>
    </div>

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
      v-if="activeExportModalJob"
      :show="true"
      :export-total="activeExportModalJob.total"
      :export-processed="activeExportModalJob.processed"
      :export-percent="activeExportModalJob.percent"
      @close-modal="backgroundJobs.closeJob()"
    />

    <LazyGuestsSendAllWhatsappQRCodesModal
      :show="showWhatsAppSendModal"
      @close-modal="showWhatsAppSendModal = false"
      @send="startBulkQRWhatsAppSend"
    />

    <GuestsWhatsAppSendStatusModal
      :show="showWhatsAppSendStatusModal"
      :message-type="activeWhatsAppMessageType"
      :export-total="activeWhatsAppJob?.total ?? 0"
      :export-processed="activeWhatsAppJob?.processed ?? 0"
      :export-percent="activeWhatsAppJob?.percent ?? 0"
      :summary="activeWhatsAppSummary"
      @close-modal="closeWhatsAppSendStatusModal"
    />

    <LazyGuestsSendAllWhatsappInvitationsModal
      :show="showInvitationWhatsAppSendModal"
      @close-modal="showInvitationWhatsAppSendModal = false"
      @send="startBulkInvitationWhatsAppSend"
    />
  </BaseCard>
</template>
