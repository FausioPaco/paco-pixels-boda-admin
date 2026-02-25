<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { sanitizeRichHtml } from '~/utils/sanitizeHtml';

const toast = useToast();
const { eventId, eventName, eventSlug } = useEventStore();
const { apiImageUrl } = useRuntimeConfig().public;

const pdfRef = ref<HTMLElement | null>(null);
const nuxtApp = useNuxtApp();

const getCoupleName = () => eventName ?? 'Noivos';

const {
  giftList,
  isRefreshing,
  isPersisting,
  isError,
  errorMessage,
  refreshEventGiftList,
  updateMode,
  updateEditor,
} = await useEventGiftList(eventId!, { immediate: false });

onMounted(() => {
  refreshEventGiftList();
});

// Mode
const setMode = async (mode: 'manual' | 'upload') => {
  await updateMode(mode);
};

// Editor local state
const localHtml = ref<string>('');

watch(
  () => giftList.value?.htmlContent,
  (val) => {
    // só inicializa quando vem do server e não temos nada local
    if (typeof val === 'string' && !localHtml.value) localHtml.value = val;
  },
  { immediate: true },
);

const sanitizedForPreview = computed(() =>
  sanitizeRichHtml(localHtml.value ?? '', apiImageUrl),
);

const onSave = async () => {
  if (!eventId) return;

  // sanitização no front (defensivo) + base url
  const clean = sanitizeRichHtml(localHtml.value ?? '', apiImageUrl);

  await updateEditor(clean);
  toast.success('Lista de presentes guardada com sucesso.');
};

// Upload
const showUploadModal = ref(false);

// PDF
const generatePdf = async () => {
  if (!pdfRef.value) return;

  if (!localHtml.value?.trim()) {
    toast.info('Ainda não existe conteúdo na lista de presentes.');
    return;
  }

  try {
    const dpr = window.devicePixelRatio || 1;

    const canvas = await nuxtApp.$html2canvas(pdfRef.value, {
      backgroundColor: '#ffffff',
      useCORS: true,
      scale: Math.min(4, Math.max(2, dpr * 2)), // tipicamente 2–4 fica top
      windowWidth: pdfRef.value.scrollWidth,
      windowHeight: pdfRef.value.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');

    const doc = new nuxtApp.$jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      doc.addPage();
      position -= pageHeight;
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(`lista-presentes-${eventSlug}.pdf`);
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível gerar o PDF.');
  }
};

watch(errorMessage, (val) => {
  if (val) toast.error(val);
});
</script>

<template>
  <section class="relative flex w-full flex-col items-center px-4 py-5">
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <div
        class="flex flex-col justify-start gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="mt-4 md:w-[75%] lg:w-1/2">
          <BaseMiniSwitch
            :model-value="giftList?.mode ?? 'manual'"
            :items="[
              { value: 'manual', label: 'Escrever lista', icon: 'document' },
              { value: 'upload', label: 'Carregar ficheiro', icon: 'upload' },
            ]"
            :disabled="isPersisting"
            size="sm"
            @update:model-value="setMode($event as any)"
          />
        </div>

        <div class="flex gap-2 md:w-1/2 md:justify-end">
          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            :disabled="isRefreshing || isPersisting"
            icon="refresh"
            :icon-size="16"
            @click="refreshEventGiftList"
          >
            Actualizar
          </BaseButton>

          <BaseButton
            v-if="giftList?.mode === 'manual'"
            btn-type="outline-primary"
            btn-size="sm"
            icon="download"
            :icon-size="16"
            :disabled="isPersisting"
            @click="generatePdf"
          >
            Gerar PDF
          </BaseButton>

          <BaseButton
            v-if="giftList?.mode === 'manual'"
            btn-type="primary"
            btn-size="sm"
            icon="save"
            :icon-size="16"
            :disabled="isPersisting"
            @click="onSave"
          >
            Salvar
          </BaseButton>
        </div>
      </div>

      <BaseLoading
        v-if="isRefreshing"
        size="lg"
        orientation="vertical"
        class="my-6"
      />

      <BaseError v-if="!isRefreshing && isError && errorMessage" class="mt-6">
        {{ errorMessage }}
      </BaseError>

      <div v-if="!isRefreshing && giftList" class="mt-6">
        <EventGiftListUploadCard
          v-if="giftList.mode === 'upload'"
          :gift-list="giftList"
          @upload="showUploadModal = true"
        />

        <div v-else class="rounded-2xl border bg-white p-5">
          <div class="space-y-2">
            <h3 class="text-primary-700 text-xl font-bold">
              Escrever lista de presentes
            </h3>
            <p class="text-grey-400 text-sm">
              Escreva aqui a sua lista de presentes. O conteúdo será partilhado
              com os convidados.
            </p>
          </div>

          <div class="mt-4">
            <ClientOnly>
              <TipTapEditor
                id="giftsHTML"
                v-model="localHtml"
                label="Descrição"
                placeholder="Coloque a descrição aqui"
              />
            </ClientOnly>

            <BaseButton
              v-if="giftList?.mode === 'manual'"
              btn-type="primary"
              btn-size="sm"
              icon="save"
              :icon-size="16"
              :disabled="isPersisting"
              @click="onSave"
            >
              Salvar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <LazyEventGiftListUploadModal
      :show="showUploadModal"
      @close-modal="showUploadModal = false"
      @success="
        showUploadModal = false;
        refreshEventGiftList();
      "
    />

    <div class="fixed left-[-99999px] top-0">
      <div ref="pdfRef">
        <EventGiftListPdfDocument
          :couple-name="getCoupleName()"
          document-title="Lista de Presentes"
          :html="sanitizedForPreview"
        />
      </div>
    </div>
  </section>
</template>
