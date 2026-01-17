<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getDeskService } from '~/services/deskService';
import { getInvitationService } from '~/services/invitationService';
import { generateSlug } from '~/utils/stringUtils';

interface GuestViewProps {
  guest: Guest;
}

const { $html2canvas, $jsPDF } = useNuxtApp();
const { siteConfig } = await useClientConfig();
const InvitationComponent = shallowRef();

const props = defineProps<GuestViewProps>();
const toast = useToast();
const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const showExportFormatModal = ref<boolean>(false);
const eventStore = useEventStore();

const { refreshGuest } = await useGuest(props.guest.id);
const desk = ref<Desk | null | undefined>(undefined);
const isLoadingDesk = ref(false);
const showForExport = ref(false);
const qrCodeRef = ref();
const isExporting = ref(false);
const isGeneratingInvitation = ref(false);
const textColorExport = ref<ExportTextColor>('black');

const nuxtApp = useNuxtApp();
const deskService = getDeskService(nuxtApp.$api);
const invitationService = getInvitationService(nuxtApp.$api);
const { apiImageUrl } = useRuntimeConfig().public;

async function fetchDeskById(id: number) {
  if (!id) return;
  isLoadingDesk.value = true;
  try {
    desk.value = await deskService.getDesk(id);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    desk.value = undefined;
  } finally {
    isLoadingDesk.value = false;
  }
}

const guestsPeopleCount = computed(() => {
  return desk.value?.guests?.reduce((sum, g) => sum + g.people_Count, 0) ?? 0;
});

const refreshDetails = async () => {
  await refreshGuest({ force: true });
  await fetchDeskById(props.guest.deskId);
};

watch(
  () => props.guest.deskId,
  async (newId) => {
    await fetchDeskById(newId);
  },
  { immediate: true },
);

const exportInvitationAsImage = async () => {
  try {
    if (!import.meta.client) return;

    isExporting.value = true;
    showForExport.value = true;

    await nextTick();

    const el = qrCodeRef.value?.el;

    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Elemento DOM não disponível');
    }
    const canvas = await $html2canvas(qrCodeRef.value?.el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const image = canvas.toDataURL('image/png');

    // Criar download direto da imagem
    const link = document.createElement('a');
    link.href = image;
    link.download = `${eventStore.eventInitials}-${props.guest.localId}-${generateSlug(props.guest.name)}.png`; // slug  do guest.name aqui
    link.click();
  } catch (err) {
    console.error(err);
    toast.error('Erro ao exportar o QRCode');
  } finally {
    isExporting.value = false;
    showForExport.value = false;
  }
};

const exportInvitationAsPdf = async () => {
  try {
    isExporting.value = true;
    showForExport.value = true;
    await nextTick();

    const el = qrCodeRef.value?.el;

    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Elemento DOM do QRCode não encontrado.');
    }

    const canvas = await $html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    const imgProps = await new $jsPDF().getImageProperties(imgData);

    // Conversão de px → mm (96 dpi)
    const pxToMm = (px: number) => (px * 25.4) / 96;
    const pdfWidth = pxToMm(imgProps.width);
    const pdfHeight = pxToMm(imgProps.height);

    // Criar o PDF com o tamanho exato do QRCode
    const pdf = new $jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const fileName = `${eventStore.eventInitials}-${props.guest.localId}-${generateSlug(props.guest.name)}.png`; // slug do guest.name aqui
    pdf.save(fileName);
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro ao exportar o QRCode em PDF.');
  } finally {
    isExporting.value = false;
    showForExport.value = false;
  }
};

// const copyInvitationLink = async () => {
//   try {
//     const link = `${siteConfig.link}?QRCode=${props.guest.localId}`;

//     await navigator.clipboard.writeText(link);
//     toast.success('Link do QRCode copiado com sucesso!');
//   } catch (error) {
//     console.error(error);
//     toast.error('Erro ao copiar o link do QRCode.');
//   }
// };

const startExport = (exportOptions: ExportQROptions) => {
  textColorExport.value = exportOptions.color;

  if (exportOptions.format === 'png') {
    exportInvitationAsImage();
  } else if (exportOptions.format === 'pdf') {
    exportInvitationAsPdf();
  }

  showExportFormatModal.value = false;
};

