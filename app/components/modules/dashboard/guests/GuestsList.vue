<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useGuestCategories } from '~/composables/useGuestCategories';
import { getGuestService } from '~/services/guestService';

const { eventInitials } = useEventStore();

const queryParameters = reactive<GuestParameters>({
  guestLocalId: undefined,
  categoryId: undefined,
  availability_Type: '',
  whatsAppQrStatus: '',
  whatsAppOutboundType: '',
  whatsAppOutboundStatus: '',
  whatsAppFilter: '',
  searchQuery: '',
  startDate: '',
  endDate: '',
  giftBrought: undefined,
  pageNumber: 1,
  pageSize: 10,
});

const { isAdministrator, isSuperAdministrator } = useAuthStore();
const { guests, pagination, isRefreshing, isError, refreshGuests } =
  await useGuestsList(queryParameters);

const { refreshDesks } = await useDeskOptions();
const { categories, isRefreshing: isRefreshingCategories } =
  await useGuestCategories();

const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const searchQuery = ref<string>('');
const searchId = ref<number | undefined>(undefined);
const showFormModal = ref<boolean>(false);
const showArrivedModal = ref<boolean>(false);
const showCancelArrivedModal = ref<boolean>(false);
const guestSelected = ref<Guest | undefined>(undefined);
const showExportFormatModal = ref<boolean>(false);
const isExporting = ref<boolean>(false);

const toast = useToast();

const availabilityOptions: SelectOption[] = [
  {
    id: 'ConfirmedButNotFull',
    value: 'ConfirmedButNotFull',
    name: 'Confirmados mas não para todos',
  },
  { id: 'Confirmed', value: 'Confirmed', name: 'Confirmados' },
  { id: 'NotConfirmed', value: 'NotConfirmed', name: 'Não confirmados' },
  { id: 'Arrived', value: 'Arrived', name: 'Já chegaram' },
  { id: 'Absent', value: 'Absent', name: 'Ausentes' },
];

const giftOptions: SelectOption[] = [
  { id: 'true', value: true, name: 'Levou presente' },
  { id: 'false', value: false, name: 'Não levou presente' },
];

