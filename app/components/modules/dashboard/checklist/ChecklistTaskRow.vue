<script setup lang="ts">
const props = defineProps<{ task: ChecklistTask }>();

defineEmits(['toggle', 'edit', 'remove']);

const isOverdue = computed(() => {
  if (props.task.is_Completed) return false;
  if (!props.task.due_Date || props.task.has_Indefinite_Date) return false;
  return new Date(props.task.due_Date) < new Date();
});
</script>

<template>
  <div
    class="group flex w-full flex-col gap-4 rounded-xl px-3 py-2 md:flex-row md:items-center md:justify-between"
  >
    <div class="flex w-full items-start gap-3">
      <BaseCheckbox
        :id="`task-${task.id}`"
        :model-value="task.is_Completed"
        @update:model-value="$emit('toggle')"
      />

      <!-- Task Content -->
      <div>
        <div class="flex items-center gap-2">
          <h3
            class="text-grey-800 text-base font-medium"
            :class="{ 'text-muted-foreground line-through': task.is_Completed }"
          >
            {{ task.title }}
          </h3>
          <BaseBadge
            v-if="isOverdue"
            label="Em atraso"
            text="Em atraso"
            type="error"
          />
        </div>
        <p v-if="task.notes" class="text-grey-400 mt-1 text-sm">
          {{ task.notes }}
        </p>
        <p
          class="text-grey-400 mt-2 flex items-center gap-1 text-xs font-medium"
        >
          <IconCalendar :font-controlled="false" class="size-[14px]" />
          <span v-if="task.due_Date && !task.has_Indefinite_Date"
            >Limite: {{ formatDate(task.due_Date) }}</span
          >
          <span v-else>Sem data definida</span>
        </p>
      </div>
    </div>

    <!-- Task Actions -->
    <div
      class="duration-400 flex animate-fadeIn items-center gap-2 transition-all ease-in md:hidden md:group-hover:flex"
    >
      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        icon="pencil"
        :icon-size="14"
        only-icon
        @click="$emit('edit')"
        ><span class="hidden md:inline">Editar</span></BaseButton
      >
      <BaseButton
        btn-type="outline-primary"
        btn-size="sm"
        icon="cancel"
        :icon-size="14"
        only-icon
        @click="$emit('remove')"
        ><span class="hidden md:inline">Remover</span></BaseButton
      >
    </div>
  </div>
</template>
