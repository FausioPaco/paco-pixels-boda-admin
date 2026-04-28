/**
 * Client-only plugin: restores the user's locale from localStorage on first
 * render, before any components mount. Runs after @nuxtjs/i18n initialises
 * (enforce: 'post') so nuxtApp.$i18n is already available.
 */
export default defineNuxtPlugin({
  name: 'i18n-locale-init',
  enforce: 'post',
  setup(nuxtApp) {
    const LOCALE_KEY = 'boda-admin-locale';
    const SUPPORTED = ['pt', 'en'] as const;

    const stored = localStorage.getItem(LOCALE_KEY) as 'pt' | 'en' | null;

    if (stored && SUPPORTED.includes(stored)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const i18n = nuxtApp.$i18n as any;
      if (i18n?.locale?.value !== stored) {
        i18n.setLocale(stored);
      }
    }
  },
});
