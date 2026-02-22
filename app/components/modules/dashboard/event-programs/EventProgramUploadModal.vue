<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getEventProgramService } from '~/services/eventProgramService';

interface Props {
  show?: boolean;
  isInternal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  isInternal: false,
});

const emit = defineEmits(['closeModal', 'success']);

const toast = useToast();
const { eventId } = useEventStore();

const nuxtApp = useNuxtApp();
const eventProgramService = getEventProgramService(nuxtApp.$api);

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

const openFileDialog = () => {
  fileInputRef.value?.click();
};

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

  // validações
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    errorMessage.value = 'O ficheiro excede o tamanho máximo de 25MB.';
    target.value = '';
    return;
  }

  const pdf = file.type === 'application/pdf';
  const image = file.type?.startsWith('image/');

  if (!pdf && !image) {
    errorMessage.value = 'Apenas PDF ou imagens são permitidos.';
    target.value = '';
    return;
  }

  localFile.value = file;

  // preview só para imagens
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = image ? URL.createObjectURL(file) : null;
};

const onSubmit = async () => {
  if (!eventId) {
    serverErrors.value = {
      hasErrors: true,
      message: 'O evento não foi encontrado.',
    };
    return;
  }

  if (!localFile.value) {
    serverErrors.value = {
      hasErrors: true,
      message: 'Selecione um ficheiro.',
    };
    return;
  }

  try {
    isSubmiting.value = true;
    serverErrors.value = { hasErrors: false, message: '' };

    await eventProgramService.uploadProgramFile(
      eventId,
      localFile.value,
      props.isInternal,
    );

    toast.success('Ficheiro carregado com sucesso.');
    emit('success');
    resetState();
  } catch (err: unknown) {
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao carregar o ficheiro.';
    }

    serverErrors.value.hasErrors = true;
  } finally {
    isSubmiting.value = false;
  }
};
</script>

<template>
  <BaseModal title="Carregar programa" :show="show" @close-modal="closeModal">
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
                Programa
              </p>
              <h2 class="text-grey-900 mt-1 text-xl font-semibold">
                {{
                  hasFile
                    ? 'Ficheiro seleccionado'
                    : 'Carregar ficheiro do programa'
                }}
              </h2>
            </div>
          </div>

          <p class="text-grey-600 text-sm leading-relaxed">
            Carregue um <b>PDF</b> ou uma <b>imagem</b> com o programa do seu
            evento. Depois, poderá partilhá-lo com os convidados.
          </p>

          <!-- preview/placeholder (clicável) -->
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
            <!-- Preview imagem -->
            <img
              v-if="previewUrl && isImage"
              :src="previewUrl"
              alt="Pré-visualização do programa"
              class="h-full w-full rounded-2xl object-cover md:h-[360px] md:w-[420px]"
            />

            <!-- Placeholder PDF -->
            <div
              v-else-if="hasFile && isPdf"
              class="bg-primary-50 flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl py-10 md:h-[260px] md:w-[320px]"
            >
              <IconUpload
                :font-controlled="false"
                class="text-primary-700 block size-[48px]"
              />
              <p class="text-primary-800 text-base font-semibold">
                Ficheiro PDF seleccionado
              </p>
              <p
                class="text-grey-500 max-w-[320px] break-words text-center text-xs"
              >
                {{ localFile?.name }}
              </p>
            </div>

            <!-- Placeholder vazio -->
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
                Clique aqui para seleccionar o ficheiro
              </p>
              <p
                class="text-grey-400 group-hover:text-primary-700 text-xs font-medium"
              >
                PDF ou imagem · Até 25MB
              </p>
            </div>
          </button>

          <!-- Alter ficheiro -->
          <div v-if="hasFile" class="flex w-full animate-fadeIn justify-center">
            <BaseButton
              btn-type="outline-primary"
              :disabled="isSubmiting"
              @click="openFileDialog"
            >
              Alterar ficheiro
            </BaseButton>
          </div>

          <p class="text-grey-500 text-xs">
            Formatos permitidos:
            <b class="text-primary-800">PDF, JPG, PNG ou WEBP</b>
          </p>
          <p class="text-xs">
            Tamanho máximo: <b class="text-primary-800">25MB</b>
          </p>

          <div v-if="hasFile && !isSubmiting" class="flex animate-fadeIn gap-2">
            <IconCheckmark
              :font-controlled="false"
              class="text-primary-700 block size-[18px]"
            />
            <p class="text-primary-700 text-xs">
              Pronto. Clica em <b>“Carregar agora”</b> para concluir.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <BaseButton
              v-if="hasFile"
              btn-type="primary"
              :loading="isSubmiting"
              :disabled="isSubmiting"
              @click="onSubmit"
            >
              Carregar agora
            </BaseButton>

            <BaseButton
              btn-type="outline-primary"
              :disabled="isSubmiting"
              @click="closeModal"
            >
              Cancelar
            </BaseButton>
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <BaseError v-if="serverErrors.hasErrors" class="mt-3">
            {{ serverErrors.message }}
          </BaseError>
        </div>
      </div>

      <!-- input escondido -->
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        accept="image/*,application/pdf"
        :disabled="isSubmiting"
        @change="onFileSelected"
      />
    </div>
  </BaseModal>
</template>
