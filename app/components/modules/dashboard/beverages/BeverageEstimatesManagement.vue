<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

const props = defineProps<{
  moduleStatus: EventBeverageStatus;
}>();

const toast = useToast();
const { eventId } = useEventStore();

const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isEventDayMode = computed(() => props.moduleStatus === 'EventDay');
const isClosed = computed(() => props.moduleStatus === 'Closed');
const isBlocked = computed(() => isEventDayMode.value || isClosed.value);
const showEventDayAlert = ref(isBlocked.value);

const queryParameters = reactive<EventBeverageEstimatesParameters>({
  eventId: eventId!,
  categoryId: undefined,
  includeConfirmed: true,
  searchQuery: '',
  pageNumber: 1,
  pageSize: 8,
});

const { estimates, pagination, isRefreshing, isError, refreshEstimates } =
  await useEventBeverageEstimatesList(queryParameters);

const { categories, refreshCategories } = await useBeverageCategoriesList({
  parameters: { pageNumber: 1, pageSize: 200, searchQuery: '' },
});

onMounted(async () => {
  await refreshCategories?.({ force: true });
  await refreshEstimates({ force: true });
});

watch(queryParameters, () => {
  refreshEstimates({ force: true });
});

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => debouncedSearch());

const categoryOptions = computed<SelectOption[]>(() => {
  const items = categories?.value ?? [];
  return [
    { id: '', name: 'Mostrar todas categorias' },
    ...items.map((c) => ({ id: String(c.id), name: c.name })),
  ];
});

const onCategoryChanged = (val: string) => {
  queryParameters.categoryId = val ? Number(val) : null;
  queryParameters.pageNumber = 1;
};

const showConfirmedToggle = computed({
  get: () => !!queryParameters.includeConfirmed,
  set: (v: boolean) => {
    queryParameters.includeConfirmed = v;
    queryParameters.pageNumber = 1;
  },
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
    (estimates.value?.length ?? 0) === 0 &&
    searchQuery.value === '' &&
    !queryParameters.categoryId &&
    !queryParameters.includeConfirmed,
);

// Selection (checkboxes)
const selectedIds = ref<number[]>([]);

const allSelectedOnPage = computed(() => {
  const ids = (estimates.value ?? []).map((x) => x.id);
  if (ids.length === 0) return false;
  return ids.every((id: number) => selectedIds.value.includes(id));
});

const toggleSelectAllOnPage = (checked: boolean) => {
  const ids = (estimates.value ?? []).map((x) => x.id);
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((id) => !ids.includes(id));
    return;
  }
  const set = new Set(selectedIds.value);
  ids.forEach((id: number) => set.add(id));
  selectedIds.value = Array.from(set);
};

const toggleSelected = (id: number, checked: boolean) => {
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
    return;
  }
  if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
};

watch(
  () => queryParameters.pageNumber,
  () => {
    // mantém selecções globais, mas podes escolher limpar se preferires
  },
);

// Modais (vamos reutilizar o teu padrão)
const showUpsertModal = ref(false);
const showRemoveModal = ref(false);

const selectedEstimate = ref<EventBeverageEstimate | null>(null);

const openCreateModal = () => {
  selectedEstimate.value = null;
  showUpsertModal.value = true;
};

const openEditModal = (item: EventBeverageEstimate) => {
  selectedEstimate.value = item;
  showUpsertModal.value = true;
};

const openRemoveModal = (item: EventBeverageEstimate) => {
  selectedEstimate.value = item;
  showRemoveModal.value = true;
};

// Confirm/Unconfirm actions
const isBulkWorking = ref(false);

const isExporting = ref(false);

const exportEstimates = async () => {
  try {
    isExporting.value = true;

    const blob =
      await beverageService.exportEventBeverageEstimates(queryParameters);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `Estimativas_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, '')}.xlsx`;

    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao exportar as estimativas:', err);
    toast.error('Ocorreu um erro ao exportar as estimativas');
  } finally {
    isExporting.value = false;
  }
};

const confirmSelected = async () => {
  if (isBlocked.value) return;
  if ((selectedIds.value?.length ?? 0) === 0) {
    toast.info('Seleccione pelo menos uma estimativa.');
    return;
  }

  try {
    isBulkWorking.value = true;
    const res = await beverageService.confirmSelectedEventBeverageEstimates(
      eventId!,
      { estimateIds: selectedIds.value },
    );

    toast.success(
      res.createdCount === 1
        ? '1 estimativa confirmada.'
        : `${res.createdCount} estimativas confirmadas.`,
    );

    // após confirmar, pode acontecer que desapareçam (se includeConfirmed=false)
    selectedIds.value = [];
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível confirmar as estimativas seleccionadas.');
  } finally {
    isBulkWorking.value = false;
  }
};

