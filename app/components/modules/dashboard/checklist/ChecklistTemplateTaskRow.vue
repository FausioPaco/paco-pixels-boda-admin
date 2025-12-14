<script setup lang="ts">
import BaseButton from '~/components/ui/BaseButton.vue';

defineProps<{ task: ChecklistTemplateTaskUpdateInput }>();
defineEmits(['edit', 'remove', 'moveUp', 'moveDown']);
</script>

<template>
  <div class="group w-full rounded-lg border p-2">
    <div class="flex flex-wrap items-start justify-between gap-3">
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

      <div class="duration-400 flex animate-fadeIn items-center gap-2">
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
  </div>
</template>
