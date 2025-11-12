<script setup lang="ts">
const { siteConfig, themeConfig } = await useClientConfig();
const loadingColor = themeConfig?.colors?.primary?.['500'] || '#000000';

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} - ${siteConfig['title']}`
      : siteConfig['title'];
  },
});
</script>
<template>
  <div>
    <NuxtLoadingIndicator :color="loadingColor" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<style>
.Vue-Toastification__toast {
  @apply rounded;
}

.Vue-Toastification__toast-body {
  @apply font-sans text-sm;
}
</style>