const unconfirmSelected = async () => {
  if (isBlocked.value) return;
  if ((selectedIds.value?.length ?? 0) === 0) {
    toast.info('Seleccione pelo menos uma estimativa.');
    return;
  }

  try {
    isBulkWorking.value = true;
    const res = await beverageService.unconfirmSelectedEventBeverageEstimates(
      eventId!,
      { estimateIds: selectedIds.value },
    );

    if (res.unconfirmedCount > 0) {
      toast.success(
        res.unconfirmedCount === 1
          ? '1 estimativa desconfirmada.'
          : `${res.unconfirmedCount} estimativas desconfirmadas.`,
      );
    } else {
      toast.info('Nenhuma estimativa foi desconfirmada.');
    }

    selectedIds.value = [];
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível desconfirmar as estimativas seleccionadas.');
  } finally {
    isBulkWorking.value = false;
  }
};

const confirmSingle = async (item: EventBeverageEstimate) => {
  if (isBlocked.value) return;

  try {
    isBulkWorking.value = true;
    const res = await beverageService.confirmSelectedEventBeverageEstimates(
      eventId!,
      { estimateIds: [item.id] },
    );

    if (res.createdCount > 0) toast.success('Estimativa confirmada.');
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível confirmar a estimativa.');
  } finally {
    isBulkWorking.value = false;
  }
};

const unconfirmSingle = async (item: EventBeverageEstimate) => {
  if (isBlocked.value) return;

  try {
    isBulkWorking.value = true;
    await beverageService.unconfirmEventBeverageEstimate(eventId!, item.id);
    toast.success('Estimativa desconfirmada.');
    await refreshEstimates({ force: true });
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível desconfirmar a estimativa.');
  } finally {
    isBulkWorking.value = false;
  }
};

watch(isBlocked, (newVal) => {
  if (newVal) {
    showEventDayAlert.value = true;
  } else {
    showEventDayAlert.value = false;
  }
});
</script>

