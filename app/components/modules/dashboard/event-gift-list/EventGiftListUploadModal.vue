<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getEventGiftListService } from '~/services/eventGiftListService';
import { isFetchErrorLike } from '~/utils/serverUtils';

interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), { show: false });
const emit = defineEmits(['closeModal', 'success']);

const toast = useToast();
const { t } = useI18n();
const { eventId } = useEventStore();

const nuxtApp = useNuxtApp();
const service = getEventGiftListService(nuxtApp.$api);

const fileInputRef = ref<HTMLInputElement | null>(null);

const isSubmiting = ref(false);
const localFile = ref<File | null>(null);

const previewUrl = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const hasFile = computed(() => !!localFile.value);
const isPdf = computed(() => localFile.value?.type === 'application/pdf');
const isImage = computed(() => !!localFile.value?.type?.startsWith('image/'));

const openFileDialog = () => fileInputRef.value?.click();

const resetState = () => {
  localFile.value = null;
  errorMessage.value = null;
  serverErrors.value = { hasErrors: false, message: '' };

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }

  if (fileInputRef.value) fileInputRef.value.value = '';
};

const closeModal = () => {
  resetState();
  emit('closeModal');
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  errorMessage.value = null;
  serverErrors.value = { hasErrors: false, message: '' };

  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    errorMessage.value = t('event_gift_list.file_too_large');
    target.value = '';
    return;
  }

  const pdf = file.type === 'application/pdf';
  const image = file.type?.startsWith('image/');
  if (!pdf && !image) {
    errorMessage.value = t('event_gift_list.file_type_error');
    target.value = '';
    return;
  }

  localFile.value = file;

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = image ? URL.createObjectURL(file) : null;
};

const onSubmit = async () => {
  if (!eventId) {
    serverErrors.value = {
      hasErrors: true,
      message: t('event_gift_list.event_not_found'),
    };
    return;
  }

  if (!localFile.value) {
    serverErrors.value = {
      hasErrors: true,
      message: t('event_gift_list.file_required'),
    };
    return;
  }

  try {
    isSubmiting.value = true;
    serverErrors.value = { hasErrors: false, message: '' };

    await service.uploadGiftListFile(eventId, localFile.value);

    toast.success(t('event_gift_list.upload_success'));
    emit('success');
    resetState();
  } catch (err: unknown) {
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = t('event_gift_list.upload_error');
    }
    serverErrors.value.hasErrors = true;
  } finally {
    isSubmiting.value = false;
  }
};
</script>

<template>
  <BaseModal
    :title="t('event_gift_list.upload_modal_title')"
    :show="show"
    @close-modal="closeModal"
  >
    <div class="p-4">
      <div class="flex flex-col gap-4">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div
              class="bg-primary-50 text-primary-700 flex size-[70px] items-center justify-center rounded-full"
            >
              <IconUpload :font-controlled="false" class="block size-[34px]" />
            </div>

            <div>
              <p
                class="text-primary-500 text-sm font-medium uppercase tracking-[0.16em]"
              >
                {{ t('event_gift_list.document_title') }}
              </p>
              <h2 class="text-grey-900 mt-1 text-xl font-semibold">
                {{
                  hasFile
                    ? t('event_gift_list.file_selected')
                    : t('event_gift_list.upload_file_title')
                }}
              </h2>
            </div>
          </div>

          <p class="text-grey-600 text-sm leading-relaxed">
            {{ t('event_gift_list.upload_help_before') }}
            <b>PDF</b>
            {{ t('event_gift_list.upload_help_or') }}
            <b>{{ t('event_gift_list.image') }}</b>
            {{ t('event_gift_list.upload_help_after') }}
          </p>

          <button
            type="button"
            class="hover:border-primary-200 hover:bg-primary-50 group flex w-full items-center justify-center overflow-hidden rounded-3xl p-2 transition"
            :class="
              hasFile
                ? 'bg-primary-50'
                : 'border-grey-200 bg-grey-50 border-2 border-dashed'
            "
            :disabled="isSubmiting"
            @click="openFileDialog"
          >
            <img
              v-if="previewUrl && isImage"
              :src="previewUrl"
              :alt="t('event_gift_list.preview_alt')"
              class="h-full w-full rounded-2xl object-cover md:h-[360px] md:w-[420px]"
            />

            <div
              v-else-if="hasFile && isPdf"
              class="bg-primary-50 flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl py-10 md:h-[260px] md:w-[320px]"
            >
              <IconUpload
                :font-controlled="false"
                class="text-primary-700 block size-[48px]"
              />
              <p class="text-primary-800 text-base font-semibold">
                {{ t('event_gift_list.pdf_selected') }}
              </p>
              <p
                class="text-grey-500 max-w-[320px] break-words text-center text-xs"
              >
                {{ localFile?.name }}
              </p>
            </div>

            <div
              v-else
              class="text-grey-400 flex h-full w-full flex-col items-center justify-center gap-3 py-10"
            >
              <IconMenuGallery
                :font-controlled="false"
                class="text-grey-300 group-hover:text-primary-700 block size-[70px]"
              />
              <p
                class="text-grey-400 group-hover:text-primary-700 text-lg font-semibold"
              >
                {{ t('event_gift_list.click_to_select') }}
              </p>
              <p
                class="text-grey-400 group-hover:text-primary-700 text-xs font-medium"
              >
                {{ t('event_gift_list.file_requirements') }}
              </p>
            </div>
          </button>

          <div v-if="hasFile" class="flex w-full animate-fadeIn justify-center">
            <BaseButton
              btn-type="outline-primary"
              :disabled="isSubmiting"
              @click="openFileDialog"
            >
              {{ t('event_gift_list.change_file') }}
            </BaseButton>
          </div>

          <p class="text-grey-500 text-xs">
            {{ t('event_gift_list.allowed_formats') }}
            <b class="text-primary-800">{{
              t('event_gift_list.allowed_formats_value')
            }}</b>
          </p>
          <p class="text-xs">
            {{ t('event_gift_list.max_size') }}
            <b class="text-primary-800">25MB</b>
          </p>

          <BaseError v-if="serverErrors.hasErrors" class="mt-3">
            {{ serverErrors.message }}
          </BaseError>

          <BaseError v-if="errorMessage" class="mt-3">
            {{ errorMessage }}
          </BaseError>

          <input
            ref="fileInputRef"
            type="file"
            accept="application/pdf,image/*"
            class="hidden"
            @change="onFileSelected"
          />
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <BaseButton
            btn-type="outline-primary"
            :disabled="isSubmiting"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </BaseButton>

          <BaseButton
            btn-type="primary"
            :disabled="!hasFile || isSubmiting"
            @click="onSubmit"
          >
            {{
              isSubmiting
                ? t('event_gift_list.uploading')
                : t('event_gift_list.upload_now')
            }}
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
