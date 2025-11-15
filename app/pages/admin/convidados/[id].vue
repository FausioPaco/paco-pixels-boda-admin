<script setup lang="ts">
const route = useRoute();
const { guest } = await useGuest(Number(route.params.id));

useHead({
  title: 'Verificar Convidado',
  meta: [
    {
      name: 'description',
      content: 'Convidados',
    },
  ],
});

definePageMeta({
  title: 'Convidado - Ver Convidado',
  pageName: 'Detalhes do Convidado',
  middleware: ['auth'],
});
</script>

<template>
  <div>
    <!-- Breadcumb -->
    <LazyBaseBreadcumb>
      <NuxtLink to="/admin">Visão Geral</NuxtLink>
      <IconChevronRight
        :font-controlled="false"
        class="text-grey-400 size-[16px]"
      />
      <NuxtLink to="/admin/convidados">Convidados</NuxtLink>
      <IconChevronRight
        :font-controlled="false"
        class="text-grey-400 size-[16px]"
      />
      <span class="active">{{ guest?.name }}</span>
    </LazyBaseBreadcumb>

    <!-- GuestView Management -->
    <LazyGuestsView v-if="guest" :guest="guest" />
  </div>
</template>
