<script setup lang="ts">
const { siteConfig } = await useClientConfig();
</script>
<template>
  <header class="border-grey-100/60 flex items-center justify-between border-b">
    <!-- Logo -->
    <NuxtLink to="/" class="block px-2 no-underline">
      <NuxtImg
        :src="siteConfig.logoPrimarySmall"
        width="537"
        height="185"
        format="webp"
        class="h-auto w-[200px] max-w-full"
        alt="Logotipo"
      />
    </NuxtLink>

    <!-- Logout -->
    <TheHeaderUser />
  </header>
</template>