const { canExport: canExportInvitation } = await useInvitationSettings();
const generateInvitationPng = async () => {
  try {
    isGeneratingInvitation.value = true;

    const eventId = eventStore.ensureSelected();
    const result = await invitationService.renderGuest(
      eventId,
      props.guest.id,
      false,
    );

    const url = `${apiImageUrl}${result.fileUrl}?t=${new Date().getTime()}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok)
      throw new Error(
        `Falha ao descarregar imagem. Status: ${response.status}`,
      );

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${eventStore.eventInitials}-${props.guest.localId}-convite.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro ao gerar o convite.');
  } finally {
    isGeneratingInvitation.value = false;
  }
};

onMounted(() => {
  const componentName = siteConfig.qrCodeComponent;

  if (componentName) {
    try {
      InvitationComponent.value = defineAsyncComponent(
        () =>
          import(`@/components/modules/dashboard/qrcodes/${componentName}.vue`),
      );
    } catch (err) {
      console.error('Erro ao carregar componente:', err);
    }
  }
});
</script>
<template>
  <BaseCard
    :title="guest.name"
    description="Verifique todos os detalhes deste convidado aqui"
    back-link="/admin/convidados"
  >
    <div
      class="flex w-full animate-fadeIn flex-col px-3 md:flex-row md:justify-between"
    >
      <!-- Guest Info -->
      <div class="md:w-1/2">
        <div
          class="mb-3 flex flex-col justify-between md:items-center lg:flex-row"
        >
          <!-- Main Links: Generate Invitation & Generate Confirmation Link -->
          <div class="my-3 flex gap-2">
            <!-- <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              icon="copy"
              @click="copyInvitationLink"
            >
              Copiar Link
            </BaseButton> -->

            <BaseButton
              v-if="eventStore.eventQRCodeUrl"
              btn-type="primary"
              btn-size="sm"
              icon="download"
              :disabled="isExporting"
              class="animate-fadeIn"
              @click="showExportFormatModal = true"
            >
              {{ isExporting ? 'A gerar QR Code...' : 'Gerar QR Code' }}
            </BaseButton>
            <BaseButton
              v-if="canExportInvitation"
              btn-type="outline-primary"
              btn-size="sm"
              icon="download"
              :disabled="isGeneratingInvitation"
              @click="generateInvitationPng"
            >
              {{
                isGeneratingInvitation ? 'A gerar convite...' : 'Gerar Convite'
              }}
            </BaseButton>
          </div>
        </div>

        <!-- Descriptions -->
        <BaseDescriptionList>
          <BaseDescriptionListItem title="Nome" :description="guest.name" />
          <BaseDescriptionListItem
            title="Número de Pessoas"
            :description="
              guest.people_Count === 1
                ? '1 Pessoa'
                : `${guest.people_Count} Pessoas`
            "
          />
          <BaseDescriptionListItem
            title="Telefone"
            :description="guest.phone"
          />
          <BaseDescriptionListItem
            title="Tipo de Convidado"
            :description="guest.categoryName"
          />
          <BaseDescriptionListItem title="Presença Confirmada" hide-descriptipn>
            <p
              class="text-sm font-bold"
              :class="props.guest?.presence_Confirmed ? 'text-green-700' : ''"
            >
              {{ guest?.presence_Confirmed ? 'Sim' : 'Não' }}
            </p>
          </BaseDescriptionListItem>

          <BaseDescriptionListItem
            v-if="guest.presence_Confirmed && guest.people_Confirmed"
            title="Pessoas Confirmadas"
            :description="`${guest.people_Confirmed} ${guest.people_Confirmed === 1 ? 'Pessoa' : 'Pessoas'}`"
          />
          <BaseDescriptionListItem
            v-if="guest.additional_Comments"
            title="Comentários adicionais"
            :description="guest.additional_Comments"
          />
        </BaseDescriptionList>

        <!-- Main Actions -->
        <div class="my-4 flex flex-wrap items-center space-x-2">
          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            icon="pencil"
            @click="showFormModal = true"
          >
            Modificar
          </BaseButton>

          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            class="flex items-center space-x-1"
            icon="cancel"
            @click="showRemoveModal = true"
          >
            Remover
          </BaseButton>
        </div>
      </div>

      <!-- Desk Guests -->
      <LazyDesksTableView
        v-if="desk"
        :desk-name="desk.name"
        :guests="desk.guests"
        :people-count="guestsPeopleCount"
      />
    </div>

    <!-- Invitation File -->
    <div
      class="pointer-events-none fixed left-[-9999px] top-[-9999px] opacity-0"
    >
      <component
        :is="InvitationComponent"
        ref="qrCodeRef"
        :guest="guest"
        :color="textColorExport"
      />
    </div>

    <!-- Example Invitation -->
    <!-- <component :is="InvitationComponent" ref="qrCodeRef" :guest="guest" /> -->

    <!-- Modals -->
    <LazyGuestsFormModal
      :show="showFormModal"
      :guest="guest"
      @close-modal="showFormModal = false"
      @success="refreshDetails"
    />

    <LazyGuestsRemoveModal
      :show="showRemoveModal"
      :guest="guest"
      @close-modal="showRemoveModal = false"
      @success="$router.push('/admin/convidados')"
    />

    <LazyGuestsExportQRCodeModal
      :show="showExportFormatModal"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />
  </BaseCard>
</template>
