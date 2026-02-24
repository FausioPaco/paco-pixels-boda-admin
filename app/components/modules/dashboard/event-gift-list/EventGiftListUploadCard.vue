<script setup lang="ts">
const props = defineProps<{ giftList: EventGiftList }>();
const { apiImageUrl } = useRuntimeConfig().public;

defineEmits(['upload']);

const fileUrl = computed(() => props.giftList?.file?.fileUrl ?? null);
const fileName = computed(() => props.giftList?.file?.originalFileName ?? null);

const mimeType = computed(() => {
  if (!props.giftList?.file) return null;
  return props.giftList.file.mimeType === 'application/pdf' ? 'PDF' : 'Imagem';
});

const downloadFile = () => {
  if (!fileUrl.value) return;

  const a = document.createElement('a');
  a.href = fileUrl.value;
  a.download = fileName.value ?? 'lista-presentes';
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
          Carregar lista de presentes
        </h3>
        <p class="text-grey-400 max-w-[760px] text-sm">
          Se já tem a lista de presentes em PDF ou imagem, carregue-a aqui para
          ser partilhada com os convidados.
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
                {{ fileName ?? 'Ficheiro da lista de presentes' }}
              </p>
              <p class="text-grey-400 mt-0.5 text-xs">
                {{ mimeType ?? 'Formato desconhecido' }}
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
      </div>

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
