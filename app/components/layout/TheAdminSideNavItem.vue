<script setup lang="ts">
import type { AdminLink } from '#shared/types/nav';

interface IAdminSideNavProps {
  item: AdminLink;
  active: boolean;
}

defineProps<IAdminSideNavProps>();
</script>
<template>
  <li
    class="text-grey-400 hover:text-primary-600 hover:bg-primary-100 relative flex h-full cursor-pointer items-center py-3 transition-all duration-[400] ease-in lg:pl-3"
    :class="active ? 'bg-primary-50 text-primary-700' : undefined"
  >
    <NuxtLink
      class="flex w-full items-end justify-center gap-x-3 text-base font-semibold leading-tight no-underline lg:justify-start"
      :to="item.link"
    >
      <template v-if="item.icon">
        <component
          :is="`icon-${item.icon}`"
          :font-controlled="false"
          width="24"
          height="24"
        />
      </template>

      <span class="hidden lg:inline-block">{{ item.label }}</span>
    </NuxtLink>
  </li>
</template>
