<script setup lang="ts">
const props = defineProps<{ program: EventProgram }>();
const { apiImageUrl } = useRuntimeConfig().public;

defineEmits(['upload']);

const fileUrl = computed(() => {
  const f = props.program?.file;
  return f?.fileUrl ?? null;
});

const fileName = computed(() => props.program?.file?.originalFileName ?? null);
const mimeType = computed(() => props.program?.file?.mimeType ?? null);

const downloadFile = () => {
  if (!fileUrl.value) return;

  const a = document.createElement('a');
  a.href = fileUrl.value;
  a.download = fileName.value ?? 'programa-evento';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const openFileInNewTab = () => {
  if (!fileUrl.value) return;
  window.open(fileUrl.value, '_blank', 'noopener,noreferrer');
};

const showFileUploadAlert = ref(true);

const isImage = computed(
  () =>
    props.program.mode === 'upload' &&
    props.program.file?.mimeType?.startsWith('image/'),
);

const isPdf = computed(
  () =>
    props.program.mode === 'upload' &&
    props.program.file?.mimeType === 'application/pdf',
);
</script>

<template>
  <div class="w-full rounded-2xl border bg-white p-5">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div class="space-y-1">
        <h3 class="text-primary-700 text-xl font-bold">
          Carregar o seu programa
        </h3>
        <p class="text-grey-400 max-w-[760px] text-sm">
          Se já tem o programa do seu evento em PDF ou imagem, carregue-o aqui
          para ser partilhado com os convidados.
        </p>
      </div>

      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        icon="upload"
        class="sm:mt-1"
        @click="$emit('upload')"
      >
        {{ fileUrl ? 'Substituir ficheiro' : 'Carregar agora' }}
      </BaseButton>
    </div>

    <!-- Body -->
    <div class="mt-5">
      <!-- Quando existe ficheiro -->
      <div v-if="fileUrl" class="rounded-2xl border bg-white p-4">
        <div
          class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
        >
          <!-- Info do ficheiro -->
          <div class="flex items-start gap-3">
            <div
              class="bg-primary-50 text-primary-700 flex size-11 items-center justify-center rounded-xl"
            >
              <component
                :is="
                  isPdf
                    ? 'icon-file-text'
                    : isImage
                      ? 'icon-gallery'
                      : 'icon-document'
                "
                :font-controlled="false"
                class="size-6"
              />
            </div>

            <div class="min-w-0">
              <p class="text-grey-900 truncate text-sm font-semibold">
                {{ fileName ?? 'Ficheiro do programa' }}
              </p>
              <p class="text-grey-400 mt-0.5 text-xs">
                {{ mimeType ?? 'Formato desconhecido' }}
              </p>
            </div>
          </div>

          <!-- Botões -->
          <div class="flex flex-wrap items-center gap-3 md:justify-end">
            <BaseButton
              btn-type="primary"
              btn-size="sm"
              icon="download"
              :icon-size="16"
              :disabled="!fileUrl"
              @click="downloadFile"
            >
              Baixar
            </BaseButton>

            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              icon="external-link"
              :icon-size="16"
              :disabled="!fileUrl"
              @click="openFileInNewTab"
            >
              Abrir
            </BaseButton>
          </div>
        </div>

        <!-- Preview -->
        <div
          v-if="isImage"
          class="bg-grey-50 mt-4 overflow-hidden rounded-2xl border"
        >
          <img
            :src="`${apiImageUrl}/${fileUrl}`"
            alt="Pré-visualização do programa do evento"
            class="h-[360px] w-full object-cover"
            loading="lazy"
          />
        </div>

        <!-- Nota para PDF -->
        <div v-else-if="isPdf" class="bg-grey-50 mt-4 rounded-2xl border p-4">
          <p class="text-grey-500 text-sm">
            Pré-visualização indisponível para PDF. Use <b>“Abrir”</b> ou
            <b>“Baixar”</b>.
          </p>
        </div>
      </div>

      <!-- Quando não existe ficheiro -->
      <BaseAlert
        v-else
        :show="showFileUploadAlert"
        title="Sem ficheiro carregado"
        message="Ainda não foi carregado nenhum ficheiro."
        type="informative"
        @close="showFileUploadAlert = !showFileUploadAlert"
      />
    </div>
  </div>
</template>
