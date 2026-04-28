<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getDeskService } from '~/services/deskService';
import { getEventService } from '~/services/eventService';
import { getInvitationService } from '~/services/invitationService';
import { generateSlug } from '~/utils/stringUtils';

interface GuestViewProps {
  guest: Guest;
}

const { $html2canvas, $jsPDF } = useNuxtApp();
const { siteConfig } = await useClientConfig();
const InvitationComponent = shallowRef();

const props = defineProps<GuestViewProps>();
const toast = useToast();
const { t } = useI18n();
const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const showExportFormatModal = ref<boolean>(false);

const eventStore = useEventStore();

const { guest: guestState, refreshGuest } = await useGuest(props.guest.id);
const guestDetails = computed<Guest>(() => guestState.value ?? props.guest);

const desk = ref<Desk | null | undefined>(undefined);
const isLoadingDesk = ref(false);
const showForExport = ref(false);
const qrCodeRef = ref();
const isExporting = ref(false);
const isGeneratingInvitation = ref(false);
const textColorExport = ref<ExportTextColor>('black');

const nuxtApp = useNuxtApp();
const deskService = getDeskService(nuxtApp.$api);
const invitationService = getInvitationService(nuxtApp.$api);
const { apiImageUrl } = useRuntimeConfig().public;

const eventService = getEventService(nuxtApp.$api);
const { clientCode } = useRuntimeConfig().public;

const showWhatsAppColorModal = ref(false);
const showWhatsAppResendQRCodeModal = ref(false);

const isSendingQRCodeWhatsApp = ref(false);
const isSendingInvitationWhatsApp = ref(false);

const showInvitationWhatsAppResendModal = ref(false);

async function fetchDeskById(id: number) {
  if (!id) return;
  isLoadingDesk.value = true;
  try {
    desk.value = await deskService.getDesk(id);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    desk.value = undefined;
  } finally {
    isLoadingDesk.value = false;
  }
}

const guestsPeopleCount = computed(() => {
  return desk.value?.guests?.reduce((sum, g) => sum + g.people_Count, 0) ?? 0;
});

const refreshDetails = async () => {
  await refreshGuest({ force: true });
  await fetchDeskById(props.guest.deskId);
};

watch(
  () => props.guest.deskId,
  async (newId) => {
    await fetchDeskById(newId);
  },
  { immediate: true },
);

const exportQRImage = async () => {
  try {
    if (!import.meta.client) return;

    isExporting.value = true;
    showForExport.value = true;

    await nextTick();

    const el = qrCodeRef.value?.el;

    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Elemento DOM não disponível');
    }
    const canvas = await $html2canvas(qrCodeRef.value?.el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const image = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = image;
    link.download = `${eventStore.eventInitials}-${props.guest.localId}-${generateSlug(props.guest.name)}.png`;
    link.click();
  } catch (err) {
    console.error(err);
    toast.error(t('guests.error_export_qr'));
  } finally {
    isExporting.value = false;
    showForExport.value = false;
  }
};

const exportQRPDF = async () => {
  try {
    isExporting.value = true;
    showForExport.value = true;
    await nextTick();

    const el = qrCodeRef.value?.el;

    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Elemento DOM do QRCode não encontrado.');
    }

    const canvas = await $html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    const imgProps = await new $jsPDF().getImageProperties(imgData);

    const pxToMm = (px: number) => (px * 25.4) / 96;
    const pdfWidth = pxToMm(imgProps.width);
    const pdfHeight = pxToMm(imgProps.height);

    const pdf = new $jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const fileName = `${eventStore.eventInitials}-${guestDetails.value.localId}-${generateSlug(guestDetails.value.name)}.png`;
    pdf.save(fileName);
  } catch (err) {
    console.error(err);
    toast.error(t('guests.error_export_qr_pdf'));
  } finally {
    isExporting.value = false;
    showForExport.value = false;
  }
};

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  if (exportOptions.format === 'png') {
    exportQRImage();
  } else if (exportOptions.format === 'pdf') {
    exportQRPDF();
  }

  showExportFormatModal.value = false;
};

