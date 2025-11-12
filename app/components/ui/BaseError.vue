<template>
  <div
    class="my-3 flex animate-fadeIn flex-wrap items-center gap-1"
    role="alert"
    aria-invalid="true"
  >
    <icon-warning
      :font-controlled="false"
      class="mr-1 block h-6 w-6 text-red-700"
    ></icon-warning>
    <p
      class="text-label mb-0 flex animate-fadeIn items-center font-medium text-red-700"
    >
      <slot></slot>
    </p>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'AppError',
});
</script>
