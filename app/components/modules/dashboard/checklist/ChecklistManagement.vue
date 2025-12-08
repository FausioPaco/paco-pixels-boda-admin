<script setup lang="ts">
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
        <div>
          <h2 class="text-grey-800 text-2xl font-bold md:text-3xl">
            Sua Checklist
          </h2>
          <p class="text-grey-400 my-1 text-base">
            Organiza tarefas por secções e aplica filtros para encontrares o que
            precisas
          </p>
        </div>
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
        <ChecklistSection
          v-for="section in sections"
          :key="section.id"
          :section="section"
          :event-id="EVENT_ID"
          :global-filters="taskFilters"
          @edit-section="openEditSection"
          @remove-section="confirmRemoveSection"
          @task-created="refreshSections"
          @task-updated="refreshSections"
        />

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
