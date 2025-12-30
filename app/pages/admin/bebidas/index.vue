<script setup lang="ts">
useHead({
  title: 'Gestão de Bebidas',
  meta: [
    {
      name: 'description',
      content: 'Gestão de Bebidas',
    },
  ],
});

definePageMeta({
  name: 'Gestão de Bebidas',
  pageName: 'Gestão de Bebidas',
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
      <span class="active">Bebidas</span>
    </BaseBreadcumb>

    <!-- Beverages Management -->
    <LazyBeveragesManagement />
  </div>
</template>
