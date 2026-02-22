<script setup lang="ts">
useHead({
  title: 'Gestão de Menu',
  meta: [
    {
      name: 'description',
      content: 'Gestão de Menu',
    },
  ],
});

definePageMeta({
  name: 'Gestão de Menu',
  pageName: 'Gestão de Menu',
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
      <span class="active">Menu</span>
    </BaseBreadcumb>

    <!-- Menu Management -->
    <LazyMenuManagement />
  </div>
</template>
