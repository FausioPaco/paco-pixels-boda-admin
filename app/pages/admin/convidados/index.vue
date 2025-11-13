<script setup lang="ts">
useHead({
  title: 'Convidados',
  meta: [
    {
      name: 'description',
      content: 'Convidados',
    },
  ],
});

definePageMeta({
  name: 'Convidados',
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
      <span class="active">Convidados</span>
    </BaseBreadcumb>

    <!-- Counters -->
    <!-- <LazyGuestsManagement /> -->
  </div>
</template>
