<script setup lang="ts">
interface ICardProps {
  title?: string;
  description?: string;
}

defineOptions({
  name: 'BaseCard',
});

withDefaults(defineProps<ICardProps>(), {
  title: '',
  description: '',
});
</script>
<template>
  <div
    class="border-primary-100 w-full rounded-2xl border bg-white px-4 py-4 shadow-md md:px-5"
  >
    <header
      v-if="title || description"
      class="mb-4 flex flex-col space-y-2 md:flex-row md:items-end md:justify-between md:space-y-0"
    >
      <div class="py-1 md:py-3">
        <h2 v-if="title" class="text-xl font-bold text-gray-900 md:text-2xl">
          {{ title }}
        </h2>
        <p v-if="description" class="text-grey-400 mt-1 text-sm md:text-base">
          {{ description }}
        </p>
        <slot name="header"></slot>
      </div>
      <div class="py-1 md:py-3">
        <slot name="right-content"></slot>
      </div>
    </header>
    <div class="h-full">
      <slot></slot>
    </div>
  </div>
</template>
