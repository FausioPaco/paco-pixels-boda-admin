<script setup lang="ts">
useHead({
  title: 'Orçamento',
  meta: [
    {
      name: 'description',
      content: 'Orçamento',
    },
  ],
});

definePageMeta({
  name: 'Orçamento',
  pageName: 'Orçamento',
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
      <span class="active">Orçamento</span>
    </BaseBreadcumb>

    <!-- Budget Management -->
    <LazyBudgetManagement />
  </div>
</template>
