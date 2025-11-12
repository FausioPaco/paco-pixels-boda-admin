<script setup lang="ts">
const { siteConfig } = await useClientConfig();

const backgroundStyle = ref<Record<string, string>>({
  backgroundImage: `url('${siteConfig.loginBackgroundImage}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: siteConfig.loginBackgroundColor,
  color: 'white',
});

onMounted(async () => {
  const supports = await supportsWebP();
  const imageUrl = supports
    ? siteConfig.loginBackgroundImage
    : siteConfig.loginFallbackBackgroundImage;

  backgroundStyle.value = {
    backgroundImage: `url('${imageUrl}')`,
    backgroundSize: 'cover',
    backgroundColor: siteConfig.loginBackgroundColor,
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    color: 'white',
  };
});
</script>
<template>
  <div class="flex min-h-screen w-full flex-col md:flex-row">
    <!-- Banner -->
    <div
      :style="backgroundStyle"
      class="hidden w-full flex-col items-center justify-center md:flex md:w-1/2 md:px-8"
    >
      <!-- Main Logo -->
      <NuxtImg
        :src="siteConfig.logoSecondaryLarge"
        width="716"
        height="247"
        class="h-auto w-[395px]"
        format="webp"
        alt="Mariee Logo"
      />

      <!-- Partnership -->
      <div
        v-if="siteConfig.showPartnership"
        class="mt-auto flex flex-col items-center gap-2"
      >
        <small class="text-white">Em parceria exclusiva com</small>
        <NuxtImg
          :src="siteConfig.bodaPartnerLogo"
          width="196"
          height="61"
          format="webp"
          alt="Boda Logo"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="md:w-1/2">
      <main id="main" role="main" class="flex min-h-screen flex-col">
        <div class="mb-4 flex items-end justify-center gap-x-2 pt-8">
          <NuxtImg
            :src="siteConfig.logoPrimarySmall"
            width="537"
            height="185"
            format="webp"
            alt="Logotipo"
          />
        </div>

        <slot></slot>
      </main>
    </div>
  </div>
</template>
