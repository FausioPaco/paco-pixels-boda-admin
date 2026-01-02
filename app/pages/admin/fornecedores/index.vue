<script setup lang="ts">
useHead({
  title: 'Gestão de Fornecedores',
  meta: [
    {
      name: 'description',
      content: 'Gestão de Fornecedores',
    },
  ],
});

definePageMeta({
  name: 'Gestão de Fornecedores',
  pageName: 'Gestão de Fornecedores',
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
      <span class="active">Fornecedores</span>
    </BaseBreadcumb>

    <!-- Suppliers  Management -->
    <LazySuppliersManagement />
  </div>
</template>
