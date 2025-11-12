<script setup lang="ts">
interface DescriptionItemProps {
  title: string;
  description?: string;
  hideDescription?: boolean;
}

withDefaults(defineProps<DescriptionItemProps>(), {
  hideDescription: false,
  description: '',
});
</script>
<template>
  <div class="mb-2 flex w-full items-center justify-between py-2">
    <p class="text-grey-600 text-sm font-light">{{ title }}</p>
    <p v-if="!hideDescription" class="text-sm font-bold">{{ description }}</p>
    <slot></slot>
  </div>
</template>
