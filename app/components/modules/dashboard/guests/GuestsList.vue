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
const { t } = useI18n();

const availabilityOptions = computed<SelectOption[]>(() => [
  {
    id: 'ConfirmedButNotFull',
    value: 'ConfirmedButNotFull',
    name: t('guests.list_avail_confirmed_not_full'),
  },
  {
    id: 'Confirmed',
    value: 'Confirmed',
    name: t('guests.list_avail_confirmed'),
  },
  {
    id: 'NotConfirmed',
    value: 'NotConfirmed',
    name: t('guests.list_avail_not_confirmed'),
  },
  { id: 'Arrived', value: 'Arrived', name: t('guests.list_avail_arrived') },
  { id: 'Absent', value: 'Absent', name: t('guests.list_avail_absent') },
]);

const giftOptions = computed<SelectOption[]>(() => [
  { id: 'true', value: true, name: t('guests.list_gift_brought') },
  { id: 'false', value: false, name: t('guests.list_gift_not_brought') },
]);

const whatsAppFilterOptions = computed<SelectOption[]>(() => [
  {
    id: 'qr_not_sent',
    value: 'qr:not_sent',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_not_sent')}`,
  },
  {
    id: 'qr_pending',
    value: 'qr:pending',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_pending')}`,
  },
  {
    id: 'qr_accepted',
    value: 'qr:accepted',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_accepted')}`,
  },
  {
    id: 'qr_delivered',
    value: 'qr:delivered',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_delivered')}`,
  },
  {
    id: 'qr_seen',
    value: 'qr:seen',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_seen')}`,
  },
  {
    id: 'qr_invalid_phone',
    value: 'qr:invalid_phone',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_invalid_phone')}`,
  },
  {
    id: 'qr_failed_temporary',
    value: 'qr:failed_temporary',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_failed_temporary')}`,
  },
  {
    id: 'qr_failed',
    value: 'qr:failed',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_failed')}`,
  },
  {
    id: 'qr_delivery_unknown',
    value: 'qr:delivery_unknown',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_delivery_unknown')}`,
  },
  {
    id: 'qr_needs_review',
    value: 'qr:needs_review',
    name: `${t('guests.list_wa_qr_prefix')} — ${t('guests.status_needs_review')}`,
  },

  {
    id: 'invitation_not_sent',
    value: '2:not_sent',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_not_sent')}`,
  },
  {
    id: 'invitation_pending',
    value: '2:pending',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_pending')}`,
  },
  {
    id: 'invitation_accepted',
    value: '2:accepted',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_accepted')}`,
  },
  {
    id: 'invitation_delivered',
    value: '2:delivered',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_delivered')}`,
  },
  {
    id: 'invitation_seen',
    value: '2:seen',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_seen')}`,
  },
  {
    id: 'invitation_invalid_phone',
    value: '2:invalid_phone',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_invalid_phone')}`,
  },
  {
    id: 'invitation_failed_temporary',
    value: '2:failed_temporary',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_failed_temporary')}`,
  },
  {
    id: 'invitation_failed',
    value: '2:failed',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_failed')}`,
  },
  {
    id: 'invitation_delivery_unknown',
    value: '2:delivery_unknown',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_delivery_unknown')}`,
  },
  {
    id: 'invitation_needs_review',
    value: '2:needs_review',
    name: `${t('guests.list_wa_inv_prefix')} — ${t('guests.status_needs_review')}`,
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
]);

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
    toast.error(t('guests.list_export_error'));
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
    toast.error(t('guests.list_export_error'));
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
            :label="t('guests.list_invite_number_label')"
            :placeholder="t('guests.list_invite_number_placeholder')"
          />

          <BaseInput
            id="guestName"
            v-model="searchQuery"
            autocomplete="name"
            type="search"
            name="guestName"
            :label="t('guests.list_name_label')"
            :placeholder="t('guests.list_name_placeholder')"
          />

          <BaseSelect
            v-if="!isRefreshingCategories && categories"
            id="category"
            v-model="queryParameters.categoryId"
            :label="t('guests.list_category_label')"
            :empty-message="t('guests.list_category_all')"
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
            :label="t('guests.list_availability_label')"
            :options="availabilityOptions"
            :empty-message="t('guests.list_availability_all')"
          />

          <BaseSelect
            id="giftBrought"
            v-model="queryParameters.giftBrought"
            :label="t('guests.list_gift_label')"
            :options="giftOptions"
            :empty-message="t('guests.list_gift_all')"
          />

          <BaseSelect
            id="whatsAppFilter"
            v-model="queryParameters.whatsAppFilter"
            :label="t('guests.list_whatsapp_label')"
            :options="whatsAppFilterOptions"
            :empty-message="t('guests.list_whatsapp_all')"
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
                ? t('guests.list_count_one')
                : t('guests.list_count_other', {
                    n: pagination ? pagination.totalPeopleCount : 0,
                  })
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
            {{ t('guests.list_add') }}
          </BaseButton>
          <BaseButton
            v-if="guests && guests.length > 0"
            btn-type="outline-primary"
            btn-size="md"
            icon="download"
            :disabled="isExporting"
            @click="showExportFormatModal = true"
            >{{
              isExporting ? t('guests.list_exporting') : t('guests.list_export')
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
        {{ t('guests.list_not_found') }}
      </BaseSearchNotFound>

      <!-- No desk: first Time -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-open-mail"
        :title="t('guests.list_empty_title')"
        :description="t('guests.list_empty_desc')"
        :show-button="isAdministrator || isSuperAdministrator"
        :button-label="t('guests.list_empty_button')"
        button-icon="add"
        @action="showFormModal = true"
      />

      <!-- Data -->
      <BaseTable
        v-if="!isRefreshing && !isError && guests.length > 0"
        :summary="t('guests.list_table_summary')"
      >
        <template #thead>
          <tr>
            <th scope="col">{{ t('guests.list_col_number') }}</th>
            <th scope="col">{{ t('guests.list_col_name') }}</th>
            <th scope="col">{{ t('guests.list_col_people') }}</th>
            <th scope="col">{{ t('guests.list_col_desk') }}</th>
            <th scope="col">{{ t('guests.list_col_actions') }}</th>
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
                    ? t('guests.list_absent_tooltip')
                    : guest.arrived
                      ? t('guests.list_cancel_arrival_tooltip')
                      : t('guests.list_confirm_arrival_tooltip')
                "
                @click.prevent="openArrivalAction(guest)"
              >
                {{
                  guest.arrived
                    ? t('guests.list_cancel_arrival_btn')
                    : t('guests.list_arrived')
                }}
              </BaseButton>

              <!-- RSVP -->
              <BaseButton
                btn-size="sm"
                btn-type="outline-primary"
                @click.prevent="openConfirmModal(guest)"
              >
                {{ t('guests.list_rsvp') }}
              </BaseButton>

              <!-- Ver detalhes -->
              <BaseButtonLink
                :to="`/admin/convidados/${guest.id}`"
                btn-type="primary"
                btn-size="sm"
              >
                {{ t('guests.list_view_details') }}
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
