<script setup lang="ts">
import { getChecklistService } from '~/services/checklistService';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const eventStore = useEventStore();
const EVENT_ID = eventStore.eventId!;

const statusOptions = [
  { id: '', name: 'Todos' },
  { id: 'PENDING', name: 'Pendentes' },
  { id: 'COMPLETED', name: 'Concluídas' },
  { id: 'OVERDUE', name: 'Em atraso' },
];

// Filtros globais
const sectionFilters = reactive<ChecklistSectionParameters>({
  eventId: EVENT_ID,
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 100,
});

// Secções (pagina única: vamos buscar muitas, mas podes ajustar pageSize se tiveres centenas)
const { sections, refreshSections, isRefreshing, isError } =
  await useChecklistSectionsList({
    eventId: EVENT_ID,
    searchQuery: '',
    startDate: '',
    endDate: '',
    pageNumber: 1,
    pageSize: 50,
  } as ChecklistSectionParameters);

const showFilters = ref(false);

// Modal secção
const showSectionModal = ref(false);
const editingSection = ref<ChecklistSection | null>(null);

// Remover secção
const showRemoveModal = ref(false);
const removingSection = ref<ChecklistSection | null>(null);
const searchQuery = ref('');

const rangeDates = ref<[Date | null, Date | null] | null>(null);
const today = new Date();
today.setHours(0, 0, 0, 0);

const taskFilters = reactive<ChecklistTaskParameters>({
  eventId: EVENT_ID,
  sectionId: undefined,
  status: '',
  searchQuery: sectionFilters.searchQuery,
  startDate: sectionFilters.startDate,
  endDate: sectionFilters.endDate,
  has_Indefinite_Date: undefined,
  pageNumber: 1,
  pageSize: 100,
});

