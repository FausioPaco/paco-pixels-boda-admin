<script setup lang="ts">
import { ADMIN_MAIN_LINKS } from '#shared/constants/links';

const route = useRoute();
const { siteConfig } = await useClientConfig();

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
    class="bg-primary-50 min-h-screen w-40 overflow-y-auto shadow-sm transition-all duration-300 ease-linear md:min-w-60"
  >
    <!-- Logo -->
    <div class="mb-4 flex items-center justify-center px-3 py-6">
      <NuxtLink to="/admin" class="block px-2 no-underline">
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

    <!-- Principal -->
    <ul class="pl-0 md:mt-4 md:pl-3">
      <small class="text-primary-700/50 mb-2 hidden text-xs font-bold md:block"
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
