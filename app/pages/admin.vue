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
  layout: 'dashboard',
});

const { startHeartbeat, stopHeartbeat } = useUserHeartbeat();

onMounted(() => {
  startHeartbeat(60_000);
});

onBeforeUnmount(() => {
  stopHeartbeat();
});
</script>
<template>
  <div>
    <NuxtPage />
  </div>
</template>
