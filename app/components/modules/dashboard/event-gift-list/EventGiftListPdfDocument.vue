<script setup lang="ts">
defineProps<{
  coupleName: string;
  documentTitle: string;
  html: string;
}>();
</script>

<template>
  <div class="w-[595px] bg-white p-10 font-sans">
    <div class="mb-6">
      <p class="text-grey-500 text-xs uppercase tracking-[0.22em]">
        {{ coupleName }}
      </p>
      <h1 class="text-grey-900 mt-1 text-2xl font-semibold">
        {{ documentTitle }}
      </h1>
    </div>

    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prose prose-sm max-w-none" v-html="html"></div>
  </div>
</template>
