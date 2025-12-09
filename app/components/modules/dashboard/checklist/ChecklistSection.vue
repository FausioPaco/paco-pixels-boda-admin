<script setup lang="ts">
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import { getChecklistService } from '~/services/checklistService';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const props = defineProps<{
  section: ChecklistSection;
  eventId: number;
  globalFilters: ChecklistTaskParameters;
}>();

const emit = defineEmits<{
  (e: 'edit-section' | 'remove-section', value: ChecklistSection): void;
  (e: 'task-created' | 'task-updated' | 'task-removed' | 'reordered'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);

const open = ref(true);
const tasksCount = ref<number | undefined>(undefined);

const showTaskModal = ref(false);
const editingTask = ref<ChecklistTask | undefined>(undefined);
const showRemoveModal = ref(false);
const removingTask = ref<ChecklistTask | undefined>(undefined);

const query = reactive<ChecklistTaskParameters>({
  ...props.globalFilters,
  sectionId: props.section.id,
});

const {
  tasks,
  refreshTasks,
  isRefreshing: isRefreshingTasks,
  isError: isErrorTasks,
} = await useChecklistTasksList(query);

const localTasks = ref<ChecklistTask[]>([...tasks.value]);
const draggingId = ref<number | null>(null);

const onReorder = async () => {
  const payload = localTasks.value.map((t, idx) => ({
    id: t.id,
    order: idx + 1,
  }));

  try {
    await checklistService.reorderTasks(props.section.id, payload);
    emit('reordered');
  } catch (e) {
    console.log(e);
    toast.error('Não foi possível reordenar a sua lista.');
    localTasks.value = [...tasks.value];
  }
};

function onDragStart(evt: SortableEvent) {
  const el = evt.item as HTMLElement;
  const id = Number(el?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;
}

function onDragEnd() {
  draggingId.value = null;
  onReorder();
}

async function loadTasks() {
  query.sectionId = props.section.id;
  query.status = props.globalFilters.status;
  query.searchQuery = props.globalFilters.searchQuery;
  query.startDate = props.globalFilters.startDate;
  query.endDate = props.globalFilters.endDate;
  query.has_Indefinite_Date = props.globalFilters.has_Indefinite_Date;
  query.pageNumber = 1;

  await refreshTasks();
  localTasks.value = [...tasks.value];
  tasksCount.value = tasks.value.length;
}

async function toggleOpen() {
  open.value = !open.value;
  if (open.value && !isRefreshingTasks) await loadTasks();
}

async function toggleTask(task: ChecklistTask) {
  // optimistic update
  const before = task.is_Completed;
  task.is_Completed = !task.is_Completed;
  try {
    await checklistService.toggleTaskComplete(task.id);
    refreshTasks();
    emit('task-updated');
  } catch (e) {
    task.is_Completed = before;
    console.log(e);
  }
}

function openEditTask(task: ChecklistTask) {
  editingTask.value = task;
  showTaskModal.value = true;
}

function closeTaskModal() {
  showTaskModal.value = false;
}

async function onTaskSaved() {
  showTaskModal.value = false;
  await loadTasks();
  emit('task-updated');
}

function confirmRemove(task: ChecklistTask) {
  removingTask.value = task;
  showRemoveModal.value = true;
}

async function onRemovedTask() {
  await loadTasks();
  emit('task-removed');
}

watch(props.globalFilters, async () => {
  if (open.value) await loadTasks();
});

// function onTaskCreated() {
//   refreshTasks();
//   emit('task-created');
// }

const getTaskCount = computed(() => {
  return tasksCount.value === 1 ? `1 tarefa` : `${tasksCount.value} tarefas`;
});

onMounted(() => {
  loadTasks();
});
</script>
<template>
  <div class="my-4 animate-fadeIn rounded-2xl border bg-white shadow-md">
    <!-- Cabeçalho da secção -->
    <div class="flex items-center justify-between p-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="text-muted-foreground hover:text-foreground pt-1.5 text-sm"
          @click="toggleOpen"
        >
          <span
            class="inline-block transition-transform duration-500 ease-in-out will-change-transform"
            :class="{ 'rotate-0': open, '-rotate-90': !open }"
          >
            <IconChevronDown :font-controlled="false" class="size-[16px]" />
          </span>
        </button>
        <h2 class="text-base font-semibold">{{ section.title }}</h2>
        <BaseBadge
          v-if="tasksCount"
          :text="getTaskCount"
          :label="`Quantidade ${tasksCount}`"
          type="default"
        />
      </div>
      <ChecklistSectionMenu
        @edit="() => $emit('edit-section', section)"
        @remove="() => $emit('remove-section', section)"
      />
    </div>

    <!-- Lista de tarefas -->
    <transition name="slide-down" mode="out-in">
      <div v-show="open" class="animate-fadeIn px-2 pb-3">
        <!-- Tarefas -->
        <div v-if="tasks.length > 0" class="space-y-1">
          <draggable
            v-model="localTasks"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            @start="onDragStart"
            @end="onDragEnd"
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

                <ChecklistTaskRow
                  :task="element"
                  @toggle="() => toggleTask(element)"
                  @edit="() => openEditTask(element)"
                  @remove="() => confirmRemove(element)"
                />
              </div>
            </template>
          </draggable>
        </div>

        <!-- Sem Tarefas -->
        <LazyBaseFirstEmptyState
          v-if="!isRefreshingTasks && !isErrorTasks && tasks.length === 0"
          icon="icon-menu-checklist"
          :title="`Sem tarefas para ${section.title}`"
          description="Adiciona a tua primeira tarefa nesta secção para começares a organizar o evento."
          button-label="Criar primeira tarefa"
          button-icon="add"
          show-button
          @action="showTaskModal = true"
        />

        <!-- Nova Tarefa -->
        <div v-if="tasks.length > 0" class="flex flex-col gap-2 p-3">
          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="w-fit"
            @click="showTaskModal = true"
          >
            + Nova tarefa
          </BaseButton>
        </div>
      </div>
    </transition>

    <!-- Modal: criar/editar tarefa -->
    <LazyChecklistTaskFormModal
      :show="showTaskModal"
      :task="editingTask"
      :tasks-count="tasks.length"
      :section-id="section.id"
      @close="closeTaskModal"
      @saved="onTaskSaved"
    />

    <!-- Modal: remover tarefa -->
    <LazyChecklistTaskRemoveModal
      :show="showRemoveModal"
      :task="removingTask"
      @close-modal="showRemoveModal = false"
      @success="onRemovedTask"
    />
  </div>
</template>
