<script setup lang="ts">
import { getEventService } from '~/services/eventService';

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);
const eventStore = useEventStore();

/**
 * Estado local
 */
const fileInputRef = ref<HTMLInputElement | null>(null);

const imageUrl = ref<string | null>(eventStore.eventQRCodeUrl ?? null);
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
      imageUrl.value = val ?? null;
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
    errorMessage.value = 'Por favor seleccione um ficheiro de imagem válido.';
    target.value = '';
    return;
  }

  if (file.size > maxSizeBytes) {
    errorMessage.value = 'O tamanho máximo permitido é 20MB.';
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
    const url = result.url;

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
        qrCodeImage_Url: url,
      });
    }
  } catch (err) {
    console.log(err);
    errorMessage.value =
      'Ocorreu um erro ao carregar a imagem. Por favor, tente novamente.';
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <div
    class="grid items-start gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
  >
    <!-- Lado esquerdo: textos + botões -->
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div
          class="bg-primary-50 text-primary-700 flex size-12 items-center justify-center rounded-full"
        >
          <IconUpload :font-controlled="false" class="block size-6" />
        </div>

        <div>
          <p
            class="text-grey-500 text-sm font-medium uppercase tracking-[0.16em]"
          >
            QR Code
          </p>
          <h2 class="text-grey-900 mt-1 text-xl font-semibold md:text-2xl">
            {{
              hasImage ? 'Imagem carregada' : 'Carregar imagem para o QRCode'
            }}
          </h2>
        </div>
      </div>

      <p class="text-grey-600 max-w-xl text-sm leading-relaxed md:text-base">
        <span v-if="!hasImage">
          Ainda não foi carregada a imagem que será utilizada na geração do QR
          Code deste evento. Por favor, carregue uma imagem caso pretenda
          distribuir os QR Codes das mesas aos seus convidados.
        </span>
        <span v-else>
          O ficheiro para geração do QR Code já foi carregado. Se desejar, pode
          substituí-lo a qualquer momento, seleccionando uma nova imagem.
        </span>
      </p>

      <p class="text-grey-500 text-xs">
        Formatos recomendados: JPG, PNG ou WEBP · Tamanho máximo: 20MB ·
        Resolução sugerida: 1000x1000px
      </p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <BaseButton
          btn-type="primary"
          :disabled="isUploading"
          @click="openFileDialog"
        >
          {{ hasImage ? 'Alterar imagem' : 'Carregar imagem' }}
        </BaseButton>

        <BaseButton
          v-if="fileToUpload && previewUrl"
          btn-type="outline-primary"
          :loading="isUploading"
          :disabled="isUploading"
          @click="uploadImage"
        >
          Guardar imagem
        </BaseButton>

        <p
          v-if="fileToUpload && previewUrl && !isUploading"
          class="text-grey-500 text-xs"
        >
          Pré-visualização pronta. Clica em “Guardar imagem” para concluir o
          upload.
        </p>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Lado direito: área de pré-visualização / placeholder -->
    <button
      type="button"
      class="border-grey-200 bg-grey-25 hover:border-primary-200 hover:bg-primary-25 group flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed p-4 transition"
      @click="openFileDialog"
    >
      <!-- Imagem existente ou preview -->
      <img
        v-if="previewUrl || imageUrl"
        :src="previewUrl || imageUrl || undefined"
        alt="Imagem para geração do QR Code"
        class="h-full w-full rounded-2xl object-cover"
      />

      <!-- Placeholder -->
      <div
        v-else
        class="text-grey-400 flex h-full w-full flex-col items-center justify-center gap-3"
      >
        <div
          class="border-grey-200 flex size-16 items-center justify-center rounded-full border bg-white"
        >
          <IconMenuGallery
            :font-controlled="false"
            class="text-grey-300 block size-8"
          />
        </div>
        <p class="text-grey-600 text-sm font-medium">
          Clique aqui para carregar a imagem
        </p>
        <p class="text-grey-400 text-xs">Tamanho recomendado: 1000x1000px</p>
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
</template>
