<script setup lang="ts">
interface Props {
  show?: boolean;
  exportTotal?: number | undefined;
  exportProcessed?: number | undefined;
  exportPercent?: number | undefined;
  title?: string | undefined | null;
}

withDefaults(defineProps<Props>(), {
  show: false,
  exportTotal: undefined,
  exportProcessed: undefined,
  exportPercent: undefined,
  title: undefined,
});

const emit = defineEmits(['closeModal', 'success']);
const { t } = useI18n();
</script>
<template>
  <BaseModal
    :show="show"
    :title="title ?? t('guests.export_status_title_fallback')"
    @close-modal="emit('closeModal')"
  >
    <div class="space-y-3">
      <p class="text-grey-700 text-sm">
        {{ t('guests.export_status_processing') }}
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

      <p class="text-grey-500 text-xs">
        {{ t('guests.export_status_slow') }}
      </p>

      <div class="flex justify-end">
        <BaseButton
          btn-type="outline-primary"
          btn-size="sm"
          @click="emit('closeModal')"
        >
          {{ t('guests.export_status_continue') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
