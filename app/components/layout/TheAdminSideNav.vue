<script setup lang="ts">
import { ADMIN_MAIN_LINKS } from '#shared/constants/links';

const route = useRoute();
const { siteConfig } = await useClientConfig();
const eventStore = useEventStore();

const checkActiveClass = (link: string) => {
  if (link === '/admin') {
    return route.fullPath === '/admin';
  }

  if (link.startsWith(link)) {
    return route.fullPath.startsWith(link);
  }

  return false;
};
</script>
<template>
  <aside
    class="bg-primary-50/20 min-h-screen w-[80px] overflow-y-auto shadow-md drop-shadow-sm transition-all duration-300 ease-linear md:min-w-60"
  >
    <!-- Logo -->
    <div class="mb-4 flex items-center justify-center px-3 py-6">
      <NuxtLink to="/admin" class="block no-underline">
        <NuxtImg
          :src="siteConfig.logoPrimarySmall"
          width="537"
          height="185"
          format="webp"
          class="h-auto w-[180px] max-w-full"
          alt="Logotipo"
        />
      </NuxtLink>
    </div>

    <!-- Voltar e Nome do Evento -->
    <div
      class="text-grey-500/50 my-6 hidden justify-center gap-6 md:flex md:flex-col md:items-center"
    >
      <NuxtLink
        to="/eventos"
        class="text-grey-400 hover:text-primary-700 group mr-2 flex cursor-pointer gap-1 text-sm no-underline transition-colors duration-300 ease-in"
      >
        <IconArrowLeft
          :font-controlled="false"
          class="group-hover:text-primary-700 size-[20px] transition-transform group-hover:-translate-x-1"
        />
        <span>Voltar para eventos</span>
      </NuxtLink>

      <!-- Nome do Evento -->
      <div class="text-primary-700 flex items-end gap-2 font-semibold">
        <component
          :is="`icon-${eventStore.selected?.icon}`"
          :font-controlled="false"
          class="text-primary-700 block size-[24px]"
        />
        <span class="block">
          {{ truncate(eventStore.selected?.name ?? '', 16) }}
        </span>
      </div>
    </div>

    <!-- Principal -->
    <ul class="pl-0 md:mt-4">
      <small
        class="text-primary-700/70 mb-4 hidden text-xs font-bold md:block md:pl-2"
        >Gestão do Evento</small
      >
      <div class="flex flex-col gap-y-1">
        <TheAdminSideNavItem
          v-for="item in ADMIN_MAIN_LINKS"
          :key="item.label"
          :item="item"
          :active="checkActiveClass(item.link)"
        />
      </div>
    </ul>
  </aside>
</template>
