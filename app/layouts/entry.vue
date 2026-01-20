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
      <div class="flex flex-1 items-center">
        <NuxtImg
          :src="siteConfig.logoSecondaryLarge"
          width="716"
          height="247"
          class="h-auto w-[520px]"
          format="webp"
          alt="Mariee Logo"
        />
      </div>

      <!-- Partnership -->
      <div
        v-if="siteConfig.showPartnership"
        class="flex flex-col items-center gap-2 py-4"
      >
        <small class="text-white">Em parceria exclusiva com</small>
        <NuxtLink href="https://boda.co.mz/" target="_blank" external>
          <NuxtImg
            :src="siteConfig.bodaPartnerLogo"
            width="196"
            height="61"
            format="webp"
            alt="Boda Logo"
            class="h-auto w-[120px] max-w-full"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="md:w-1/2">
      <main id="main" role="main" class="flex min-h-screen flex-col">
        <div
          class="border-grey-100/60 mb-4 flex items-end justify-center gap-x-2 border-b pb-6 pt-8 md:border-none md:pb-0"
        >
          <NuxtImg
            :src="siteConfig.logoPrimarySmall"
            width="537"
            height="185"
            format="webp"
            class="h-auto w-[200px] max-w-full"
            alt="Logotipo"
          />
        </div>
        <div class="flex flex-1 flex-col justify-center">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>
