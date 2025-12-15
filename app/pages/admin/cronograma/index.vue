<script setup lang="ts">
useHead({
  title: 'Cronograma',
  meta: [
    {
      name: 'description',
      content: 'Cronograma',
    },
  ],
});

definePageMeta({
  name: 'Cronograma',
  pageName: 'Cronograma',
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
      <span class="active">Cronograma</span>
    </BaseBreadcumb>

    <!-- Checklist Management -->
    <LazyChecklistManagement />
  </div>
</template>
