// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocalizedConfig = Record<string, any>;

function cloneConfig<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepMerge(
  target: LocalizedConfig,
  source: LocalizedConfig,
): LocalizedConfig {
  const result = cloneConfig(target);
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMerge(
        result[key] as LocalizedConfig,
        source[key] as LocalizedConfig,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function syncConfig(target: LocalizedConfig, source: LocalizedConfig) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete target[key];
    }
  }
  Object.assign(target, source);
}

export async function useClientConfig() {
  const config = useRuntimeConfig();
  const clientCode = config.public.clientCode as string;

  // All composables MUST be called before the first await.
  const { locale } = useI18n();

  const siteConfigState = useState<LocalizedConfig>(
    `site-config:${clientCode}`,
    () => reactive({}) as LocalizedConfig,
  );

  const loadedLocaleState = useState<string>(
    `site-config-locale:${clientCode}`,
    () => '',
  );

  const watcherRegisteredState = useState<boolean>(
    `site-config-watcher-registered:${clientCode}`,
    () => false,
  );

  const baseSiteConfig = await import(
    `~~/configs/${clientCode}/site.json`
  ).then((m) => m.default as LocalizedConfig);

  const themeConfig = await import(`~~/configs/${clientCode}/theme.json`).then(
    (m) => m.default,
  );

  const buildLocalizedConfig = async (
    currentLocale: string,
  ): Promise<LocalizedConfig> => {
    const normalizedLocale = currentLocale === 'en' ? 'en' : 'pt';
    const next = cloneConfig(baseSiteConfig);

    if (normalizedLocale === 'en') {
      const englishOverride = await import(
        `~~/configs/${clientCode}/site.en.json`
      )
        .then((m) => m.default as LocalizedConfig)
        .catch(() => null);

      if (englishOverride) {
        return deepMerge(next, englishOverride);
      }
    }

    return next;
  };

  const applyLocaleConfig = async (newLocale: string) => {
    const normalizedLocale = newLocale === 'en' ? 'en' : 'pt';

    if (
      loadedLocaleState.value === normalizedLocale &&
      Object.keys(siteConfigState.value).length > 0
    ) {
      return;
    }

    const next = await buildLocalizedConfig(normalizedLocale);
    syncConfig(siteConfigState.value, next);
    loadedLocaleState.value = normalizedLocale;
  };

  await applyLocaleConfig(locale.value);

  if (import.meta.client && !watcherRegisteredState.value) {
    watcherRegisteredState.value = true;

    watch(
      locale,
      async (newLocale) => {
        await applyLocaleConfig(newLocale);
      },
      { immediate: false },
    );

    if (getCurrentScope()) {
      onScopeDispose(() => {
        watcherRegisteredState.value = false;
      });
    }
  }

  return {
    siteConfig: siteConfigState.value,
    themeConfig,
    clientCode,
  };
}
