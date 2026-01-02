<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getSupplierService } from '~/services/supplierService';

const toast = useToast();
const nuxtApp = useNuxtApp();
const supplierService = getSupplierService(nuxtApp.$api);

const { eventId } = useEventStore();

const queryParameters = reactive<SupplierParameters>({
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 10,
  eventId: eventId!,
});

const { suppliers, pagination, isRefreshing, isError, refreshSuppliers } =
  await useSuppliersList(queryParameters);

onMounted(async () => {
  await refreshSuppliers({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => debouncedSearch());

watch(queryParameters, () => {
  refreshSuppliers({ force: true });
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
    (suppliers.value?.length ?? 0) === 0 &&
    searchQuery.value === '',
);

// Modais
const showUpsertModal = ref(false);
const showRemoveModal = ref(false);
const selectedSupplier = ref<Supplier | null>(null);

const openCreateModal = () => {
  selectedSupplier.value = null;
  showUpsertModal.value = true;
};

const openEditModal = (s: Supplier) => {
  selectedSupplier.value = s;
  showUpsertModal.value = true;
};

const openRemoveModal = (s: Supplier) => {
  selectedSupplier.value = s;
  showRemoveModal.value = true;
};

const isConfirming = ref<number | null>(null);

const onToggleConfirm = async (s: Supplier) => {
  try {
    isConfirming.value = Number(s.id);

    if (s.isConfirmed) {
      await supplierService.unconfirmSupplier(s.id);
      toast.success('Fornecedor desconfirmado com sucesso.');
    } else {
      await supplierService.confirmSupplier(s.id);
      toast.success('Fornecedor confirmado com sucesso.');
    }

    await refreshSuppliers({ force: true });
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível actualizar o estado do fornecedor.');
  } finally {
    isConfirming.value = null;
  }
};
</script>

<template>
  <section
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Toolbar -->
      <div
        class="flex w-full animate-fadeIn flex-col lg:flex-row lg:justify-between"
      >
        <div class="w-full lg:w-1/2">
          <BaseInput
            id="supplierSearch"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="supplierSearch"
            label="Pesquisa:"
            placeholder="Filtre por nome, papel ou contacto..."
            :readonly="isRefreshing"
          />

          <div v-if="!isRefreshing" class="flex items-center justify-between">
            <div class="my-4 flex items-center space-x-2">
              <icon-funnel
                :font-controlled="false"
                class="text-primary-700 block h-7 w-7"
              />
              <h3 class="text-primary-700 text-2xl font-bold">
                {{
                  (pagination?.totalCount ?? 0) === 1
                    ? '1 Fornecedor'
                    : `${pagination ? pagination.totalCount : 0} Fornecedores`
                }}
              </h3>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 lg:w-1/2 lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:pt-5"
        >
          <BaseButton
            icon="add"
            size="md"
            btn-type="primary"
            @click.prevent="openCreateModal"
          >
            Adicionar fornecedor
          </BaseButton>
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
        v-if="!isFirstTime && (suppliers?.length ?? 0) === 0 && !isRefreshing"
        @fallback="() => refreshSuppliers({ force: true })"
      >
        Infelizmente, não encontramos fornecedores para o filtro aplicado
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-users"
        title="Ainda não registou fornecedores"
        description="Adicione fornecedores para acompanhar os seus contactos e confirmar se o deal está fechado."
        :show-button="true"
        button-label="Adicionar primeiro fornecedor"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (suppliers?.length ?? 0) > 0"
        summary="Tabela sobre a lista de fornecedores do evento"
      >
        <template #thead>
          <tr>
            <th scope="col">Fornecedor</th>
            <th scope="col" class="hidden md:table-cell">Contacto</th>
            <th scope="col">Confirmado</th>
            <th scope="col">Acções</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="s in suppliers" :key="s.id">
            <td>
              <div class="flex-col gap-1">
                <p class="mb-0">{{ s.name }}</p>
                <small class="text-grey-400">{{ s.job_Description }}</small>
              </div>
            </td>

            <td class="hidden md:table-cell">
              {{ s.phone ?? '-' }}
            </td>

            <td>
              <BaseBadge
                :type="s.isConfirmed ? 'success' : 'default'"
                :text="s.isConfirmed ? 'Confirmado' : 'Não confirmado'"
              />
            </td>

            <td>
              <div class="my-2 flex items-center gap-3">
                <button
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  title="Editar"
                  @click.stop="openEditModal(s)"
                >
                  <IconPencil :font-controlled="false" class="size-4" />
                </button>

                <button
                  type="button"
                  class="text-grey-500 transition hover:text-red-600"
                  title="Remover"
                  @click.stop="openRemoveModal(s)"
                >
                  <IconTrash :font-controlled="false" class="size-4" />
                </button>

                <BaseButton
                  btn-type="outline-primary"
                  size="sm"
                  :loading="isConfirming === Number(s.id)"
                  :disabled="isConfirming === Number(s.id)"
                  @click.stop="onToggleConfirm(s)"
                >
                  {{ s.isConfirmed ? 'Desconfirmar' : 'Confirmar' }}
                </BaseButton>
              </div>
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
    <LazySupplierUpsertModal
      :show="showUpsertModal"
      :event-id="eventId!"
      :supplier="selectedSupplier"
      @close-modal="showUpsertModal = false"
      @success="
        showUpsertModal = false;
        refreshSuppliers({ force: true });
      "
    />

    <LazySupplierRemoveModal
      :show="showRemoveModal"
      :event-id="eventId!"
      :supplier="selectedSupplier"
      @close-modal="showRemoveModal = false"
      @success="
        showRemoveModal = false;
        refreshSuppliers({ force: true });
      "
    />
  </section>
</template>
