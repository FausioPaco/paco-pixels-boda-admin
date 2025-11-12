const { siteConfig } = await useClientConfig();

export const seoContent = {
  title: `${siteConfig.title} - Gestão inteligente de eventos com a elegância da ${siteConfig.entity}`,
  description: `Aceda ao painel exclusivo da ${siteConfig.entity} para gerir o seu casamento ou evento com sofisticação.`,
  image: siteConfig.image,
  url: siteConfig.url,
};
