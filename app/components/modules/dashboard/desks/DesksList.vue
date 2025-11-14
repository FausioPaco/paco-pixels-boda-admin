<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getDeskService } from '~/services/deskService';

const isExporting = ref<boolean>(false);
const toast = useToast();
const queryParameters = reactive<DeskParameters>({
  availability_Type: '',
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 8,
});

const avaliabiltyList = ref<SelectOption[]>([
  { id: '', name: 'Mostrar todas mesas' },
  { id: 'PLACES_AVALIABLE', name: 'Mostrar mesas com lugares disponíveis' },
  { id: 'PLACES_FILLED', name: 'Mostrar mesas com lugares preenchidos' },
  { id: 'PLACES_EMPTY', name: 'Mostrar mesas sem lugares ocupados' },
]);

const { desks, pagination, isRefreshing, isError, refreshDesks } =
  await useDesksList(queryParameters);

const searchQuery = ref('');
const { isAdministrator, isSuperAdministrator } = useAuthStore();
const showFormModal = ref<boolean>(false);

const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(queryParameters, () => {
  refreshDesks({ force: true });
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    desks.value.length === 0 &&
    searchQuery.value === '' &&
    queryParameters.availability_Type === '',
);

const nuxtApp = useNuxtApp();
const deskService = getDeskService(nuxtApp.$api);

const exportDesks = async () => {
  try {
    isExporting.value = true;
    const blob = await deskService.exportDesks(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Mesas_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    isExporting.value = false;
  } catch (err) {
    console.error('Erro ao exportar as mesas:', err);
    toast.error('Ocorreu um erro ao exportar as mesas');
    isExporting.value = false;
  }
};

onMounted(() => {
  refreshDesks({ force: true });
});
</script>
<template>
  <section
    id="desks"
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Filters & Counter -->
      <div
        class="flex w-full animate-fadeIn flex-col lg:flex-row lg:justify-between"
      >
        <div class="w-full lg:w-1/2">
          <BaseInput
            id="deskName"
            v-model="searchQuery"
            autocomplete="name"
            type="search"
            name="deskName"
            label="Pesquisa:"
            placeholder="Pesquise o nome da mesa"
            :readonly="isRefreshing"
          />
          <BaseSelect
            id="Lugares"
            v-model="queryParameters.availability_Type"
            label="Lugares: "
            :options="avaliabiltyList"
            :disabled="isRefreshing"
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
                  pagination?.totalCount === 1
                    ? '1 Mesa'
                    : `${pagination ? pagination.totalCount : 0} Mesas`
                }}
              </h3>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 lg:w-1/2 lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:pt-5"
        >
          <BaseButton
            v-if="isAdministrator || isSuperAdministrator"
            icon="add"
            size="md"
            btn-type="primary"
            @click.prevent="showFormModal = true"
          >
            Adicionar Mesa
          </BaseButton>
          <BaseButton
            v-if="desks.length > 0"
            btn-type="outline-primary"
            btn-size="md"
            icon="download"
            :disabled="isExporting"
            @click="exportDesks"
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
        v-if="!isFirstTime && desks.length === 0"
        @fallback="refreshDesks"
      >
        Infelizmente, não encontramos mesas para o filtro aplicado
      </BaseSearchNotFound>

      <!-- No desk: first Time -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-menu-table"
        title="Ainda não criou nenhuma mesa"
        description="Crie a sua primeira mesa para começar a organizar os lugares dos seus convidados de forma mais eficiente."
        :show-button="isAdministrator || isSuperAdministrator"
        button-label="Criar primeira mesa"
        button-icon="add"
        @action="showFormModal = true"
      />

      <!-- Data -->
      <BaseTable
        v-if="!isRefreshing && !isError && desks.length > 0"
        summary="Tabela sobre a lista de mesas"
      >
        <template #thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Nº de pessoas</th>
            <th scope="col" class="hidden md:table-cell">Lugares ocupados</th>
            <th scope="col" class="hidden md:table-cell">
              Lugares disponíveis
            </th>
            <th scope="col">Acções</th>
          </tr>
        </template>
        <template #tbody>
          <tr v-for="desk in desks" :key="desk.id">
            <td>{{ desk.name }}</td>
            <td>{{ desk.seats_Limit }}</td>
            <td class="hidden md:table-cell">{{ desk.seats_Filled }}</td>
            <td class="hidden md:table-cell">
              {{ desk.seats_Limit - desk.seats_Filled }}
            </td>
            <td>
              <BaseButtonLink
                :to="`/admin/mesas/${desk.id}`"
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

    <LazyDesksFormModal
      :show="showFormModal"
      @close-modal="showFormModal = false"
      @success="refreshDesks({ force: true })"
    />
  </section>
</template>
