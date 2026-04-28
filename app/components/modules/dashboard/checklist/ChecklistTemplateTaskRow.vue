<script setup lang="ts">
defineProps<{ task: ChecklistTemplateTaskUpdateInput }>();
defineEmits(['edit', 'remove', 'moveUp', 'moveDown']);
const { t } = useI18n();
</script>

<template>
  <div class="group w-full rounded-lg border p-2">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <div class="text-sm">{{ task.title }}</div>
        <div v-if="task.notes" class="text-xs opacity-70">{{ task.notes }}</div>

        <div class="text-xs opacity-70">
          <span v-if="task.has_Indefinite_Date ?? task.has_Indefinite_Date"
            >{{ t('checklist.task_indefinite_date') }}</span
          >
          <span
            v-else-if="
              (task.default_Offset_Days ?? task.default_Offset_Days) !== null &&
              (task.default_Offset_Days ?? task.default_Offset_Days) !==
                undefined
            "
          >
            {{ t('checklist.task_offset_short_label') }}
            {{
              task.default_Offset_Days === 1
                ? t('checklist.day_one')
                : t('checklist.day_other', { n: task.default_Offset_Days })
            }}
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
          ><span class="hidden md:inline">{{ t('common.edit') }}</span></BaseButton
        >
        <BaseButton
          btn-type="outline-primary"
          btn-size="sm"
          icon="cancel"
          :icon-size="14"
          only-icon
          @click="$emit('remove')"
          ><span class="hidden md:inline">{{ t('common.remove') }}</span></BaseButton
        >
      </div>
    </div>
  </div>
</template>