<template>
  <section
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Aviso (quando bloqueado) -->
      <BaseAlert
        v-if="isBlocked"
        :show="showEventDayAlert"
        title="As estimativas estão em modo apenas leitura."
        message="Para editar/confirmar/desconfirmar estimativas, altere o modo do módulo para 'Planeamento'."
        type="informative"
        @close="showEventDayAlert = !showEventDayAlert"
      />

      <!-- Toolbar -->
      <div
        class="flex w-full animate-fadeIn flex-col lg:flex-row lg:justify-between"
      >
        <div class="w-full lg:w-1/2">
          <BaseInput
            id="estimateSearch"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="estimateSearch"
            label="Pesquisa:"
            placeholder="Filtre categorias ou itens..."
            :readonly="isRefreshing"
          />

          <BaseSelect
            id="estimateCategory"
            label="Categoria:"
            :options="categoryOptions"
            :disabled="isRefreshing"
            :model-value="
              queryParameters.categoryId
                ? String(queryParameters.categoryId)
                : ''
            "
            disable-empty
            @update:model-value="onCategoryChanged"
          />

          <div class="mt-2 flex items-center justify-between">
            <BaseCheckbox
              id="toggleConfirmed"
              :model-value="showConfirmedToggle"
              label="Mostrar confirmadas"
              :disabled="isRefreshing"
              @update:model-value="(v: boolean) => (showConfirmedToggle = v)"
            />
          </div>

          <div v-if="!isRefreshing" class="flex items-center justify-between">
            <div class="my-4 flex items-center space-x-2">
              <icon-funnel
                :font-controlled="false"
                class="text-primary-700 block h-7 w-7"
              />
              <h3 class="text-primary-700 text-2xl font-bold">
                {{
                  (pagination?.totalCount ?? 0) === 1
                    ? '1 Estimativa'
                    : `${pagination ? pagination.totalCount : 0} Estimativas`
                }}
              </h3>
            </div>
          </div>

          <BaseButton
            v-if="(estimates?.length ?? 0) > 0"
            btn-type="outline-primary"
            btn-size="sm"
            icon="download"
            :disabled="isRefreshing || isExporting"
            class="my-4 w-fit"
            @click="exportEstimates"
          >
            {{ isExporting ? 'A exportar...' : 'Exportar estimativas' }}
          </BaseButton>
        </div>

        <div
          class="mt-4 flex w-full flex-col gap-4 lg:mt-2 lg:max-w-[60%] lg:items-end"
        >
          <BaseButton
            icon="add"
            btn-size="sm"
            btn-type="primary"
            :disabled="isBlocked || isRefreshing"
            class="w-fit"
            @click.prevent="openCreateModal"
          >
            Adicionar estimativa
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="double-check"
            :disabled="
              isBlocked ||
              isRefreshing ||
              isBulkWorking ||
              (selectedIds?.length ?? 0) === 0
            "
            class="w-fit"
            :loading="isBulkWorking"
            @click="confirmSelected"
          >
            Confirmar seleccionadas
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="refresh"
            :disabled="
              isBlocked ||
              isRefreshing ||
              isBulkWorking ||
              (selectedIds?.length ?? 0) === 0
            "
            :loading="isBulkWorking"
            class="w-fit"
            @click="unconfirmSelected"
          >
            Desconfirmar seleccionadas
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
        v-if="!isFirstTime && (estimates?.length ?? 0) === 0 && !isRefreshing"
        @fallback="refreshEstimates({ force: true })"
      >
        Infelizmente, não encontramos estimativas para o filtro aplicado
      </BaseSearchNotFound>

      <!-- First empty state -->
      <LazyBaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-beverage"
        title="Ainda não criou estimativas"
        description="Adicione estimativas para depois confirmar e gerar as bebidas no inventário."
        :show-button="true"
        button-label="Adicionar primeira estimativa"
        button-icon="add"
        @action="openCreateModal"
      />

      <!-- Data table -->
      <BaseTable
        v-if="!isRefreshing && !isError && (estimates?.length ?? 0) > 0"
        summary="Tabela sobre a lista de estimativas do evento"
      >
        <template #thead>
          <tr>
            <th scope="col" class="w-[40px]">
              <BaseCheckbox
                id="selectAllEstimates"
                :model-value="allSelectedOnPage"
                :disabled="isRefreshing"
                @update:model-value="(v: boolean) => toggleSelectAllOnPage(v)"
              />
            </th>
            <th scope="col">Bebida</th>
            <th scope="col" class="hidden md:table-cell">Por caixa</th>
            <th scope="col" class="hidden md:table-cell">Caixas</th>
            <th scope="col">Qtd.</th>
            <th scope="col">Mínimo</th>
            <th scope="col">Estado</th>
            <th scope="col">Acções</th>
          </tr>
        </template>

        <template #tbody>
          <tr v-for="item in estimates" :key="item.id">
            <td>
              <BaseCheckbox
                :id="`sel-${item.id}`"
                :model-value="selectedIds.includes(item.id)"
                :disabled="isRefreshing"
                @update:model-value="(v: boolean) => toggleSelected(item.id, v)"
              />
            </td>

            <td>
              <div class="flex-col gap-1">
                <p class="mb-0">{{ item.name }}</p>
                <small class="text-grey-400">{{
                  item.beverageCategoryName
                }}</small>
              </div>
            </td>

            <td class="hidden md:table-cell">{{ item.unitsPerBox ?? '-' }}</td>
            <td class="hidden md:table-cell">{{ item.boxesQty ?? '-' }}</td>
            <td>{{ item.initialUnits ?? 0 }}</td>
            <td>{{ item.minimumUnits ?? 0 }}</td>

            <td>
              <BaseBadge
                :type="item.confirmed ? 'success' : 'default'"
                :text="item.confirmed ? 'Confirmada' : 'Por confirmar'"
                :icon="item.confirmed ? 'checkmark' : undefined"
              />
            </td>

            <td>
              <div class="my-2 flex items-center gap-3">
                <button
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  title="Editar"
                  :disabled="isBlocked || item.confirmed"
                  @click.stop="openEditModal(item)"
                >
                  <IconPencil :font-controlled="false" class="size-4" />
                </button>

                <button
                  type="button"
                  class="text-grey-500 transition hover:text-red-600"
                  title="Remover"
                  :disabled="isBlocked"
                  @click.stop="openRemoveModal(item)"
                >
                  <IconTrash :font-controlled="false" class="size-4" />
                </button>

                <button
                  v-if="!item.confirmed"
                  type="button"
                  class="text-grey-500 hover:text-success-600 transition"
                  title="Confirmar"
                  :disabled="isBlocked || isBulkWorking"
                  @click.stop="confirmSingle(item)"
                >
                  <IconCheckmark :font-controlled="false" class="size-4" />
                </button>

                <button
                  v-else
                  type="button"
                  class="text-grey-500 hover:text-primary-700 transition"
                  title="Desconfirmar (rollback)"
                  :disabled="isBlocked || isBulkWorking"
                  @click.stop="unconfirmSingle(item)"
                >
                  <IconRefresh :font-controlled="false" class="size-4" />
                </button>
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
    <LazyBeverageEstimateUpsertModal
      :show="showUpsertModal"
      :event-id="eventId!"
      :estimate="selectedEstimate"
      :module-status="props.moduleStatus"
      @close-modal="showUpsertModal = false"
      @success="
        showUpsertModal = false;
        refreshEstimates({ force: true });
      "
    />

    <LazyBeverageEstimateRemoveModal
      :show="showRemoveModal"
      :event-id="eventId!"
      :estimate="selectedEstimate"
      :module-status="props.moduleStatus"
      @close-modal="showRemoveModal = false"
      @success="
        showRemoveModal = false;
        refreshEstimates({ force: true });
      "
    />
  </section>
</template>
