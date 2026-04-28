<script setup lang="ts">
defineProps<{
  template: ChecklistTemplateDetail;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="rounded-xl border p-3">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col">
        <div class="text-base">{{ template.name }}</div>
        <div class="text-sm opacity-70">{{ template.description }}</div>
      </div>

      <div class="text-xs opacity-70">
        <span v-if="template.isDefault">{{
          t('checklist.template_default')
        }}</span>
        <span v-if="template.isActive === false">
          {{ t('checklist.template_inactive') }}
        </span>
      </div>
    </div>
  </div>
</template>
