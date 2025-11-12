let cachedTheme: unknown = null;

export const useThemeConfig = async () => {
  if (cachedTheme) return cachedTheme;

  const clientCode = useRuntimeConfig().public.CLIENT_CODE;
  const themeModule = await import(`~/configs/${clientCode}/themeConfig`);
  cachedTheme = themeModule.themeColors;

  return cachedTheme;
};
