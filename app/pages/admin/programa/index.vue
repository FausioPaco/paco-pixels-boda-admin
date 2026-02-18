<script setup lang="ts">
useHead({
  title: 'Programa do Evento',
  meta: [
    {
      name: 'description',
      content: 'Programa do Evento',
    },
  ],
});

definePageMeta({
  name: 'Programa do Evento',
  pageName: 'Programa do Evento',
  middleware: ['auth'],
});
</script>

<template>
  <div>
    <!-- Breadcumb -->
    <BaseBreadcumb>
      <NuxtLink to="/admin">Visão Geral</NuxtLink>
      <IconChevronRight
        :font-controlled="false"
        class="text-grey-400 size-[16px]"
      />
      <span class="active">Programa do Evento</span>
    </BaseBreadcumb>

    <!-- Event Program Management -->
    <LazyEventProgramManagement />
  </div>
</template>
