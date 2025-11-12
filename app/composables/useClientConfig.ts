export async function useClientConfig() {
  const clientCode = useRuntimeConfig().public.clientCode;

  const siteConfig = await import(`~~/configs/${clientCode}/site.json`).then(
    (m) => m.default,
  );
  const themeConfig = await import(`~~/configs/${clientCode}/theme.json`).then(
    (m) => m.default,
  );

  return {
    siteConfig,
    themeConfig,
    clientCode,
  };
}