const onConfirmWhatsAppColor = async (options: ExportQROptions) => {
  textColorExport.value = options.color;
  showWhatsAppColorModal.value = false;

  if (hasPreviousQRCodeWhatsAppSend.value) {
    showWhatsAppResendQRCodeModal.value = true;
    return;
  }

  await sendQrWhatsapp();
};

const confirmWhatsAppQrResend = async () => {
  showWhatsAppResendQRCodeModal.value = false;
  await sendQrWhatsapp(true);
};

const { canExport: canExportInvitation } = await useInvitationSettings();

const generateInvitationPng = async () => {
  try {
    isGeneratingInvitation.value = true;

    const eventId = eventStore.ensureSelected();
    const result = await invitationService.renderGuest(
      eventId,
      props.guest.id,
      false,
    );

    const url = `${apiImageUrl}${result.fileUrl}?t=${new Date().getTime()}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Falha ao descarregar imagem. Status: ${response.status}`,
      );
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${eventStore.eventInitials}-${guestDetails.value.localId}-convite.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error(err);
    toast.error(t('guests.error_generate_invitation'));
  } finally {
    isGeneratingInvitation.value = false;
  }
};

const sortedOutbounds = computed(() =>
  sortOutboundsByPriority(guestDetails.value?.whatsAppOutbounds),
);

const outboundTypeLabelMap: Record<GuestWhatsAppOutboundType, string> = {
  [GuestWhatsAppOutboundType.Unknown]: 'Desconhecido',
  [GuestWhatsAppOutboundType.QrCode]: 'QR Code',
  [GuestWhatsAppOutboundType.Invitation]: 'Convite',
  [GuestWhatsAppOutboundType.SaveTheDate]: 'Save the date',
  [GuestWhatsAppOutboundType.Reminder]: 'Lembrete',
};

const getOutboundTypeLabel = (type: GuestWhatsAppOutboundType) =>
  outboundTypeLabelMap[type] ?? 'Desconhecido';

const visibleOutbounds = computed(() =>
  (sortedOutbounds.value ?? []).filter((item) => {
    return (
      item.type !== GuestWhatsAppOutboundType.QrCode &&
      item.type !== GuestWhatsAppOutboundType.SaveTheDate &&
      item.type !== GuestWhatsAppOutboundType.Reminder
    );
  }),
);

const invitationOutbound = computed(() => {
  return (guestDetails.value?.whatsAppOutbounds ?? []).find(
    (item) => item.type === GuestWhatsAppOutboundType.Invitation,
  );
});

const onSendInvitationWhatsapp = async () => {
  if (hasPreviousInvitationWhatsAppSend.value) {
    showInvitationWhatsAppResendModal.value = true;
    return;
  }

  await sendInvitationWhatsapp();
};

const confirmInvitationWhatsAppResend = async () => {
  showInvitationWhatsAppResendModal.value = false;
  await sendInvitationWhatsapp();
};

const sendQrWhatsapp = async (force = false) => {
  try {
    isSendingQRCodeWhatsApp.value = true;

    const eventId = eventStore.ensureSelected();

    const res: SendQrToGuestResponse =
      await eventService.sendQrCardWhatsappToGuest(
        eventId,
        guestDetails.value.id,
        textColorExport.value,
        clientCode,
        force,
        force ? 'Reenvio manual via GuestView' : undefined,
      );

    await refreshGuest({ force: true });

    if (res.status?.toLowerCase().includes('skipped')) {
      toast.info(res.reason || 'O envio foi ignorado.');
      return;
    }

    if (res.error) {
      toast.error(res.error);
      return;
    }

    if (res.status === 'accepted') {
      toast.success(
        `${force ? 'QR reenviado' : 'QR enviado'} via WhatsApp com sucesso. A mensagem foi aceite pela plataforma e aguarda confirmação final.`,
      );

      return;
    }

    toast.success(
      `${force ? 'Reenvio' : 'Envio'} do QR Code via WhatsApp iniciado com sucesso. Acompanhe o status do envio para mais detalhes.`,
    );
  } catch (err) {
    console.error(err);
    toast.error(t('guests.error_send_qr_whatsapp'));
  } finally {
    isSendingQRCodeWhatsApp.value = false;
  }
};

