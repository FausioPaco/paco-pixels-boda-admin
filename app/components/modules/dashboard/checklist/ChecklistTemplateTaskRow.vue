<script setup lang="ts">
import BaseButton from '~/components/ui/BaseButton.vue';

defineProps<{ task: ChecklistTemplateTaskUpdateInput }>();
defineEmits(['edit', 'remove', 'moveUp', 'moveDown']);
</script>

<template>
  <div class="rounded-lg border p-2">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <div class="text-sm">{{ task.title }}</div>
        <div v-if="task.notes" class="text-xs opacity-70">{{ task.notes }}</div>

        <div class="text-xs opacity-70">
          <span v-if="task.has_Indefinite_Date ?? task.has_Indefinite_Date"
            >Data indefinida</span
          >
          <span
            v-else-if="
              (task.default_Offset_Days ?? task.default_Offset_Days) !== null &&
              (task.default_Offset_Days ?? task.default_Offset_Days) !==
                undefined
            "
          >
            Offset:
            {{ task.default_Offset_Days ?? task.default_Offset_Days }} dia(s)
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton label="↑" variant="secondary" @click="$emit('moveUp')" />
        <BaseButton label="↓" variant="secondary" @click="$emit('moveDown')" />
        <BaseButton label="Editar" variant="secondary" @click="$emit('edit')" />
        <BaseButton label="Remover" variant="danger" @click="$emit('remove')" />
      </div>
    </div>
  </div>
</template>
