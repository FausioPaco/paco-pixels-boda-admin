const LOCALE_STORAGE_KEY = 'boda-admin-locale';
const SUPPORTED_LOCALES = ['pt', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Manages application language selection and persistence.
 *
 * Resolution strategy:
 * 1. localStorage (client-side explicit preference)
 * 2. locale cookie (SSR-safe fallback / cross-tab sync)
 * 3. 'pt' (global fallback)
 *
 * After login, call `syncFromUser(user)` to optionally sync the backend
 * user.preferredLanguage when no explicit device override exists.
 */
export const useLanguage = () => {
  const { locale, setLocale } = useI18n();

  // Cookie is SSR-safe and keeps server/client in sync.
  const localeCookie = useCookie<SupportedLocale>(LOCALE_STORAGE_KEY, {
    default: () => 'pt',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  /**
   * Read the stored locale from localStorage (client) or cookie (SSR).
   * Called once on app mount to restore the user's previous preference.
   */
  const initLocale = () => {
    let resolved: SupportedLocale = 'pt';

    if (import.meta.client) {
      const stored = localStorage.getItem(
        LOCALE_STORAGE_KEY,
      ) as SupportedLocale | null;

      if (stored && SUPPORTED_LOCALES.includes(stored)) {
        resolved = stored;
        // Keep the cookie in sync in case it drifted
        localeCookie.value = stored;
      } else if (SUPPORTED_LOCALES.includes(localeCookie.value)) {
        resolved = localeCookie.value;
      }
    } else {
      if (SUPPORTED_LOCALES.includes(localeCookie.value)) {
        resolved = localeCookie.value;
      }
    }

    if (resolved !== locale.value) {
      setLocale(resolved);
    }
  };

  /**
   * Explicitly switch the language.
   * Persists to both localStorage and cookie.
   */
  const changeLocale = async (code: SupportedLocale) => {
    await setLocale(code);
    localeCookie.value = code;
    if (import.meta.client) {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
    }
  };

  /**
   * Call after a successful login to optionally sync locale from the backend.
   * Only syncs if the user has no explicit device-level preference stored.
   * Device preference (localStorage) always wins.
   */
  const syncFromUser = async (user: User) => {
    if (!import.meta.client) return;
    const hasDeviceOverride = !!localStorage.getItem(LOCALE_STORAGE_KEY);
    if (
      !hasDeviceOverride &&
      user.preferredLanguage &&
      SUPPORTED_LOCALES.includes(user.preferredLanguage)
    ) {
      await changeLocale(user.preferredLanguage);
    }
  };

  return {
    locale,
    changeLocale,
    initLocale,
    syncFromUser,
  };
};
