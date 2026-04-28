<script setup lang="ts">
import { getChecklistService } from '~/services/checklistService';
import Draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

type ChecklistPdfTask = {
  id: number;
  title: string;
  notes?: string | null;
  due_Date?: string | null;
  has_Indefinite_Date?: boolean;
  is_Completed: boolean;
};

type ChecklistPdfSection = {
  id: number;
  title: string;
  tasks: ChecklistPdfTask[];
};

type ChecklistPdfPage = {
  sections: ChecklistPdfSection[];
};

const eventStore = useEventStore();
const EVENT_ID = eventStore.eventId!;

const toast = useToast();
const nuxtApp = useNuxtApp();
const pdfPageRefs = ref<HTMLElement[]>([]);
const isGeneratingPdf = ref(false);
const tasksBySection = ref<Record<number, ChecklistTask[]>>({});
const { t, locale } = useI18n();

const statusOptions = computed(() => [
  { id: '', name: t('checklist.filter_all') },
  { id: 'PENDING', name: t('checklist.filter_pending') },
  { id: 'COMPLETED', name: t('checklist.filter_completed') },
  { id: 'OVERDUE', name: t('checklist.filter_overdue') },
]);

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
  await refreshSections({ force: true });
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
    await refreshSections({ force: true });
  } catch (error) {
    console.error('Error reordering sections', error);
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

function onSectionTasksLoaded(payload: {
  sectionId: number;
  tasks: ChecklistTask[];
}) {
  tasksBySection.value = {
    ...tasksBySection.value,
    [payload.sectionId]: payload.tasks,
  };
}

const pdfSections = computed<ChecklistPdfSection[]>(() => {
  return sections.value.map((section) => ({
    id: section.id,
    title: section.title,
    tasks: (tasksBySection.value[section.id] ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      due_Date: task.due_Date,
      has_Indefinite_Date: task.has_Indefinite_Date,
      is_Completed: task.is_Completed,
    })),
  }));
});

const getCoupleName = () => {
  return eventStore!.eventName ?? t('checklist.pdf_couple_fallback');
};

const PDF_PAGE_CAPACITY = 46;
const PDF_SECTION_HEADER_UNITS = 4;
const PDF_EMPTY_SECTION_UNITS = 3;

function estimateTaskUnits(task: ChecklistPdfTask) {
  let units = 4.5;

  const titleLength = task.title?.length ?? 0;
  const notesLength = task.notes?.length ?? 0;

  if (titleLength > 55) units += 1;
  if (titleLength > 110) units += 1;

  if (task.due_Date || task.has_Indefinite_Date) {
    units += 1.2;
  }

  if (notesLength > 0) {
    units += 1.5;
    if (notesLength > 120) units += 1.5;
    if (notesLength > 260) units += 1.5;
    if (notesLength > 420) units += 1.5;
  }

  return units;
}

function setPdfPageRef(
  el: Element | ComponentPublicInstance | null,
  index: number,
) {
  if (!el) return;

  const htmlEl = el as HTMLElement;

  if (htmlEl) {
    pdfPageRefs.value[index] = htmlEl;
  }
}

const pdfPages = computed<ChecklistPdfPage[]>(() => {
  const pages: ChecklistPdfPage[] = [];

  let currentPage: ChecklistPdfPage = { sections: [] };
  let currentUnits = 0;

  const pushCurrentPage = () => {
    if (currentPage.sections.length > 0) {
      pages.push(currentPage);
    }

    currentPage = { sections: [] };
    currentUnits = 0;
  };

  for (const section of pdfSections.value) {
    const tasks = section.tasks ?? [];

    if (!tasks.length) {
      const requiredUnits = PDF_SECTION_HEADER_UNITS + PDF_EMPTY_SECTION_UNITS;

      if (
        currentUnits + requiredUnits > PDF_PAGE_CAPACITY &&
        currentPage.sections.length > 0
      ) {
        pushCurrentPage();
      }

      currentPage.sections.push({
        id: section.id,
        title: section.title,
        tasks: [],
      });

      currentUnits += requiredUnits;
      continue;
    }

    let currentSectionChunk: ChecklistPdfSection = {
      id: section.id,
      title: section.title,
      tasks: [],
    };

    let sectionHasBeenStarted = false;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task) continue;

      const taskUnits = estimateTaskUnits(task);
      const headerUnits = sectionHasBeenStarted ? 0 : PDF_SECTION_HEADER_UNITS;
      const requiredUnits = headerUnits + taskUnits;

      if (
        currentUnits + requiredUnits > PDF_PAGE_CAPACITY &&
        currentPage.sections.length > 0
      ) {
        if (currentSectionChunk.tasks.length > 0) {
          currentPage.sections.push(currentSectionChunk);
          currentSectionChunk = {
            id: section.id,
            title: section.title,
            tasks: [],
          };
        }

        pushCurrentPage();
        sectionHasBeenStarted = false;
      }

      if (!sectionHasBeenStarted) {
        currentUnits += PDF_SECTION_HEADER_UNITS;
        sectionHasBeenStarted = true;
      }

      currentSectionChunk.tasks.push(task);
      currentUnits += taskUnits;

      const isLastTask = i === tasks.length - 1;

      if (isLastTask) {
        currentPage.sections.push(currentSectionChunk);
      }
    }
  }

  if (currentPage.sections.length > 0) {
    pages.push(currentPage);
  }

  return pages;
});

