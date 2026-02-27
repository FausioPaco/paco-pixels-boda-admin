<script setup lang="ts">
defineProps<{
  coupleName: string;
  documentTitle: string;
  html: string;
}>();
</script>

<template>
  <div class="w-[595px] bg-white font-sans">
    <div
      class="bg-primary-800 flex items-center justify-between px-4 py-4 text-white"
    >
      <div class="pb-4 font-script text-3xl font-medium leading-none">
        {{ coupleName }}
      </div>

      <div class="font-sans text-xs font-extralight tracking-[5px]">
        {{ documentTitle }}
      </div>
    </div>

    <div class="px-4 py-6">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="prose prose-sm max-w-none" v-html="html"></div>
    </div>
  </div>
</template>
