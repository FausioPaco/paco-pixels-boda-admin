<script setup lang="ts">
defineProps<{ section: ChecklistTemplateSection }>();
defineEmits(['edit', 'remove', 'changed']);
</script>

<template>
  <div class="flex items-center gap-2">
    <BaseButton btn-type="outline-primary" btn-size="sm" @click="$emit('edit')"
      >Editar</BaseButton
    >

    <BaseButton
      btn-type="outline-primary"
      btn-size="sm"
      @click="$emit('remove')"
      >Remover</BaseButton
    >
  </div>
</template>
