<script setup lang="ts">
import draggable from 'vuedraggable';
import { getChecklistService } from '~/services/checklistService';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const props = defineProps<{
  templateId: number;
  section: ChecklistTemplateSection;
}>();

const emit = defineEmits<{
  (e: 'changed'): void;
}>();

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);

const localTasks = ref<ChecklistTemplateTask[]>([]);

watch(
  () => props.section?.tasks,
  (list) => {
    const safe = list ?? [];
    localTasks.value = [...safe].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  },
  { immediate: true },
);

const onTasksDragEnd = async () => {
  const payload = localTasks.value.map((t, idx) => ({
    id: t.id,
    order: idx + 1,
  }));

  await checklistService.reorderTemplateTasks(props.section.id, payload);
  emit('changed');
};

const draggingId = ref<number | null>(null);
const isSectionFormOpen = ref(false);
const isSectionRemoveOpen = ref(false);

const isTaskFormOpen = ref(false);
const isTaskRemoveOpen = ref(false);

const editingTask = ref<ChecklistTemplateTask | undefined>(undefined);
const removingTask = ref<ChecklistTemplateTask | undefined>(undefined);

const openEditSection = () => {
  isSectionFormOpen.value = true;
};

const openRemoveSection = () => {
  isSectionRemoveOpen.value = true;
};

const openAddTask = () => {
  editingTask.value = undefined;
  isTaskFormOpen.value = true;
};

const openEditTask = (task: ChecklistTemplateTask) => {
  editingTask.value = task;
  isTaskFormOpen.value = true;
};

const openRemoveTask = (task: ChecklistTemplateTask) => {
  removingTask.value = task;
  isTaskRemoveOpen.value = true;
};

const sectionPrazo = computed(() => {
  const v = props.section?.default_Offset_Days;
  return v === null || v === undefined ? null : Number(v);
});

function onDragStart(evt: SortableEvent) {
  const el = evt.item as HTMLElement;
  const id = Number(el?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;
}
</script>

<template>
  <div class="w-full rounded-xl border p-3">
    <div class="mb-8 flex flex-wrap items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <div class="text-base font-semibold md:text-lg">
          {{ section.title }}
        </div>

        <div v-if="section.description" class="text-sm opacity-70">
          {{ section.description }}
        </div>

        <div v-if="sectionPrazo !== null" class="text-xs opacity-70">
          Prazo por defeito: {{ sectionPrazo }} dia(s) antes do evento
        </div>
      </div>

      <ChecklistTemplateSectionMenu
        :section="section"
        @edit="openEditSection"
        @remove="openRemoveSection"
        @changed="$emit('changed')"
      />
    </div>

    <p class="text-grey-400 text-sm font-semibold">Tarefas</p>

    <!-- DRAGGABLE TASKS -->
    <div v-if="localTasks.length > 0" class="animate-fadeIn">
      <draggable
        v-model="localTasks"
        item-key="id"
        handle=".drag-handle"
        class="mt-2 flex flex-col gap-2"
        ghost-class="opacity-50"
        @start="onDragStart"
        @end="onTasksDragEnd"
      >
        <template #item="{ element: task }">
          <div
            class="flex items-start gap-3 py-2 md:items-center"
            :data-id="task.id"
          >
            <button class="drag-handle cursor-grab pt-6 md:pb-4 md:pt-0">
              <IconGripvertical
                :font-controlled="false"
                class="size-5 transition-colors duration-200"
                :class="[
                  draggingId === task.id
                    ? 'text-primary-500 opacity-100'
                    : 'text-grey-500 hover:text-primary-500 opacity-60',
                ]"
              />
            </button>

            <ChecklistTemplateTaskRow
              :task="task"
              @edit="openEditTask(task)"
              @remove="openRemoveTask(task)"
            />
          </div>
        </template>
      </draggable>
      <div class="my-4">
        <BaseButton
          btn-type="primary"
          icon="add"
          btn-size="sm"
          @click="openAddTask"
          >Adicionar tarefa</BaseButton
        >
      </div>
    </div>

    <LazyBaseFirstEmptyState
      v-else
      icon="icon-menu-checklist"
      :title="`Sem tarefas para '${section.title}'`"
      description="Adiciona a primeira tarefa desta secção para este modelo"
      button-label="Criar primeira tarefa"
      button-icon="add"
      show-button
      @action="openAddTask"
    />

    <LazyChecklistTemplateSectionFormModal
      :show="isSectionFormOpen"
      :template-id="templateId"
      :section="section"
      @close="isSectionFormOpen = false"
      @saved="$emit('changed')"
    />

    <LazyChecklistTemplateSectionRemoveModal
      :show="isSectionRemoveOpen"
      :section="section"
      @close-modal="isSectionRemoveOpen = false"
      @removed="$emit('changed')"
    />

    <LazyChecklistTemplateTaskFormModal
      :show="isTaskFormOpen"
      :section-id="section.id"
      :task="editingTask"
      @close="isTaskFormOpen = false"
      @saved="$emit('changed')"
    />

    <LazyChecklistTemplateTaskRemoveModal
      :show="isTaskRemoveOpen"
      :task="removingTask"
      @close-modal="isTaskRemoveOpen = false"
      @removed="$emit('changed')"
    />
  </div>
</template>
