<script setup lang="ts">
useHead({
  title: 'Utilizadores',
  meta: [
    {
      name: 'description',
      content: 'Utilizadores',
    },
  ],
});

definePageMeta({
  name: 'Utilizadores',
  pageName: 'Utilizadores',
  middleware: ['auth', 'administrator'],
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
      <span class="active">Utilizadores</span>
    </BaseBreadcumb>

    <!-- Users -->
    <LazyUsersManagement />
  </div>
</template>
