<script lang="ts" setup>
const { siteConfig } = await useClientConfig();

useSeoMeta({
  title: siteConfig.title,
  description: siteConfig.description,
  ogType: 'website',
  ogTitle: siteConfig.description,
  ogDescription: siteConfig.description,
  ogImage: siteConfig.seo?.image,
  ogUrl: siteConfig.seo?.url || siteConfig.link,
  ogSiteName: siteConfig.seo?.name || siteConfig.coupleNames,
  twitterCard: 'summary_large_image',
  twitterTitle: siteConfig.title,
  twitterDescription: siteConfig.description,
  twitterImage: siteConfig.seo?.image,
});
</script>
<template>
  <div>
    <h2>Olá Mundo</h2>
  </div>
</template>
