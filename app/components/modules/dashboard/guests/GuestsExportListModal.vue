<script setup lang="ts">
import type { ExportListFormat } from '~~/shared/types/guest';

interface IGuestExportListModalProps {
  show?: boolean;
}

withDefaults(defineProps<IGuestExportListModalProps>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'export', format: ExportListFormat): void;
}>();

const formatInput = ref<ExportListFormat>('excel');
const isSubmiting = ref<boolean>(false);
const { t } = useI18n();

const formatList = ref<SelectOption[]>([
  { id: 'excel', name: 'Excel' },
  { id: 'pdf', name: 'PDF' },
]);

const onSubmit = () => {
  isSubmiting.value = true;
  emit('export', formatInput.value);

  setTimeout(() => {
    isSubmiting.value = false;
  }, 200);
};
</script>
<template>
  <BaseModal
    :title="t('guests.export_list_title')"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn">
      <form @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          {{ t('guests.export_list_desc') }}
        </p>

        <BaseSelect
          id="formatExportGuest"
          v-model="formatInput"
          :label="t('guests.export_list_format_label')"
          :options="formatList"
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
            >{{ t('guests.export_list_download') }}</BaseButton
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
