export default defineI18nConfig(() => {
  const config = useRuntimeConfig();
  const locale = ((config.public.siteLocale as string) || 'pt') as 'pt' | 'en';

  return {
    legacy: false,
    locale,
    fallbackLocale: 'pt',
  };
});
