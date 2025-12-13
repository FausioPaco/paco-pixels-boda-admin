<script setup lang="ts">
import { getChecklistService } from '~/services/checklistService';

const props = defineProps<{
  templateId: number;
  section: ChecklistTemplateSection;
}>();

const emit = defineEmits<{
  (e: 'changed'): void;
}>();

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);

const tasks = computed(() => {
  const list = props.section?.tasks ?? [];
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

// modais
const isSectionFormOpen = ref(false);
const isSectionRemoveOpen = ref(false);

const isTaskFormOpen = ref(false);
const isTaskRemoveOpen = ref(false);

const editingTask = ref<ChecklistTemplateTask | null>(null);
const removingTask = ref<ChecklistTemplateTask | null>(null);

const openEditSection = () => {
  isSectionFormOpen.value = true;
};

const openRemoveSection = () => {
  isSectionRemoveOpen.value = true;
};

const openAddTask = () => {
  editingTask.value = null;
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

// reorder (up/down) – mantém simples igual ao teu
const moveTask = async (taskId: number, direction: 'up' | 'down') => {
  const current = tasks.value.map((t: ChecklistTemplateTask) => ({ ...t }));
  const index = current.findIndex((t) => t.id === taskId);
  if (index === -1) return;

  if (direction === 'up' && index === 0) return;
  if (direction === 'down' && index === current.length - 1) return;

  const newIndex = direction === 'up' ? index - 1 : index + 1;
  const [removed] = current.splice(index, 1);
  if (!removed) return;
  current.splice(newIndex, 0, removed);

  const payload = current.map((t, idx) => ({ id: t.id, order: idx + 1 }));
  await checklistService.reorderTemplateTasks(props.section.id, payload);

  emit('changed');
};
</script>

<template>
  <div class="rounded-xl border p-3">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <div class="text-base">{{ section.title }}</div>
        <div v-if="section.description" class="text-sm opacity-70">
          {{ section.description }}
        </div>

        <div
          v-if="section.default_Offset_Days ?? section.default_Offset_Days"
          class="text-xs opacity-70"
        >
          Offset por defeito:
          {{
            section.default_Offset_Days ?? section.default_Offset_Days
          }}
          dia(s)
        </div>
      </div>

      <ChecklistTemplateSectionMenu
        :section="section"
        @edit="openEditSection"
        @remove="openRemoveSection"
        @changed="$emit('changed')"
      />
    </div>

    <div class="mt-3 flex items-center justify-between">
      <div class="text-sm">Tarefas</div>
      <BaseButton
        label="Adicionar tarefa"
        variant="secondary"
        @click="openAddTask"
      />
    </div>

    <div class="mt-2 flex flex-col gap-2">
      <ChecklistTemplateTaskRow
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @edit="openEditTask(task)"
        @remove="openRemoveTask(task)"
        @move-up="moveTask(task.id, 'up')"
        @move-down="moveTask(task.id, 'down')"
      />
    </div>

    <ChecklistTemplateSectionFormModal
      v-model:open="isSectionFormOpen"
      :template-id="templateId"
      :section="section"
      @saved="$emit('changed')"
    />

    <ChecklistTemplateSectionRemoveModal
      v-model:open="isSectionRemoveOpen"
      :section="section"
      @removed="$emit('changed')"
    />

    <ChecklistTemplateTaskFormModal
      v-model:open="isTaskFormOpen"
      :section-id="section.id"
      :task="editingTask"
      @saved="$emit('changed')"
    />

    <ChecklistTemplateTaskRemoveModal
      v-model:open="isTaskRemoveOpen"
      :task="removingTask"
      @removed="$emit('changed')"
    />
  </div>
</template>
