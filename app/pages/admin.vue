<script setup lang="ts">
useHead({
  title: 'Painel de Administração',
  meta: [
    {
      name: 'description',
      content: 'Painel de Administração',
    },
  ],
});

definePageMeta({
  name: 'Visão Geral',
  pageName: 'Visão Geral',
  middleware: ['require-event'],
});
</script>
<template>
  <div>
    <NuxtLayout name="dashboard">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
