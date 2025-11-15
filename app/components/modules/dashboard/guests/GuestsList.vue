<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useGuestCategories } from '~/composables/useGuestCategories';
import { getGuestService } from '~/services/guestService';

const { eventInitials } = useEventStore();
const queryParameters = reactive<GuestParameters>({
  guestLocalId: undefined,
  categoryId: undefined,
  availability_Type: '',
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 10,
});

const { isAdministrator, isSuperAdministrator } = useAuthStore();
const { guests, pagination, isRefreshing, isError, refreshGuests } =
  await useGuestsList(queryParameters);

const { refreshDesks } = await useDeskOptions();
const { categories, refreshCategories } = await useGuestCategories();

const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const searchQuery = ref<string>('');
const searchId = ref<number | undefined>(undefined);
const showFormModal = ref<boolean>(false);
const showArrivedModal = ref<boolean>(false);
const showCancelArrivedModal = ref<boolean>(false);
const guestSelected = ref<Guest | undefined>(undefined);
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

watch(queryParameters, () => {
  refreshGuests();
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const confirmArrival = (guest: Guest) => {
  guestSelected.value = guest;
  showArrivedModal.value = true;
};

const cancelArrival = (guest: Guest) => {
  guestSelected.value = guest;
  showCancelArrivedModal.value = true;
};

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    guests.value.length === 0 &&
    searchQuery.value === '' &&
    queryParameters.availability_Type === '',
);

const exportGuests = async () => {
  try {
    isExporting.value = true;
    const blob = await guestService.exportGuests(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Convidados_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
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

onMounted(() => {
  refreshCategories({ force: true });
  refreshDesks({ force: true });
  refreshGuests({ force: true });
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
      <!-- Filters & Counter -->
      <div
        class="flex w-full max-w-full animate-fadeIn flex-col md:flex-row md:justify-between"
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
            v-if="categories"
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

          <BaseSelect
            id="avaliability"
            v-model="queryParameters.availability_Type"
            label="Disponibilidade: "
            :options="availabilityOptions"
            empty-message="Todas disponibilidades"
          />

          <!-- Counter & Limit -->
          <div v-if="!isRefreshing" class="flex items-center justify-between">
            <div class="my-4 flex items-center space-x-2">
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
          </div>
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 md:w-1/2 md:flex-row md:items-end md:justify-end md:gap-2 md:pt-5"
        >
          <BaseButton
            v-if="isAdministrator || isSuperAdministrator"
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
            @click="exportGuests"
            >{{ isExporting ? 'A exportar...' : 'Exportar' }}</BaseButton
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
          <tr v-for="guest in guests" :key="guest.id">
            <td>{{ `${eventInitials}-${guest.localId}` }}</td>
            <td>
              <span class="mr-2">{{ guest.name }}</span>
              <BaseBadge
                v-if="guest.arrived"
                label="Chegou?"
                text="Chegou"
                type="success"
              />
            </td>
            <td>{{ guest.people_Count }}</td>
            <td>
              {{ guest.deskName }}
            </td>
            <td class="flex items-center space-x-2">
              <BaseButton
                v-if="!guest.arrived"
                btn-size="sm"
                btn-type="primary"
                @click.prevent="confirmArrival(guest)"
              >
                Confirmar chegada
              </BaseButton>

              <BaseButton
                v-if="guest.arrived"
                btn-type="outline-primary"
                btn-size="sm"
                @click.prevent="cancelArrival(guest)"
              >
                Cancelar chegada
              </BaseButton>

              <BaseButtonLink
                :to="`/admin/convidados/${guest.id}`"
                btn-type="outline-primary"
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
  </section>
</template>
