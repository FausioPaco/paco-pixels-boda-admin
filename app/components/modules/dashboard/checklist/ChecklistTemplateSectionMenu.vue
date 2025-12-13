<script setup lang="ts">
defineProps<{ section: ChecklistTemplateSection }>();
defineEmits(['edit', 'remove', 'changed']);
</script>

<template>
  <div class="flex items-center gap-2">
    <BaseButton label="Editar" variant="secondary" @click="$emit('edit')" />
    <BaseButton label="Remover" variant="danger" @click="$emit('remove')" />
  </div>
</template>