const sendInvitationWhatsapp = async () => {
  try {
    isSendingInvitationWhatsApp.value = true;

    const eventId = eventStore.ensureSelected();

    const res: SendWhatsAppOutboundToGuestResponse =
      await invitationService.sendInvitationWhatsappToGuest(
        eventId,
        guestDetails.value.id,
      );

    await refreshGuest({ force: true });

    const normalizedStatus = res.status?.toLowerCase();

    if (normalizedStatus === 'invalid_phone') {
      toast.info(res.reason || 'O convidado não possui um número válido.');
      return;
    }

    if (normalizedStatus === 'accepted') {
      toast.success(
        'Convite enviado via WhatsApp com sucesso. A mensagem foi aceite pela plataforma e aguarda confirmação final.',
      );
      return;
    }

    if (normalizedStatus === 'failed') {
      toast.error(res.reason || 'Erro ao enviar o convite via WhatsApp.');
      return;
    }

    if (res.note) {
      toast.info(res.note);
      return;
    }

    toast.success('Envio do convite via WhatsApp iniciado com sucesso.');
  } catch (err) {
    console.error(err);
    toast.error(t('guests.error_send_invitation_whatsapp'));
  } finally {
    isSendingInvitationWhatsApp.value = false;
  }
};

const hasPreviousQRCodeWhatsAppSend = computed(() => {
  const status = guestDetails.value?.whatsAppQrStatus?.toLowerCase();

  return Boolean(
    guestDetails.value?.whatsAppQrAcceptedAt ||
      guestDetails.value?.whatsAppQrDeliveredAt ||
      guestDetails.value?.whatsAppQrSeenAt ||
      guestDetails.value?.whatsAppQrSentAt ||
      (status &&
        [
          'accepted',
          'delivered',
          'seen',
          'delivery_unknown',
          'failed_temporary',
          'failed',
          'needs_review',
        ].includes(status)),
  );
});

const hasPreviousInvitationWhatsAppSend = computed(() => {
  const outbound = invitationOutbound.value;

  if (!outbound) return false;

  return Boolean(
    outbound.acceptedAt ||
      outbound.deliveredAt ||
      outbound.seenAt ||
      outbound.sentAt ||
      [
        'accepted',
        'delivered',
        'seen',
        'delivery_unknown',
        'failed_temporary',
        'failed',
        'needs_review',
      ].includes(outbound.status),
  );
});

onMounted(() => {
  const componentName = siteConfig.qrCodeComponent;

  if (componentName) {
    try {
      InvitationComponent.value = defineAsyncComponent(
        () =>
          import(`@/components/modules/dashboard/qrcodes/${componentName}.vue`),
      );
    } catch (err) {
      console.error('Erro ao carregar componente:', err);
    }
  }
});
</script>

