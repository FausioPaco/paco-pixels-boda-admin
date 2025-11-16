<script setup lang="ts">
const { siteConfig } = await useClientConfig();

useHead({
  title: `QRCodes da ${siteConfig.entity}`,
  meta: [
    {
      name: 'description',
      content: `QRCodes da ${siteConfig.entity}`,
    },
  ],
});

definePageMeta({
  name: 'QRCodes',
  // middleware: ['auth'],
});
</script>
<template>
  <div>
    <NuxtPage />
  </div>
</template>
