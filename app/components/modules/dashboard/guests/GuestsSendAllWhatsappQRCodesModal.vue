<script setup lang="ts">
import type { ExportTextColor } from '~~/shared/types/guest';

interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), { show: false });

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (
    e: 'send',
    payload: { color: ExportTextColor; force: boolean; reason?: string },
  ): void;
}>();

const colorInput = ref<ExportTextColor>('black');
const forceInput = ref(false);
const reasonInput = ref('');

const isSubmitting = ref(false);
const { t } = useI18n();

const textColorList = computed<SelectOption[]>(() => [
  { id: 'black', name: t('guests.qrcode_color_black') },
  { id: 'white', name: t('guests.qrcode_color_white') },
]);

const canSubmit = computed(() => {
  if (!forceInput.value) return true;
  return !!reasonInput.value?.trim();
});

const onSubmit = () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;

  emit('send', {
    color: colorInput.value,
    force: forceInput.value,
    reason: forceInput.value ? reasonInput.value.trim() : undefined,
  });

  setTimeout(() => {
    isSubmitting.value = false;
    resetForm();
  }, 200);
};

const resetForm = () => {
  colorInput.value = 'black';
  forceInput.value = false;
  reasonInput.value = '';
};

const closeModal = () => {
  resetForm();
  emit('closeModal');
};

const { eventId } = useEventStore();
const { clientCode } = useRuntimeConfig().public;
const { event, refreshEvent } = await useEvent(eventId!);

const { isPartner, canSend, blockingIssues, warnings } =
  useWhatsAppQrPrerequisites(event, clientCode);

onMounted(() => {
  refreshEvent({ force: true });
});
</script>

<template>
  <BaseModal
    :title="t('guests.send_all_qr_title')"
    :show="show"
    @close-modal="closeModal"
  >
    <LazyGuestsWhatsAppQrPrerequisitesAlert
      v-if="!canSend"
      :is-partner="isPartner"
      :blocking-issues="blockingIssues"
      :warnings="warnings"
    />

    <div class="my-2 animate-fadeIn">
      <form class="space-y-3" @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          {{ t('guests.send_all_qr_desc') }}
        </p>

        <BaseSelect
          id="whatsAppQrTextColor"
          v-model="colorInput"
          :label="t('guests.send_all_qr_color_label')"
          :options="textColorList"
          disable-empty
        />

        <div class="bg-grey-50 rounded-lg p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-grey-800 text-sm font-semibold">
                {{ t('guests.send_all_qr_force_title') }}
              </p>
              <p class="text-grey-500 text-xs">
                {{ t('guests.send_all_qr_force_desc') }}
              </p>
            </div>

            <BaseToggle
              id="forceInput"
              v-model="forceInput"
              size="md"
              reverse
            />
          </div>

          <div v-if="forceInput" class="mt-3">
            <BaseInput
              id="reasonInput"
              v-model="reasonInput"
              :label="t('guests.send_all_qr_reason_label')"
              :placeholder="t('guests.send_all_qr_reason_placeholder')"
            />
          </div>
        </div>

        <p class="text-grey-500 text-xs">
          {{ t('guests.send_all_qr_note') }}
        </p>

        <div class="my-4 flex items-center justify-center space-x-3">
          <BaseButton
            type="submit"
            btn-type="primary"
            class="my-1"
            size="md"
            :loading="isSubmitting"
            :disabled="isSubmitting || !canSubmit || !canSend"
          >
            {{ t('guests.send_all_qr_submit') }}
          </BaseButton>

          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="my-1"
            size="md"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </BaseButton>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
