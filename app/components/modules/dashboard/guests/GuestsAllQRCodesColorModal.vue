<script setup lang="ts">
import type { ExportTextColor } from '~~/shared/types/guest';

interface IGuestInvitationModalProps {
  show?: boolean;
  mode?: 'export' | 'whatsapp';
}

withDefaults(defineProps<IGuestInvitationModalProps>(), {
  show: false,
  mode: 'export',
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'export', format: ExportQROptions): void;
}>();

const formatInput = ref<ExportFormat>('png');
const colorInput = ref<ExportTextColor>('black');

const isSubmiting = ref<boolean>(false);
const { t } = useI18n();
const formatList = computed<SelectOption[]>(() => [
  //{ id: 'pdf', name: 'Formato PDF' },
  { id: 'png', name: t('guests.qrcode_format_png') },
]);

const textColorList = computed<SelectOption[]>(() => [
  { id: 'black', name: t('guests.qrcode_color_black') },
  { id: 'white', name: t('guests.qrcode_color_white') },
]);

const onSubmit = () => {
  isSubmiting.value = true;
  emit('export', {
    color: colorInput.value,
    format: formatInput.value,
  });

  setTimeout(() => {
    isSubmiting.value = false;
  }, 200);
};
</script>
<template>
  <BaseModal
    :title="
      mode === 'export'
        ? t('guests.qrcode_all_export_title')
        : t('guests.qrcode_all_whatsapp_title')
    "
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn">
      <form @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          {{
            mode === 'export'
              ? t('guests.qrcode_all_export_desc')
              : t('guests.qrcode_all_whatsapp_desc')
          }}
        </p>

        <BaseSelect
          id="formatQRCodeExport"
          v-model="formatInput"
          :label="t('guests.qrcode_format_label')"
          :options="formatList"
          disable-empty
        />

        <BaseSelect
          id="colorQRCodeExport"
          v-model="colorInput"
          :label="t('guests.qrcode_color_label')"
          :options="textColorList"
          disable-empty
        />

        <div
          class="my-4 flex animate-fadeIn items-center justify-center space-x-3"
        >
          <BaseButton
            type="submit"
            btn-type="primary"
            class="my-1"
            size="md"
            :loading="isSubmiting"
            :disabled="isSubmiting"
            >{{
              mode === 'export'
                ? t('guests.qrcode_all_download')
                : t('guests.qrcode_all_send')
            }}</BaseButton
          >

          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="my-1"
            size="md"
            @click="$emit('closeModal')"
            >{{ t('common.cancel') }}</BaseButton
          >
        </div>
      </form>
    </div>
  </BaseModal>
</template>
