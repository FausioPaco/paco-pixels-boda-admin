<script setup lang="ts">
interface ICardProps {
  title?: string;
  description?: string;
  backLink?: string | undefined;
}

defineOptions({
  name: 'BaseCard',
});

withDefaults(defineProps<ICardProps>(), {
  title: '',
  description: '',
  backLink: undefined,
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
        <div class="flex items-center gap-2">
          <NuxtLink v-if="backLink" :to="backLink">
            <IconArrowLeft
              :font-controlled="false"
              class="text-grey-400 hover:text-primary-500 size-[24px] transition-colors duration-300"
            />
          </NuxtLink>
          <h2 v-if="title" class="text-xl font-bold text-gray-900 md:text-2xl">
            {{ title }}
          </h2>
        </div>
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