const debouncedSearch = useDebounceFn(() => {
  taskFilters.searchQuery = searchQuery.value;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

function openCreateSection() {
  editingSection.value = null;
  showSectionModal.value = true;
}

function openEditSection(section: ChecklistSection) {
  editingSection.value = section;
  showSectionModal.value = true;
}

function closeSectionModal() {
  showSectionModal.value = false;
}

async function onSectionSaved() {
  showSectionModal.value = false;
  await refreshSections();
}

function confirmRemoveSection(section: ChecklistSection) {
  removingSection.value = section;
  showRemoveModal.value = true;
}

async function onSectionRemoved() {
  showRemoveModal.value = false;
  removingSection.value = null;
  await refreshSections();
}

const handleClearDate = () => {
  taskFilters.startDate = undefined;
  taskFilters.endDate = undefined;
};

const handleCloseDateInput = () => {
  if (rangeDates.value) {
    taskFilters.startDate = formatDDMMYYYY(rangeDates.value[0]);
    taskFilters.endDate = formatDDMMYYYY(rangeDates.value[1]);
  }
};

watch(rangeDates, (val) => {
  const [start, end] = val ?? [null, null];
  taskFilters.startDate = formatDDMMYYYY(start);
  taskFilters.endDate = formatDDMMYYYY(end);
});

// Reordenar secção
const draggingId = ref<number | null>(null);
const isReorderingSections = ref(false);
const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);

async function applySectionsReorder(newOrder: ChecklistSection[]) {
  if (!EVENT_ID) return;

  isReorderingSections.value = true;

  try {
    // actualiza a lista local
    sections.value = newOrder;

    const payload: SectionOrderUpdateInput[] = newOrder.map(
      (section, index) => ({
        id: section.id,
        order: index + 1,
      }),
    );

    await checklistService.reorderSections(EVENT_ID, payload);
    await refreshSections();
  } catch (error) {
    console.error('Erro ao reordenar secções', error);
    // opcional: mostrar toast
  } finally {
    isReorderingSections.value = false;
  }
}

function moveSection(sectionId: number, direction: 'up' | 'down') {
  const current = [...sections.value];
  const index = current.findIndex((s) => s.id === sectionId);
  if (index === -1) return;

  if (direction === 'up' && index === 0) return;
  if (direction === 'down' && index === current.length - 1) return;

  const newIndex = direction === 'up' ? index - 1 : index + 1;

  const removed = current[index];
  if (!removed) return;

  // remove da posição original
  current.splice(index, 1);

  // insere na nova posição
  current.splice(newIndex, 0, removed);

  applySectionsReorder(current);
}

function onDragStart(evt: SortableEvent) {
  const el = evt.item as HTMLElement;
  const id = Number(el?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;
}

function onDragEnd(newOrder: ChecklistSection[]) {
  draggingId.value = null;
  applySectionsReorder(newOrder);
}
</script>

<template>
  <section
    id="checklistManagement"
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch md:min-w-[45vw] lg:min-w-[70vw] xl:min-w-[75vw]"
    >
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <BaseButton
            btn-type="outline-primary"
            class="w-fit"
            :icon="showFilters ? 'cancel' : 'filter'"
            @click="showFilters = !showFilters"
          >
            {{ showFilters ? 'Esconder filtros' : 'Mostrar filtros' }}
          </BaseButton>

          <BaseButton icon="add" class="w-fit" @click="openCreateSection()"
            >Adicionar secção</BaseButton
          >
        </div>
      </div>

      <!-- Filtros Globais (afetam a listagem de tarefas carregadas por secção) -->
      <div
        v-if="showFilters"
        class="my-4 flex w-full animate-fadeIn flex-col gap-4 md:w-[50%]"
      >
        <BaseSelect
          id="filter-checklist-status"
          v-model="taskFilters.status"
          :options="statusOptions"
          label="Estado:"
          disable-margins
        />
        <BaseInput
          id="filter-checklist-searchQuery"
          v-model="searchQuery"
          type="search"
          placeholder="Pesquisar por título/nota…"
          label="Pesquisa:"
          disable-margins
        />
        <div>
          <label class="mb-1 block text-sm font-medium">Datas:</label>
          <DatePicker
            v-model="rangeDates"
            :range="true"
            :min-date="today"
            uid="datesChecklistFilters"
            placeholder="Filtre as tarefas pela data de conclusão"
            locale="pt-PT"
            :enable-time-picker="false"
            select-text="Selecionar"
            cancel-text="Cancelar"
            format="dd/MM/yyyy"
            :disabled="isRefreshing"
            @closed="handleCloseDateInput"
            @cleared="handleClearDate"
          />
        </div>
      </div>

      <!-- Loading -->
      <BaseLoading
        v-if="isRefreshing"
        size="lg"
        orientation="vertical"
        class="block md:hidden"
      />

      <!-- Error -->
      <BaseSearchNotFound v-if="isError" @fallback="refreshSections">
        Infelizmente, ocorreu um erro ao buscar as tarefas, contacte-nos para
        resolução do problema
      </BaseSearchNotFound>

      <!-- No tasks: first Time -->
      <LazyBaseFirstEmptyState
        v-if="!isRefreshing && !isError && sections.length === 0"
        icon="icon-menu-checklist"
        title="Ainda não criou nenhuma tarefa"
        description="Crie a sua primeira secção para começar a organizar as tarefas devem ser cumpridas no evento."
        button-label="Criar secção"
        button-icon="add"
        show-button
        @action="showSectionModal = true"
      />

      <!-- Secções com lista de tarefas embutida -->
      <div v-if="sections.length > 0" class="space-y-6">
        <draggable
          v-model="sections"
          item-key="id"
          handle=".drag-handle"
          ghost-class="opacity-50"
          @start="onDragStart"
          @end="onDragEnd(sections)"
        >
          <template #item="{ element }">
            <div
              class="flex items-start gap-3 py-2 md:items-center"
              :data-id="element.id"
            >
              <button class="drag-handle cursor-grab pt-6 md:pb-4 md:pt-0">
                <IconGripvertical
                  :font-controlled="false"
                  class="size-5 transition-colors duration-200"
                  :class="[
                    draggingId === element.id
                      ? 'text-primary-500 opacity-100'
                      : 'text-grey-500 hover:text-primary-500 opacity-60',
                  ]"
                />
              </button>
              <ChecklistSection
                :section="element"
                :event-id="EVENT_ID"
                :global-filters="taskFilters"
                @edit-section="openEditSection"
                @remove-section="confirmRemoveSection"
                @task-created="refreshSections"
                @task-updated="refreshSections"
                @move-up="moveSection(element.id, 'up')"
                @move-down="moveSection(element.id, 'down')"
              />
            </div>
          </template>
        </draggable>

        <BaseAlert
          v-if="!sections.length"
          type="informative"
          title="Ainda sem secções"
        >
          Cria a tua primeira secção para começares o checklist.
        </BaseAlert>
      </div>

      <!-- Modal: criar/editar secção usando BaseModal -->
      <LazyChecklistSectionFormModal
        :show="showSectionModal"
        :section="editingSection"
        :event-id="EVENT_ID"
        @close="closeSectionModal"
        @saved="onSectionSaved"
      />

      <!-- Remove Section -->
      <LazyChecklistSectionRemoveModal
        :show="showRemoveModal"
        :section="removingSection || undefined"
        @close-modal="showRemoveModal = false"
        @success="onSectionRemoved"
      />
    </div>
  </section>
</template>
