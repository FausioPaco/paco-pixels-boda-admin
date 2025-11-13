<script lang="ts" setup>
const { siteConfig } = await useClientConfig();

useHead({
  title: `Gestão inteligente de eventos com a elegância da ${siteConfig.entity}`,
  meta: [
    {
      name: 'description',
      content: siteConfig.description,
    },
  ],
});

useSeoMeta({
  title: `Gestão inteligente de eventos com a elegância da ${siteConfig.entity}`,
  description: siteConfig.description,
  ogType: 'website',
  ogTitle: siteConfig.description,
  ogDescription: siteConfig.description,
  ogImage: siteConfig.seo?.image,
  ogUrl: siteConfig.seo?.url || siteConfig.link || '/',
  ogSiteName: siteConfig.seo?.name || siteConfig.coupleNames,
  twitterCard: 'summary_large_image',
  twitterTitle: siteConfig.title,
  twitterDescription: siteConfig.description,
  twitterImage: siteConfig.seo?.image,
});

definePageMeta({
  name: 'Visão Geral',
  middleware: ['auth'],
});
</script>
<template>
  <div>
    <NuxtLayout name="entry">
      <section class="flex flex-col items-center justify-center">
        <Login />
      </section>
    </NuxtLayout>
  </div>
</template>
