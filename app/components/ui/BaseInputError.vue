<script lang="ts" setup>
defineOptions({
  name: 'BaseInputError',
});

defineProps<{
  id: string | number;
}>();
</script>
<template>
  <p
    :id="`${id}-error`"
    aria-live="assertive"
    class="text-label mt-2 flex animate-fadeIn items-center truncate text-sm font-medium text-danger-700"
  >
    <IconWarning
      :font-controlled="false"
      class="mr-1 h-4 w-4 text-danger-700"
    />
    <slot></slot>
  </p>
</template>
