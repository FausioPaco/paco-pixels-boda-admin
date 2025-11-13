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
  middleware: ['auth'],
});
</script>
<template>
  <div>
    <NuxtLayout name="events">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
