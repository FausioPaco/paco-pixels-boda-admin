<script setup lang="ts">
useHead({
  title: 'Lista de Presentes',
  meta: [
    {
      name: 'description',
      content: 'Lista de Presentes',
    },
  ],
});

definePageMeta({
  name: 'Lista de Presentes',
  pageName: 'Lista de Presentes',
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
      <span class="active">Lista de Presentes</span>
    </BaseBreadcumb>

    <!-- Event Gift List Management -->
    <LazyEventGiftListManagement />
  </div>
</template>
