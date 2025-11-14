<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'vue-toastification';
import { getDeskService } from '~/services/deskService';

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

const { isAdministrator, isSuperAdministrator } = useAuthStore();
const { refreshGuest } = await useGuest(props.guest.id);
const desk = ref<Desk | null | undefined>(undefined);
const isLoadingDesk = ref(false);
const showForExport = ref(false);
const invitationRef = ref();
const isExporting = ref(false);

const deskService = getDeskService(useNuxtApp().$api);

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
  await refreshGuest();
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
    isExporting.value = true;

    const el = invitationRef.value?.el;

    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Elemento DOM não disponível');
    }
    const canvas = await $html2canvas(invitationRef.value?.el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const image = canvas.toDataURL('image/png');

    // Criar download direto da imagem
    const link = document.createElement('a');
    link.href = image;
    link.download = `Convite_${props.guest.localId}.png`;
    link.click();
  } catch (err) {
    console.error(err);
    toast.error('Erro ao exportar o convite');
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

    const el = invitationRef.value?.el;

    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Elemento DOM do convite não encontrado.');
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

    // Criar o PDF com o tamanho exato do convite
    const pdf = new $jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const guestId = props.guest?.localId ?? 'convidado';
    pdf.save(`Convite_${siteConfig.initials}-${guestId}.pdf`);
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro ao exportar o convite em PDF.');
  } finally {
    isExporting.value = false;
    showForExport.value = false;
  }
};

const copyInvitationLink = async () => {
  try {
    const link = `${siteConfig.link}?convite=${props.guest.localId}`;

    await navigator.clipboard.writeText(link);
    toast.success('Link do convite copiado com sucesso!');
  } catch (error) {
    console.error(error);
    toast.error('Erro ao copiar o link do convite.');
  }
};

const startExport = (format: ExportInvitationFormat) => {
  console.log('Fired');

  if (format === 'png') {
    exportInvitationAsImage();
  } else if (format === 'pdf') {
    exportInvitationAsPdf();
  }

  showExportFormatModal.value = false;
};

onMounted(() => {
  const componentName = siteConfig.invitationComponent;

  if (componentName) {
    try {
      InvitationComponent.value = defineAsyncComponent(
        () =>
          import(`~/components/modules/admin/invitations/${componentName}.vue`),
      );
    } catch (err) {
      console.error('Erro ao carregar componente:', err);
    }
  }
});
</script>
<template>
  <div class="py-2">
    <div
      class="flex w-full animate-fadeIn flex-col px-3 md:flex-row md:justify-between"
    >
      <!-- Guest Info -->
      <div class="md:w-1/2 md:px-10">
        <div
          class="mb-3 flex flex-col justify-between md:items-center lg:flex-row"
        >
          <!-- Main Title  -->
          <div class="mb-4 mt-2 flex items-center gap-2">
            <NuxtLink to="/admin/convidados">
              <IconArrowLeft
                :font-controlled="false"
                class="text-grey-400 hover:text-primary-500 size-[24px] transition-colors duration-300"
              />
            </NuxtLink>
            <h4
              class="text-grey-400 font-bold"
              :class="
                guest.name.length > 35
                  ? 'text-lg md:text-xl'
                  : 'text-xl md:text-2xl'
              "
            >
              {{ guest.name }}
            </h4>
          </div>

          <!-- Main Links: Generate Invitation & Generate Confirmation Link -->
          <div class="my-3 flex gap-2">
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              icon="copy"
              @click="copyInvitationLink"
            >
              Copiar Link
            </BaseButton>
            <BaseButton
              btn-type="primary"
              btn-size="sm"
              icon="download"
              :disabled="isExporting"
              @click="showExportFormatModal = true"
            >
              {{ isExporting ? 'A gerar convite...' : 'Baixar Convite' }}
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
        <div
          v-if="isAdministrator || isSuperAdministrator"
          class="my-4 flex items-center space-x-2"
        >
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

    <!-- Example Invitation -->
    <!-- <component :is="InvitationComponent" ref="invitationRef" :guest="guest" /> -->

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

    <LazyGuestsExportInvitationModal
      :show="showExportFormatModal"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />

    <!-- Invitation File -->
    <div
      class="pointer-events-none fixed left-[-9999px] top-[-9999px] opacity-0"
    >
      <component :is="InvitationComponent" ref="invitationRef" :guest="guest" />
    </div>
  </div>
</template>