const whatsAppFilterOptions: SelectOption[] = [
  { id: 'qr_not_sent', value: 'qr:not_sent', name: 'QR Code — Por enviar' },
  { id: 'qr_pending', value: 'qr:pending', name: 'QR Code — Em processamento' },
  {
    id: 'qr_accepted',
    value: 'qr:accepted',
    name: 'QR Code — Aceite pela plataforma',
  },
  { id: 'qr_delivered', value: 'qr:delivered', name: 'QR Code — Entregue' },
  { id: 'qr_seen', value: 'qr:seen', name: 'QR Code — Visualizado' },
  {
    id: 'qr_invalid_phone',
    value: 'qr:invalid_phone',
    name: 'QR Code — Número inválido',
  },
  {
    id: 'qr_failed_temporary',
    value: 'qr:failed_temporary',
    name: 'QR Code — Falha temporária',
  },
  { id: 'qr_failed', value: 'qr:failed', name: 'QR Code — Falha no envio' },
  {
    id: 'qr_delivery_unknown',
    value: 'qr:delivery_unknown',
    name: 'QR Code — Entrega por confirmar',
  },
  {
    id: 'qr_needs_review',
    value: 'qr:needs_review',
    name: 'QR Code — Precisa de verificação',
  },

  {
    id: 'invitation_not_sent',
    value: '2:not_sent',
    name: 'Convite — Por enviar',
  },
  {
    id: 'invitation_pending',
    value: '2:pending',
    name: 'Convite — Em processamento',
  },
  {
    id: 'invitation_accepted',
    value: '2:accepted',
    name: 'Convite — Aceite pela plataforma',
  },
  {
    id: 'invitation_delivered',
    value: '2:delivered',
    name: 'Convite — Entregue',
  },
  { id: 'invitation_seen', value: '2:seen', name: 'Convite — Visualizado' },
  {
    id: 'invitation_invalid_phone',
    value: '2:invalid_phone',
    name: 'Convite — Número inválido',
  },
  {
    id: 'invitation_failed_temporary',
    value: '2:failed_temporary',
    name: 'Convite — Falha temporária',
  },
  {
    id: 'invitation_failed',
    value: '2:failed',
    name: 'Convite — Falha no envio',
  },
  {
    id: 'invitation_delivery_unknown',
    value: '2:delivery_unknown',
    name: 'Convite — Entrega por confirmar',
  },
  {
    id: 'invitation_needs_review',
    value: '2:needs_review',
    name: 'Convite — Precisa de verificação',
  },

  // {
  //   id: 'save_the_date_not_sent',
  //   value: '3:not_sent',
  //   name: 'Save the date — Por enviar',
  // },
  // {
  //   id: 'save_the_date_pending',
  //   value: '3:pending',
  //   name: 'Save the date — Em processamento',
  // },
  // {
  //   id: 'save_the_date_accepted',
  //   value: '3:accepted',
  //   name: 'Save the date — Aceite pela plataforma',
  // },
  // {
  //   id: 'save_the_date_delivered',
  //   value: '3:delivered',
  //   name: 'Save the date — Entregue',
  // },
  // {
  //   id: 'save_the_date_seen',
  //   value: '3:seen',
  //   name: 'Save the date — Visualizado',
  // },
  // {
  //   id: 'save_the_date_invalid_phone',
  //   value: '3:invalid_phone',
  //   name: 'Save the date — Número inválido',
  // },
  // {
  //   id: 'save_the_date_failed_temporary',
  //   value: '3:failed_temporary',
  //   name: 'Save the date — Falha temporária',
  // },
  // {
  //   id: 'save_the_date_failed',
  //   value: '3:failed',
  //   name: 'Save the date — Falha no envio',
  // },
  // {
  //   id: 'save_the_date_delivery_unknown',
  //   value: '3:delivery_unknown',
  //   name: 'Save the date — Entrega por confirmar',
  // },
  // {
  //   id: 'save_the_date_needs_review',
  //   value: '3:needs_review',
  //   name: 'Save the date — Precisa de verificação',
  // },

  // {
  //   id: 'reminder_not_sent',
  //   value: '4:not_sent',
  //   name: 'Lembrete — Por enviar',
  // },
  // {
  //   id: 'reminder_pending',
  //   value: '4:pending',
  //   name: 'Lembrete — Em processamento',
  // },
  // {
  //   id: 'reminder_accepted',
  //   value: '4:accepted',
  //   name: 'Lembrete — Aceite pela plataforma',
  // },
  // {
  //   id: 'reminder_delivered',
  //   value: '4:delivered',
  //   name: 'Lembrete — Entregue',
  // },
  // { id: 'reminder_seen', value: '4:seen', name: 'Lembrete — Visualizado' },
  // {
  //   id: 'reminder_invalid_phone',
  //   value: '4:invalid_phone',
  //   name: 'Lembrete — Número inválido',
  // },
  // {
  //   id: 'reminder_failed_temporary',
  //   value: '4:failed_temporary',
  //   name: 'Lembrete — Falha temporária',
  // },
  // {
  //   id: 'reminder_failed',
  //   value: '4:failed',
  //   name: 'Lembrete — Falha no envio',
  // },
  // {
  //   id: 'reminder_delivery_unknown',
  //   value: '4:delivery_unknown',
  //   name: 'Lembrete — Entrega por confirmar',
  // },
  // {
  //   id: 'reminder_needs_review',
  //   value: '4:needs_review',
  //   name: 'Lembrete — Precisa de verificação',
  // },
];

