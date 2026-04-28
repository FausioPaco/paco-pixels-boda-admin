<script setup lang="ts">
defineProps<{ section: ChecklistTemplateSection }>();
defineEmits(['edit', 'remove', 'changed']);
const { t } = useI18n();
</script>

<template>
  <div class="flex items-center gap-2">
    <BaseButton btn-type="outline-primary" btn-size="sm" @click="$emit('edit')"
      >{{ t('common.edit') }}</BaseButton
    >

    <BaseButton
      btn-type="outline-primary"
      btn-size="sm"
      @click="$emit('remove')"
      >{{ t('common.remove') }}</BaseButton
    >
  </div>
</template>