const generatePdf = async () => {
  if (!sections.value.length) {
    toast.info(t('checklist.pdf_no_sections'));
    return;
  }

  const loadedSectionsCount = Object.keys(tasksBySection.value).length;

  if (loadedSectionsCount < sections.value.length) {
    toast.info(t('checklist.pdf_loading'));
    return;
  }

  isGeneratingPdf.value = true;

  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (!pdfPageRefs.value.length) {
      toast.error(t('checklist.pdf_pages_error'));
      return;
    }

    const doc = new nuxtApp.$jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < pdfPageRefs.value.length; i++) {
      const pageEl = pdfPageRefs.value[i];
      if (!pageEl) continue;

      const canvas = await nuxtApp.$html2canvas(pageEl, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        doc.addPage();
      }

      doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    }

    doc.save(`checklist-evento-${eventStore!.eventSlug ?? 'evento'}.pdf`);
  } catch (e) {
    console.error(e);
    toast.error(t('checklist.pdf_error'));
  } finally {
    isGeneratingPdf.value = false;
  }
};

watch(
  pdfPages,
  () => {
    pdfPageRefs.value = [];
  },
  { deep: true },
);
</script>

<template>
  <section
    id="checklistManagement"
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <div class="flex w-full flex-wrap gap-2 md:justify-between">
      <div class="flex flex-wrap items-center gap-4">
        <BaseButton
          btn-type="outline-primary"
          class="w-fit"
          :icon="showFilters ? 'cancel' : 'filter'"
          @click="showFilters = !showFilters"
        >
          {{
            showFilters
              ? t('checklist.hide_filters')
              : t('checklist.show_filters')
          }}
        </BaseButton>

        <BaseButton icon="add" class="w-fit" @click="openCreateSection()">{{
          t('checklist.add_section')
        }}</BaseButton>
      </div>
      <BaseButton
        btn-type="outline-primary"
        icon="download"
        :icon-size="24"
        :disabled="isGeneratingPdf"
        class="w-fit"
        @click="generatePdf"
      >
        {{
          isGeneratingPdf
            ? t('checklist.pdf_generating')
            : t('checklist.pdf_export')
        }}
      </BaseButton>
    </div>

    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Filtros Globais (afetam a listagem de tarefas carregadas por secção) -->
      <div
        v-if="showFilters"
        class="my-4 flex w-full animate-fadeIn flex-col gap-4 md:w-[50%]"
      >
        <BaseSelect
          id="filter-checklist-status"
          v-model="taskFilters.status"
          :options="statusOptions"
          :label="t('checklist.filter_status_label')"
          disable-margins
          disable-empty
        />
        <BaseInput
          id="filter-checklist-searchQuery"
          v-model="searchQuery"
          type="search"
          :placeholder="t('checklist.filter_search_placeholder')"
          :label="t('checklist.filter_search_label')"
          disable-margins
          disable-empty
        />
        <div>
          <label class="mb-1 block text-sm font-medium">{{
            t('checklist.filter_dates_label')
          }}</label>
          <DatePicker
            v-model="rangeDates"
            :range="true"
            :min-date="today"
            uid="datesChecklistFilters"
            :placeholder="t('checklist.filter_dates_placeholder')"
            :locale="String(locale).startsWith('pt') ? 'pt-PT' : 'en-US'"
            :enable-time-picker="false"
            :select-text="t('checklist.date_select')"
            :cancel-text="t('checklist.date_cancel')"
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
        {{ t('checklist.error_message') }}
      </BaseSearchNotFound>

      <!-- No tasks: first Time -->
      <LazyBaseFirstEmptyState
        v-if="!isRefreshing && !isError && sections.length === 0"
        icon="icon-menu-checklist"
        :title="t('checklist.empty_title')"
        :description="t('checklist.empty_description')"
        :button-label="t('checklist.empty_button')"
        button-icon="add"
        show-button
        @action="showSectionModal = true"
      />

      <!-- Secções com lista de tarefas embutida -->
      <div v-if="sections.length > 0" class="space-y-2">
        <Draggable
          v-model="sections"
          item-key="id"
          handle=".drag-handle"
          ghost-class="opacity-50"
          @start="onDragStart"
          @end="onDragEnd(sections)"
        >
          <template #item="{ element }">
            <div class="flex items-start gap-3 py-2" :data-id="element.id">
              <button class="drag-handle cursor-grab pt-7">
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
                @task-created="refreshSections({ force: true })"
                @task-updated="refreshSections({ force: true })"
                @move-up="moveSection(element.id, 'up')"
                @move-down="moveSection(element.id, 'down')"
                @tasks-loaded="onSectionTasksLoaded"
              />
            </div>
          </template>
        </Draggable>

        <BaseAlert
          v-if="!sections.length"
          type="informative"
          :title="t('checklist.no_sections_alert')"
        >
          {{ t('checklist.no_sections_alert_message') }}
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

      <div class="fixed left-[-99999px] top-0 flex flex-col gap-6">
        <div
          v-for="(page, index) in pdfPages"
          :key="`pdf-page-${index}`"
          :ref="(el) => setPdfPageRef(el, index)"
        >
          <ChecklistPdfDocument
            :couple-name="getCoupleName()"
            :document-title="t('checklist.pdf_document_title')"
            :sections="page.sections"
          />
        </div>
      </div>
    </div>
  </section>
</template>
