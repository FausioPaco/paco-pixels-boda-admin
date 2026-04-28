<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getEventService } from '~/services/eventService';

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);
const eventStore = useEventStore();
const { apiImageUrl } = useRuntimeConfig().public;

/**
 * Estado local
 */

function getImageUrl(): string | null {
  if (!eventStore.eventQRCodeUrl) return null;

  return `${apiImageUrl}${eventStore.eventQRCodeUrl}`;
}

const fileInputRef = ref<HTMLInputElement | null>(null);

const imageUrl = ref<string | null>(getImageUrl());

const previewUrl = ref<string | null>(null);
const fileToUpload = ref<File | null>(null);

const isUploading = ref(false);
const errorMessage = ref<string | null>(null);

/**
 * Mantém o componente sincronizado com a store
 * (caso o evento mude enquanto estamos nesta página)
 */
watch(
  () => eventStore.eventQRCodeUrl,
  (val) => {
    // se não houver preview local, usamos o valor vindo da store
    if (!previewUrl.value) {
      imageUrl.value = `${apiImageUrl}${val}`;
    }
  },
);

/**
 * Computed para saber se já existe alguma imagem associada
 */
const hasImage = computed(() => !!imageUrl.value || !!previewUrl.value);

/**
 * Abre o diálogo de selecção de ficheiro
 */
const openFileDialog = () => {
  fileInputRef.value?.click();
};

/**
 * Valida o ficheiro e gera a pré-visualização
 */
const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  errorMessage.value = null;

  const maxSizeBytes = 20 * 1024 * 1024; // 20MB
  if (!file.type.startsWith('image/')) {
    errorMessage.value = t('guests.qr_invalid_file');
    target.value = '';
    return;
  }

  if (file.size > maxSizeBytes) {
    errorMessage.value = t('guests.qr_too_large');
    target.value = '';
    return;
  }

  fileToUpload.value = file;

  // limpa URL de preview anterior se existir
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = URL.createObjectURL(file);
};

/**
 * Faz o upload da imagem para o backend
 * e actualiza imediatamente a store do evento
 */
const toast = useToast();
const { t } = useI18n();
const uploadImage = async () => {
  if (!fileToUpload.value) return;

  isUploading.value = true;
  errorMessage.value = null;

  try {
    const eventId = eventStore.ensureSelected(); // lança erro se não houver evento

    const result = await eventService.uploadQRImage({
      file: fileToUpload.value,
      eventId,
    });

    // o serviço devolve uma string com a URL
    const url = `${apiImageUrl}${result.url}`;

    // actualiza visualmente
    imageUrl.value = url;

    // limpa preview e ficheiro local
    fileToUpload.value = null;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }

    // sincroniza com a store (mantendo os restantes campos)
    if (eventStore.selected) {
      eventStore.selectEvent({
        ...eventStore.selected,
        qrCodeImage_Url: result.url,
      });
    }

    toast.success(t('guests.qr_upload_success'));
  } catch (err) {
    console.log(err);
    errorMessage.value = t('guests.qr_upload_error');
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <section>
    <div
      class="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6"
    >
      <!-- Lado esquerdo: textos + botões -->
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-[80px] items-center justify-center rounded-full bg-primary-50 text-primary-700"
          >
            <IconUpload :font-controlled="false" class="block size-[40px]" />
          </div>

          <div>
            <p
              class="text-sm font-medium uppercase tracking-[0.16em] text-primary-500"
            >
              {{ t('guests.wa_type_qrcode') }}
            </p>
            <h2 class="mt-1 text-xl font-semibold text-grey-900 md:text-2xl">
              {{
                hasImage
                  ? t('guests.qr_image_loaded')
                  : t('guests.qr_image_upload_title')
              }}
            </h2>
          </div>
        </div>

        <p class="max-w-xl text-sm leading-relaxed text-grey-600 md:text-base">
          <span v-if="!hasImage">
            {{ t('guests.qr_no_image_desc') }}
          </span>
          <span v-else>
            {{ t('guests.qr_has_image_desc') }}
          </span>
        </p>

        <p class="text-xs text-grey-500">
          {{ t('guests.qr_formats_label') }}
          <b class="text-primary-800">{{ t('guests.qr_formats_value') }}</b>
        </p>
        <p class="text-xs">
          {{ t('guests.qr_max_size_label') }}
          <b class="text-primary-800">{{ t('guests.qr_max_size_value') }}</b> ·
          {{ t('guests.qr_resolution_label') }}
          <b class="text-primary-800">{{ t('guests.qr_resolution_value') }}</b>
        </p>

        <div
          v-if="fileToUpload && previewUrl && !isUploading"
          class="my-2 flex animate-fadeIn gap-2"
        >
          <IconCheckmark
            :font-controlled="false"
            class="block size-[20px] text-primary-700"
          />
          <p class="text-xs text-primary-700">
            {{ t('guests.qr_preview_ready') }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <BaseButton
            btn-type="outline-primary"
            :disabled="isUploading"
            @click="openFileDialog"
          >
            {{
              hasImage
                ? t('guests.qr_change_image')
                : t('guests.qr_upload_image')
            }}
          </BaseButton>

          <BaseButton
            v-if="fileToUpload && previewUrl"
            btn-type="primary"
            :loading="isUploading"
            :disabled="isUploading"
            @click="uploadImage"
          >
            {{ t('guests.qr_save_image') }}
          </BaseButton>
        </div>

        <p v-if="errorMessage" class="text-sm text-red-600">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Lado direito: área de pré-visualização / placeholder -->
      <button
        type="button"
        class="group flex items-center justify-center overflow-hidden rounded-3xl p-2 transition hover:border-primary-200 hover:bg-primary-25"
        :class="
          previewUrl || imageUrl
            ? undefined
            : 'border-2 border-dashed border-grey-200 bg-grey-100/30'
        "
        @click="openFileDialog"
      >
        <!-- Imagem existente ou preview -->
        <img
          v-if="previewUrl || imageUrl"
          :src="previewUrl || imageUrl || undefined"
          :alt="t('guests.qr_img_alt')"
          class="h-full w-full rounded-2xl object-cover md:h-[450px] md:w-[450px]"
        />

        <!-- Placeholder -->
        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center gap-3 py-8 text-grey-400 md:h-[450px] md:w-[450px] md:py-0"
        >
          <IconMenuGallery
            :font-controlled="false"
            class="block size-[80px] text-grey-300 group-hover:text-primary-700"
          />
          <p
            class="text-lg font-semibold text-grey-400 group-hover:text-primary-700"
          >
            {{ t('guests.qr_placeholder_text') }}
          </p>
          <p
            class="text-xs font-medium text-grey-400 group-hover:text-primary-700"
          >
            {{ t('guests.qr_placeholder_size') }}
          </p>
        </div>
      </button>
    </div>

    <!-- input de ficheiro escondido -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileSelected"
    />
  </section>
</template>
