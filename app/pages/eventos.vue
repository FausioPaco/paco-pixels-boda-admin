<script setup lang="ts">
const { siteConfig } = await useClientConfig();

useHead({
  title: `Eventos da ${siteConfig.entity}`,
  meta: [
    {
      name: 'description',
      content: `Eventos da ${siteConfig.entity}`,
    },
  ],
});

definePageMeta({
  name: 'Eventos',
  middleware: ['auth', 'administrator'],
  layout: 'events',
});
</script>
<template>
  <div><NuxtPage /></div>
</template>
