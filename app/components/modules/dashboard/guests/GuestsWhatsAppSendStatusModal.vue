<script setup lang="ts">
interface Props {
  show?: boolean;
  exportTotal?: number;
  exportProcessed?: number;
  exportPercent?: number;
  summary?: WhatsAppDeliverySummary | null;
  messageType?: GuestWhatsAppOutboundType;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  exportTotal: 0,
  exportProcessed: 0,
  exportPercent: 0,
  summary: null,
  messageType: GuestWhatsAppOutboundType.QrCode,
});

const emit = defineEmits(['closeModal']);
const { t } = useI18n();

const messageLabel = computed(() => {
  return props.messageType === GuestWhatsAppOutboundType.Invitation
    ? t('guests.send_status_inv_label')
    : t('guests.send_status_qr_label');
});

const progressTitle = computed(() => {
  return props.messageType === GuestWhatsAppOutboundType.Invitation
    ? t('guests.send_status_inv_progress_title')
    : t('guests.send_status_qr_progress_title');
});

const finishButtonLabel = computed(() =>
  props.summary
    ? t('guests.send_status_close')
    : t('guests.send_status_continue'),
);
</script>

<template>
  <BaseModal
    :show="show"
    :title="progressTitle"
    @close-modal="emit('closeModal')"
  >
    <div class="space-y-3">
      <p class="text-grey-700 text-sm">
        {{ t('guests.send_status_processed') }}
        <b class="text-success-500">{{ exportProcessed }}</b> /
        {{ exportTotal }}
        <span class="text-grey-400 font-semibold">({{ exportPercent }}%)</span>
      </p>

      <div class="bg-grey-50 h-2 w-full overflow-hidden rounded-full">
        <div
          class="bg-success-500 h-2"
          :style="{ width: `${exportPercent}%` }"
        ></div>
      </div>

      <div v-if="summary" class="bg-grey-50 rounded-lg p-3">
        <p class="text-grey-700 mb-2 text-xs font-semibold">
          {{ t('guests.send_status_summary_title') }}
        </p>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <p class="text-grey-700">{{ t('guests.send_status_pending') }}</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.pending }}
          </p>

          <p class="text-grey-700">{{ t('guests.send_status_accepted') }}</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.accepted }}
          </p>

          <p class="text-grey-700">{{ t('guests.send_status_delivered') }}</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.delivered }}
          </p>

          <p class="text-grey-700">{{ t('guests.send_status_seen') }}</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.seen }}
          </p>

          <p class="text-grey-700">
            {{ t('guests.send_status_skipped_invalid_phone') }}
          </p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.skippedInvalidPhone }}
          </p>

          <p class="text-grey-700">
            {{ t('guests.send_status_skipped_delivered') }}
          </p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.skippedAlreadyDelivered }}
          </p>

          <p class="text-grey-700">
            {{ t('guests.send_status_failed_temporary') }}
          </p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.failedTemporary }}
          </p>

          <p class="text-grey-700">
            {{ t('guests.send_status_failed_permanent') }}
          </p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.failedPermanent }}
          </p>

          <p class="text-grey-700">
            {{ t('guests.send_status_delivery_unknown') }}
          </p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.deliveryUnknown }}
          </p>

          <p class="text-grey-700">
            {{ t('guests.send_status_needs_review') }}
          </p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.needsReview }}
          </p>
        </div>
      </div>

      <p class="text-grey-500 text-xs">
        {{ t('guests.send_status_note', { label: messageLabel }) }}
      </p>

      <div class="flex justify-end">
        <BaseButton
          btn-type="outline-primary"
          btn-size="sm"
          @click="emit('closeModal')"
        >
          {{ finishButtonLabel }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
