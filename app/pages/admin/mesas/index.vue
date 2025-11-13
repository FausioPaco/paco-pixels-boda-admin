<script setup lang="ts">
useHead({
  title: 'Mesas',
  meta: [
    {
      name: 'description',
      content: 'Mesas',
    },
  ],
});

definePageMeta({
  name: 'Mesas',
  pageName: 'Mesas',
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
      <span class="active">Mesas</span>
    </BaseBreadcumb>

    <!-- Counters -->
    <!-- <LazyDesksManagement /> -->
  </div>
</template>
