<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getEventProgramService } from '~/services/eventProgramService';

interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), { show: false });
const emit = defineEmits(['closeModal', 'success']);

const toast = useToast();
const { eventId } = useEventStore();

const nuxtApp = useNuxtApp();
const eventProgramService = getEventProgramService(nuxtApp.$api);

const isSubmiting = ref(false);
const localFile = ref<File | null>(null);

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  localFile.value = input.files?.[0] ?? null;
  serverErrors.value = { hasErrors: false, message: '' };
};

const closeModal = () => {
  localFile.value = null;
  serverErrors.value = { hasErrors: false, message: '' };
  emit('closeModal');
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
    serverErrors.value = { hasErrors: true, message: 'Selecione um ficheiro.' };
    return;
  }

  const file = localFile.value;

  // validações mínimas
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    serverErrors.value = {
      hasErrors: true,
      message: 'O ficheiro excede o tamanho máximo de 25MB.',
    };
    return;
  }

  const isPdf = file.type === 'application/pdf';
  const isImage = file.type?.startsWith('image/');
  if (!isPdf && !isImage) {
    serverErrors.value = {
      hasErrors: true,
      message: 'Apenas PDF ou imagens são permitidos.',
    };
    return;
  }

  try {
    isSubmiting.value = true;
    serverErrors.value = { hasErrors: false, message: '' };

    await eventProgramService.uploadProgramFile(eventId, file);

    toast.success('Ficheiro carregado com sucesso.');
    emit('success');
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
    <div class="w-full px-4 pb-5 text-left">
      <div class="mb-4 text-sm text-gray-600">
        Carregue um PDF ou uma imagem com o programa do seu evento.
      </div>

      <input
        type="file"
        class="w-full"
        accept="image/*,application/pdf"
        :disabled="isSubmiting"
        @change="onFileChange"
      />

      <div v-if="localFile" class="mt-3 text-sm text-gray-700">
        Ficheiro seleccionado:
        <span class="font-semibold">{{ localFile.name }}</span>
      </div>

      <BaseError v-if="serverErrors.hasErrors" class="mt-3">
        {{ serverErrors.message }}
      </BaseError>

      <div class="mt-5 flex w-full justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onSubmit"
        >
          Carregar agora
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          @click="closeModal"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
