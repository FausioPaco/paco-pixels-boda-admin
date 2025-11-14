<script setup lang="ts">
const route = useRoute();
const { desk } = await useDesk(Number(route.params.id));

useHead({
  title: 'Verificar Mesa',
  meta: [
    {
      name: 'description',
      content: 'Mesas',
    },
  ],
});

definePageMeta({
  title: 'Mesas - Ver Mesa',
  pageName: 'Detalhes da Mesa',
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
      <NuxtLink to="/admin/mesas">Mesas</NuxtLink>
      <IconChevronRight
        :font-controlled="false"
        class="text-grey-400 size-[16px]"
      />
      <span class="active">{{ desk?.name }}</span>
    </LazyBaseBreadcumb>

    <!-- DeskView Management -->
    <LazyDesksView v-if="desk" :desk="desk" />
  </div>
</template>
