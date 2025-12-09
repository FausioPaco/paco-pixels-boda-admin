<script setup lang="ts">
const { siteConfig } = await useClientConfig();
</script>
<template>
  <header
    class="border-grey-100/60 flex flex-wrap items-center justify-center gap-8 border-b pb-4 pt-3 sm:justify-between"
  >
    <!-- Logo -->
    <NuxtLink to="/eventos" class="block px-2 no-underline">
      <NuxtImg
        :src="siteConfig.logoPrimarySmall"
        width="537"
        height="185"
        format="webp"
        class="h-auto w-[180px] max-w-full"
        alt="Logotipo"
      />
    </NuxtLink>

    <!-- Logout -->
    <TheHeaderUser />
  </header>
</template>
