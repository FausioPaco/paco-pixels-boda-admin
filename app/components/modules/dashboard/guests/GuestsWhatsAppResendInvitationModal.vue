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

const { t } = useI18n();
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('guests.wa_resend_inv_title')"
    @close-modal="emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn space-y-4">
      <p class="text-grey-700 text-left text-base md:text-lg">
        {{ t('guests.wa_resend_inv_desc') }}
      </p>

      <p
        v-if="statusLabel"
        class="text-grey-500 text-left text-sm md:text-base"
      >
        {{ t('guests.wa_resend_inv_status_label') }} <b>{{ statusLabel }}</b>
      </p>

      <p class="text-grey-500 text-left text-sm md:text-base">
        {{ t('guests.wa_resend_inv_warning') }}
      </p>

      <div class="my-4 flex items-center justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="primary"
          class="my-1"
          size="md"
          :loading="loading"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ t('guests.wa_resend_inv_confirm') }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          @click="emit('closeModal')"
        >
          {{ t('common.cancel') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
