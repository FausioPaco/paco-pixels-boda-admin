<script setup lang="ts">
interface Props {
  show?: boolean;
  loading?: boolean;
  statusLabel?: string | null;
}

withDefaults(defineProps<Props>(), {
  show: false,
  loading: false,
  statusLabel: null,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'confirm'): void;
}>();

const { eventId } = useEventStore();
const { clientCode } = useRuntimeConfig().public;
const { event, refreshEvent } = await useEvent(eventId!);

const { isPartner, canSend, blockingIssues, warnings } =
  useWhatsAppQrPrerequisites(event, clientCode);

onMounted(() => {
  refreshEvent({ force: true });
});

const { t } = useI18n();
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('guests.wa_resend_qr_title')"
    @close-modal="emit('closeModal')"
  >
    <LazyGuestsWhatsAppQrPrerequisitesAlert
      v-if="!canSend"
      :is-partner="isPartner"
      :blocking-issues="blockingIssues"
      :warnings="warnings"
    />

    <div class="my-2 animate-fadeIn space-y-4">
      <p class="text-grey-700 text-left text-base md:text-lg">
        {{ t('guests.wa_resend_qr_desc') }}
      </p>

      <p
        v-if="statusLabel"
        class="text-grey-500 text-left text-sm md:text-base"
      >
        {{ t('guests.wa_resend_qr_status_label') }} <b>{{ statusLabel }}</b>
      </p>

      <p class="text-grey-500 text-left text-sm md:text-base">
        {{ t('guests.wa_resend_qr_warning') }}
      </p>

      <div class="my-4 flex animate-fadeIn items-center justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="primary"
          class="my-1"
          size="md"
          :loading="loading"
          :disabled="loading || !canSend"
          @click="emit('confirm')"
        >
          {{ t('guests.wa_resend_qr_confirm') }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="loading"
          @click="emit('closeModal')"
        >
          {{ t('common.cancel') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