<template>
  <BaseCard
    :title="guestDetails.name"
    :description="t('guests.view_description')"
    back-link="/admin/convidados"
  >
    <div
      class="flex w-full animate-fadeIn flex-col px-3 md:flex-row md:justify-between"
    >
      <div class="md:w-1/2">
        <div
          class="mb-3 flex flex-col justify-between md:items-center lg:flex-row"
        >
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap gap-2">
              <BaseButton
                v-if="eventStore.eventQRCodeUrl"
                btn-type="outline-primary"
                btn-size="sm"
                icon="download"
                :icon-size="16"
                :disabled="isExporting"
                class="animate-fadeIn"
                @click="showExportFormatModal = true"
              >
                {{
                  isExporting
                    ? t('guests.generating_qr')
                    : t('guests.generate_qr')
                }}
              </BaseButton>

              <BaseButton
                v-if="eventStore.eventQRCodeUrl"
                btn-type="outline-primary"
                btn-size="sm"
                icon="whatsapp"
                :icon-size="16"
                :disabled="isSendingQRCodeWhatsApp"
                class="animate-fadeIn"
                @click="showWhatsAppColorModal = true"
              >
                {{
                  isSendingQRCodeWhatsApp
                    ? t('guests.sending_qr_whatsapp')
                    : t('guests.send_qr_whatsapp')
                }}
              </BaseButton>
            </div>
            <div class="flex flex-wrap gap-2">
              <BaseButton
                v-if="canExportInvitation"
                btn-type="outline-primary"
                btn-size="sm"
                icon="download"
                :icon-size="16"
                :disabled="isGeneratingInvitation"
                @click="generateInvitationPng"
              >
                {{
                  isGeneratingInvitation
                    ? t('guests.generating_invitation')
                    : t('guests.generate_invitation')
                }}
              </BaseButton>
              <BaseButton
                v-if="canExportInvitation"
                btn-type="outline-primary"
                btn-size="sm"
                icon="whatsapp"
                :icon-size="16"
                :disabled="isSendingInvitationWhatsApp"
                @click="onSendInvitationWhatsapp"
              >
                {{
                  isSendingInvitationWhatsApp
                    ? t('guests.sending_invitation_whatsapp')
                    : t('guests.send_invitation_whatsapp')
                }}
              </BaseButton>
            </div>
          </div>
        </div>

        <BaseDescriptionList>
          <BaseDescriptionListItem
            :title="t('guests.detail_name')"
            :description="guest.name"
          />

          <BaseDescriptionListItem
            :title="t('guests.detail_people_count')"
            :description="
              guest.people_Count === 1
                ? t('guests.detail_people_one')
                : t('guests.detail_people_other', { n: guest.people_Count })
            "
          />

          <BaseDescriptionListItem
            :title="t('guests.detail_phone')"
            :description="guest.phone"
          />

          <BaseDescriptionListItem
            :title="t('guests.detail_category')"
            :description="guest.categoryName"
          />

          <BaseDescriptionListItem
            :title="t('guests.detail_presence_confirmed')"
            hide-descriptipn
          >
            <p
              class="text-sm font-bold"
              :class="props.guest?.presence_Confirmed ? 'text-green-700' : ''"
            >
              {{ guest?.presence_Confirmed ? t('common.yes') : t('common.no') }}
            </p>
          </BaseDescriptionListItem>

          <BaseDescriptionListItem
            v-if="guest.presence_Confirmed && guest.people_Confirmed"
            :title="t('guests.detail_people_confirmed')"
            :description="`${guest.people_Confirmed} ${guest.people_Confirmed === 1 ? t('guests.detail_people_one') : t('guests.detail_people_other', { n: guest.people_Confirmed })}`"
          />

          <BaseDescriptionListItem
            v-if="guest.additional_Comments"
            :title="t('guests.detail_comments')"
            :description="guest.additional_Comments"
          />

          <BaseDescriptionListItem :title="t('guests.detail_whatsapp_qr')">
            <GuestsWhatsAppStatusChip
              :status="guestDetails.whatsAppQrStatus"
              :label="guestDetails.whatsAppQrStatusLabel"
            />
          </BaseDescriptionListItem>

          <BaseDescriptionListItem
            v-if="guestDetails.whatsAppQrAcceptedAt"
            title="WhatsApp - QR Code aceite em"
            :description="formatDateWithTime(guestDetails.whatsAppQrAcceptedAt)"
          />

          <BaseDescriptionListItem
            v-if="guestDetails.whatsAppQrDeliveredAt"
            title="WhatsApp - QR Code entregue em"
            :description="
              formatDateWithTime(guestDetails.whatsAppQrDeliveredAt)
            "
          />

          <BaseDescriptionListItem
            v-if="guestDetails.whatsAppQrSeenAt"
            title="WhatsApp - QR Code visualizado em"
            :description="formatDateWithTime(guestDetails.whatsAppQrSeenAt)"
          />

          <BaseDescriptionListItem
            v-if="guestDetails.whatsAppQrErrorMessage"
            title="WhatsApp - Detalhe do QR Code"
            :description="guestDetails.whatsAppQrErrorMessage"
          />

          <BaseDescriptionListItem
            v-else-if="guestDetails.whatsAppQrSkipReason"
            title="WhatsApp - Detalhe do QR Code"
            :description="guestDetails.whatsAppQrSkipReason"
          />

          <template v-for="item in visibleOutbounds" :key="item.type">
            <BaseDescriptionListItem
              :title="`WhatsApp - ${getOutboundTypeLabel(item.type)}`"
            >
              <GuestsWhatsAppStatusChip
                :status="item.status"
                :label="item.statusLabel"
              />
            </BaseDescriptionListItem>

            <BaseDescriptionListItem
              v-if="item.acceptedAt"
              :title="`WhatsApp - ${getOutboundTypeLabel(item.type)} aceite em`"
              :description="formatDateWithTime(item.acceptedAt)"
            />

            <BaseDescriptionListItem
              v-if="item.deliveredAt"
              :title="`WhatsApp - ${getOutboundTypeLabel(item.type)} entregue em`"
              :description="formatDateWithTime(item.deliveredAt)"
            />

            <BaseDescriptionListItem
              v-if="item.seenAt"
              :title="`WhatsApp - ${getOutboundTypeLabel(item.type)} visualizado em`"
              :description="formatDateWithTime(item.seenAt)"
            />

            <BaseDescriptionListItem
              v-if="item.errorMessage"
              :title="`WhatsApp - Detalhe do ${getOutboundTypeLabel(item.type)}`"
              :description="item.errorMessage"
            />

            <BaseDescriptionListItem
              v-else-if="item.skipReason"
              :title="`WhatsApp - Detalhe do ${getOutboundTypeLabel(item.type)}`"
              :description="item.skipReason"
            />
          </template>
        </BaseDescriptionList>

        <div class="my-4 flex flex-wrap items-center space-x-2">
          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            icon="pencil"
            @click="showFormModal = true"
          >
            {{ t('guests.view_edit') }}
          </BaseButton>

          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            class="flex items-center space-x-1"
            icon="cancel"
            @click="showRemoveModal = true"
          >
            {{ t('guests.view_remove') }}
          </BaseButton>
        </div>
      </div>

      <LazyDesksTableView
        v-if="desk"
        :desk-name="desk.name"
        :guests="desk.guests"
        :people-count="guestsPeopleCount"
      />
    </div>

    <div
      v-if="eventStore.eventQRCodeUrl"
      class="pointer-events-none fixed left-[-9999px] top-[-9999px] opacity-0"
    >
      <component
        :is="InvitationComponent"
        ref="qrCodeRef"
        :guest="guest"
        :color="textColorExport"
      />
    </div>

    <LazyGuestsFormModal
      :show="showFormModal"
      :guest="guest"
      @close-modal="showFormModal = false"
      @success="refreshDetails"
    />

    <LazyGuestsRemoveModal
      :show="showRemoveModal"
      :guest="guest"
      @close-modal="showRemoveModal = false"
      @success="$router.push('/admin/convidados')"
    />

    <LazyGuestsQRCodeColorModal
      :show="showExportFormatModal"
      mode="export"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />

    <LazyGuestsQRCodeColorModal
      :show="showWhatsAppColorModal"
      mode="whatsapp"
      @close-modal="showWhatsAppColorModal = false"
      @export="onConfirmWhatsAppColor"
    />

    <LazyGuestsWhatsAppResendQRCodeModal
      :show="showWhatsAppResendQRCodeModal"
      :loading="isSendingQRCodeWhatsApp"
      :status-label="guestDetails?.whatsAppQrStatusLabel"
      @close-modal="showWhatsAppResendQRCodeModal = false"
      @confirm="confirmWhatsAppQrResend"
    />

    <LazyGuestsWhatsAppResendInvitationModal
      :show="showInvitationWhatsAppResendModal"
      :loading="isSendingInvitationWhatsApp"
      :status-label="invitationOutbound?.statusLabel"
      @close-modal="showInvitationWhatsAppResendModal = false"
      @confirm="confirmInvitationWhatsAppResend"
    />
  </BaseCard>
</template>
