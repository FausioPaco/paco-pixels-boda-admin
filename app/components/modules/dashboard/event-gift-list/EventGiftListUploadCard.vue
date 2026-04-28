<script setup lang="ts">
const props = defineProps<{ giftList: EventGiftList }>();
const { t } = useI18n();
const { apiImageUrl } = useRuntimeConfig().public;

defineEmits(['upload']);

const fileUrl = computed(() => props.giftList?.file?.fileUrl ?? null);
const fileName = computed(() => props.giftList?.file?.originalFileName ?? null);

const mimeType = computed(() => {
  if (!props.giftList?.file) return null;
  return props.giftList.file.mimeType === 'application/pdf'
    ? 'PDF'
    : t('event_gift_list.image');
});

const downloadFile = () => {
  if (!fileUrl.value) return;

  const a = document.createElement('a');
  a.href = fileUrl.value;
  a.download = fileName.value ?? t('event_gift_list.download_filename');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const openFileInNewTab = () => {
  if (!fileUrl.value) return;
  window.open(
    `${apiImageUrl}${fileUrl.value}`,
    '_blank',
    'noopener,noreferrer',
  );
};

const showFileUploadAlert = ref(true);

const isImage = computed(
  () =>
    props.giftList.mode === 'upload' &&
    props.giftList.file?.mimeType?.startsWith('image/'),
);

const isPdf = computed(
  () =>
    props.giftList.mode === 'upload' &&
    props.giftList.file?.mimeType === 'application/pdf',
);
</script>

<template>
  <div class="w-full rounded-2xl border bg-white p-5">
    <div
      class="flex flex-col flex-wrap gap-3 md:flex-row md:items-start md:justify-between"
    >
      <div class="space-y-1">
        <h3 class="text-primary-700 text-xl font-bold">
          {{ t('event_gift_list.upload_card_title') }}
        </h3>
        <p class="text-grey-400 max-w-[760px] text-sm">
          {{ t('event_gift_list.upload_card_description') }}
        </p>
      </div>

      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        icon="upload"
        class="sm:mt-1"
        @click="$emit('upload')"
      >
        {{
          fileUrl
            ? t('event_gift_list.replace_file')
            : t('event_gift_list.upload_now')
        }}
      </BaseButton>
    </div>

    <div class="mt-5">
      <div v-if="fileUrl" class="rounded-2xl border bg-white p-4">
        <div
          class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
        >
          <div class="flex items-start gap-3">
            <div
              class="bg-primary-50 text-primary-700 flex size-11 items-center justify-center rounded-xl"
            >
              <component
                :is="
                  isPdf
                    ? 'icon-document'
                    : isImage
                      ? 'icon-menu-gallery'
                      : 'icon-document'
                "
                :font-controlled="false"
                class="size-6"
              />
            </div>

            <div class="min-w-0">
              <p class="text-grey-900 truncate text-sm font-semibold">
                {{ fileName ?? t('event_gift_list.default_file_name') }}
              </p>
              <p class="text-grey-400 mt-0.5 text-xs">
                {{ mimeType ?? t('event_gift_list.unknown_format') }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 md:justify-end">
            <BaseButton
              btn-type="primary"
              btn-size="sm"
              icon="download"
              :icon-size="16"
              :disabled="!fileUrl"
              @click="downloadFile"
            >
              {{ t('event_gift_list.download') }}
            </BaseButton>

            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              icon="external-link"
              :icon-size="16"
              :disabled="!fileUrl"
              @click="openFileInNewTab"
            >
              {{ t('event_gift_list.open') }}
            </BaseButton>
          </div>
        </div>
      </div>

      <BaseAlert
        v-else
        :show="showFileUploadAlert"
        :title="t('event_gift_list.no_file_title')"
        :message="t('event_gift_list.no_file_message')"
        type="informative"
        @close="showFileUploadAlert = !showFileUploadAlert"
      />
    </div>
  </div>
</template>
