<script setup lang="ts">
defineProps<{
  template: ChecklistTemplateDetail;
}>();
</script>

<template>
  <div class="rounded-xl border p-3">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col">
        <div class="text-base">{{ template.name }}</div>
        <div class="text-sm opacity-70">{{ template.description }}</div>
      </div>

      <div class="text-xs opacity-70">
        <span v-if="template.isDefault">Padrão</span>
        <span v-if="template.isActive === false"> • inactivo</span>
      </div>
    </div>
  </div>
</template>