const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.guestLocalId = searchId.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(searchId, () => {
  debouncedSearch();
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing.value &&
    !isError.value &&
    guests.value.length === 0 &&
    searchQuery.value === '' &&
    queryParameters.availability_Type === '',
);

const startExport = (format: ExportListFormat) => {
  showExportFormatModal.value = false;

  if (format === 'excel') exportGuestsToExcel();
  else if (format === 'pdf') exportGuestsToPdf();
  return;
};

const exportGuestsToExcel = async () => {
  try {
    isExporting.value = true;
    const blob = await guestService.exportGuests(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Convidados_${eventInitials}_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    isExporting.value = false;
  } catch (err) {
    console.error('Erro ao exportar os convidados:', err);
    toast.error('Ocorreu um erro ao exportar os convidados');
    isExporting.value = false;
  }
};

const exportGuestsToPdf = async () => {
  try {
    isExporting.value = true;
    const blob = await guestService.exportGuestsAsPdf(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Convidados_${eventInitials}_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.pdf`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    isExporting.value = false;
  } catch (err) {
    console.error('Erro ao exportar os convidados:', err);
    toast.error('Ocorreu um erro ao exportar os convidados');
    isExporting.value = false;
  }
};

const showManageModal = ref(false);

const openConfirmModal = (g: Guest) => {
  guestSelected.value = g;
  showManageModal.value = true;
};

const onGuestUpdated = () => {
  refreshGuests({ force: true });
  refreshDesks({ force: true });
};

const absenceRowClass = (g: Guest) => {
  if (g.absence_Declared) {
    return 'opacity-60';
  }

  return '';
};

const openArrivalAction = (g: Guest) => {
  guestSelected.value = g;

  if (g.arrived) {
    showCancelArrivedModal.value = true;
    return;
  }

  showArrivedModal.value = true;
};

watch(
  () => queryParameters.whatsAppFilter,
  async (value) => {
    queryParameters.whatsAppQrStatus = '';
    queryParameters.whatsAppOutboundType = '';
    queryParameters.whatsAppOutboundStatus = '';
    queryParameters.pageNumber = 1;

    if (!value) return;

    const filter = String(value).trim();

    // Formato QR: qr_delivered, qr_pending, qr_seen...
    if (filter.startsWith('qr_')) {
      queryParameters.whatsAppQrStatus = filter.replace(
        /^qr_/,
        '',
      ) as GuestWhatsAppQrStatus;

      // await refreshGuests({ force: true });
      return;
    }

    // Formato outbound por nome: invitation_delivered, reminder_pending...
    const outboundTypeMap: Record<string, GuestWhatsAppOutboundType> = {
      qrcode: GuestWhatsAppOutboundType.QrCode,
      invitation: GuestWhatsAppOutboundType.Invitation,
      savethedate: GuestWhatsAppOutboundType.SaveTheDate,
      reminder: GuestWhatsAppOutboundType.Reminder,
    };

    const lastUnderscoreIndex = filter.lastIndexOf('_');

    if (lastUnderscoreIndex > 0) {
      const rawType = filter.slice(0, lastUnderscoreIndex).toLowerCase();
      const rawStatus = filter.slice(lastUnderscoreIndex + 1);

      const mappedType = outboundTypeMap[rawType];

      if (mappedType !== undefined) {
        queryParameters.whatsAppOutboundType = mappedType;
        queryParameters.whatsAppOutboundStatus =
          rawStatus as GuestWhatsAppDeliveryStatus;

        // await refreshGuests({ force: true });
        return;
      }
    }

    // Compatibilidade com formato antigo: 2:delivered
    const [channel, status] = filter.split(':');
    const parsedType = Number(channel);

    if (!Number.isNaN(parsedType) && status) {
      queryParameters.whatsAppOutboundType =
        parsedType as GuestWhatsAppOutboundType;
      queryParameters.whatsAppOutboundStatus =
        status as GuestWhatsAppDeliveryStatus;
    }

    // await refreshGuests({ force: true });
  },
);

onMounted(() => {
  refreshDesks({ force: true });
  // refreshGuests({ force: true });
});
</script>
<template>
  <section
    id="guests"
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <!-- Content -->
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Filters -->
      <div
        class="flex w-full max-w-full animate-fadeIn flex-col gap-2 md:flex-row md:justify-between md:gap-20"
      >
        <div class="w-full md:w-1/2">
          <BaseInputGroup
            id="guestId"
            v-model="searchId"
            :addon="`${eventInitials}-`"
            type="number"
            name="guestId"
            label="Número do Convite:"
            placeholder="Pesquise o número do convite"
          />

          <BaseInput
            id="guestName"
            v-model="searchQuery"
            autocomplete="name"
            type="search"
            name="guestName"
            label="Pesquisa:"
            placeholder="Pesquise o nome do convidado"
          />

          <BaseSelect
            v-if="!isRefreshingCategories && categories"
            id="category"
            v-model="queryParameters.categoryId"
            label="Tipo de Convidado: "
            empty-message="Todos convidados"
            :options="
              categories.map((category) => ({
                id: category.id,
                name: category.name,
                value: category.id,
              }))
            "
          />
        </div>
        <div class="w-full md:w-1/2">
          <BaseSelect
            id="avaliability"
            v-model="queryParameters.availability_Type"
            label="Disponibilidade: "
            :options="availabilityOptions"
            empty-message="Todas disponibilidades"
          />

          <BaseSelect
            id="giftBrought"
            v-model="queryParameters.giftBrought"
            label="Presentes: "
            :options="giftOptions"
            empty-message="Todos"
          />

          <BaseSelect
            id="whatsAppFilter"
            v-model="queryParameters.whatsAppFilter"
            label="Envios por WhatsApp: "
            :options="whatsAppFilterOptions"
            empty-message="Todos estados"
          />
        </div>
      </div>

      <!-- Counter & Actions -->
      <div
        class="my-2 flex w-full flex-wrap justify-start gap-2 md:items-end md:justify-between"
      >
        <!-- Counter -->
        <div v-if="!isRefreshing" class="flex items-end justify-between gap-2">
          <icon-funnel
            :font-controlled="false"
            class="text-primary-700 block h-7 w-7"
          ></icon-funnel>
          <h3 class="text-primary-700 text-2xl font-bold">
            {{
              pagination?.totalPeopleCount === 1
                ? '1 Convidado'
                : `${pagination ? pagination.totalPeopleCount : 0} Convidados`
            }}
          </h3>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2">
          <BaseButton
            icon="add"
            size="md"
            btn-type="primary"
            @click.prevent="showFormModal = true"
          >
            Adicionar Convidado
          </BaseButton>
          <BaseButton
            v-if="guests && guests.length > 0"
            btn-type="outline-primary"
            btn-size="md"
            icon="download"
            :disabled="isExporting"
            @click="showExportFormatModal = true"
            >{{
              isExporting ? 'A exportar, aguarde...' : 'Exportar'
            }}</BaseButton
          >
        </div>
      </div>

      <!-- Loading -->
      <BaseTableLoading v-if="isRefreshing" class="hidden md:block" />

      <BaseLoading
        v-if="isRefreshing"
        size="lg"
        orientation="vertical"
        class="block md:hidden"
      />

      <!-- SearchNotFound -->
      <BaseSearchNotFound
        v-if="!isFirstTime && guests.length === 0"
        @fallback="refreshGuests({ force: true })"
      >
        Infelizmente, não encontramos convidados para o filtro aplicado
      </BaseSearchNotFound>

      <!-- No desk: first Time -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-open-mail"
        title="Ainda não criou nenhum convidado"
        description="Crie o seu primeiro convidado para começar a organizar a lista de presenças do seu evento de forma mais eficiente"
        :show-button="isAdministrator || isSuperAdministrator"
        button-label="Criar primeiro convidado"
        button-icon="add"
        @action="showFormModal = true"
      />

      <!-- Data -->
      <BaseTable
        v-if="!isRefreshing && !isError && guests.length > 0"
        summary="Tabela sobre a lista de convidados"
      >
        <template #thead>
          <tr>
            <th scope="col">Nº</th>
            <th scope="col">Nome</th>
            <th scope="col">Pessoas</th>
            <th scope="col">Mesa</th>
            <th scope="col">Acções</th>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="guest in guests"
            :key="guest.id"
            :class="absenceRowClass(guest)"
          >
            <td>{{ `${eventInitials}-${guest.localId}` }}</td>
            <td class="flex gap-2">
              <GuestsStatusIcon :guest="guest" />
              <span class="truncate">{{ guest.name }}</span>
            </td>
            <td>{{ guest.people_Count }}</td>
            <td>
              {{ guest.deskName }}
            </td>
            <td class="flex items-center gap-2">
              <!-- Chegada -->
              <BaseButton
                btn-size="sm"
                btn-type="outline-primary"
                :disabled="guest.absence_Declared"
                :title="
                  guest.absence_Declared
                    ? 'Convidado marcado como ausente'
                    : guest.arrived
                      ? 'Cancelar chegada'
                      : 'Confirmar chegada'
                "
                @click.prevent="openArrivalAction(guest)"
              >
                {{ guest.arrived ? 'Não chegou' : 'Chegou' }}
              </BaseButton>

              <!-- Ver detalhes -->
              <BaseButton
                btn-size="sm"
                btn-type="outline-primary"
                @click.prevent="openConfirmModal(guest)"
              >
                RSVP
              </BaseButton>

              <!-- Ver detalhes -->
              <BaseButtonLink
                :to="`/admin/convidados/${guest.id}`"
                btn-type="primary"
                btn-size="sm"
              >
                Ver detalhes
              </BaseButtonLink>
            </td>
          </tr>
        </template>
      </BaseTable>

      <!-- Pagination -->
      <BasePagination
        v-if="pagination && pagination.totalPages > 1"
        :pagination-data="pagination"
        @page-change="onPageChange"
        @page-selected="onPageSelected"
      />
    </div>

    <!-- Modals -->
    <GuestsFormModal
      :show="showFormModal"
      @close-modal="showFormModal = false"
      @success="refreshGuests({ force: true })"
    />

    <!-- Guest Arrived modal -->
    <LazyGuestsArrivedModal
      :show="showArrivedModal"
      :guest="guestSelected"
      @close-modal="showArrivedModal = false"
      @success="refreshGuests({ force: true })"
    />

    <!-- Guest Cancel Arrived modal -->
    <LazyGuestsCancelArrivalModal
      :show="showCancelArrivedModal"
      :guest="guestSelected"
      @close-modal="showCancelArrivedModal = false"
      @success="refreshGuests({ force: true })"
    />

    <LazyGuestsExportListModal
      :show="showExportFormatModal"
      @close-modal="showExportFormatModal = false"
      @export="startExport"
    />

    <LazyGuestManageModal
      :show="showManageModal"
      :guest="guestSelected"
      :event-initials="eventInitials"
      @close="showManageModal = false"
      @updated="onGuestUpdated"
    />
  </section>
</template>
