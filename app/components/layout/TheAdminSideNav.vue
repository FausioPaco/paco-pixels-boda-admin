<script setup lang="ts">
import {
  ADMIN_CONFIGURATION_LINKS,
  ADMIN_MAIN_LINKS,
} from '#shared/constants/links';
import { isMultiEventStaffUser } from '~~/shared/constants/roles';

const route = useRoute();
const { siteConfig } = await useClientConfig();
const eventStore = useEventStore();
const authStore = useAuthStore();

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
    class="bg-primary-50/20 min-h-screen w-[90px] animate-fadeIn overflow-y-auto shadow-md drop-shadow-sm transition-all duration-300 ease-linear lg:min-w-60"
    :class="eventStore.eventModeView ? 'hidden' : undefined"
  >
    <!-- Logo -->
    <div class="mb-4 flex items-center justify-center px-1 py-6 md:px-3">
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
      class="text-grey-500/50 my-6 hidden justify-center gap-6 lg:flex lg:flex-col lg:items-center"
    >
      <NuxtLink
        v-if="isMultiEventStaffUser(authStore.user?.roleName)"
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
          class="text-primary-700 block size-[16px] md:size-[24px]"
        />
        <span class="block">
          {{ truncate(eventStore.selected?.name ?? '', 16) }}
        </span>
      </div>
    </div>

    <!-- Principal -->
    <ul class="pl-0 lg:mt-4">
      <small
        class="text-primary-700/70 mb-4 hidden text-xs font-bold lg:block lg:pl-2"
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

    <!-- Conteúdo e Experiência -->
    <ul class="pl-0 lg:mt-4">
      <small
        class="text-primary-700/70 mb-4 hidden text-xs font-bold lg:block lg:pl-2"
        >Conteúdo e Experiência</small
      >
      <div class="flex flex-col gap-y-1">
        <TheAdminSideNavItem
          v-for="item in ADMIN_CONFIGURATION_LINKS"
          :key="item.label"
          :item="item"
          :active="checkActiveClass(item.link)"
        />
      </div>
    </ul>

    <!-- Configuração -->
    <ul
      v-if="authStore.isAdministrator || authStore.isSuperAdministrator"
      class="pl-0 lg:mt-4"
    >
      <small
        class="text-primary-700/70 mb-4 hidden text-xs font-bold lg:block lg:pl-2"
        >Configuração</small
      >
      <div class="flex flex-col gap-y-1">
        <TheAdminSideNavItem
          v-for="item in ADMIN_CONFIGURATION_LINKS"
          :key="item.label"
          :item="item"
          :active="checkActiveClass(item.link)"
        />
      </div>
    </ul>
  </aside>
</template>
