export default defineNuxtPlugin((nuxtApp) => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const token = useCookie<string | null>('token');

  let isLoggingOut = false;
  let refreshPromise: Promise<boolean> | null = null;

  const AUTH_PATHS = ['/auth/authenticate', '/auth/refresh', '/auth/logout'];

  const isAuthRequest = (req: unknown) => {
    const url = String(req).toLowerCase();
    return AUTH_PATHS.some((p) => url.includes(p));
  };

  const logoutAndRedirect = async () => {
    if (isLoggingOut) return;
    isLoggingOut = true;

    await nuxtApp.runWithContext(async () => {
      useCookie<string | null>('token').value = null;
      useCookie<string | null>('tokenExpiration').value = null;
      useCookie<User | null>('user').value = null;

      const auth = useAuthStore();
      auth.logout();

      await navigateTo('/?reason=session-expired');
    });

    queueMicrotask(() => {
      isLoggingOut = false;
    });
  };

  const api = $fetch.create({
    baseURL: apiBaseUrl.toString(),

    onRequest({ options }) {
      options.credentials = 'include';

      const headers = new Headers(options.headers as HeadersInit | undefined);

      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`);
      }

      options.headers = headers;
    },

    async onResponseError(ctx) {
      const status = ctx.response?.status;

      // 1) não aplicar refresh em endpoints de auth (login/refresh/logout)
      if (isAuthRequest(ctx.request)) return;

      // 2) refresh só em 401 (403 não é sessão expirada)
      if (status !== 401) return;

      const headers = new Headers(
        ctx.options.headers as HeadersInit | undefined,
      );
      if (headers.get('x-refresh-tried') === '1') {
        await logoutAndRedirect();
        return;
      }

      // 3) LOCK: se já existe refresh em curso, aguardar o mesmo
      if (!refreshPromise) {
        refreshPromise = nuxtApp.runWithContext(async () => {
          const auth = useAuthStore();
          try {
            return await auth.tryRefresh();
          } catch {
            return false;
          } finally {
            refreshPromise = null;
          }
        });
      }

      const refreshed = await refreshPromise;

      if (!refreshed) {
        await logoutAndRedirect();
        return;
      }

      const newToken = useCookie<string | null>('token').value;

      const retryHeaders = new Headers(
        ctx.options.headers as HeadersInit | undefined,
      );
      retryHeaders.set('x-refresh-tried', '1');
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);

      ctx.options.headers = retryHeaders;
      ctx.options.credentials = 'include';

      const opts = ctx.options;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await $fetch(ctx.request, opts as any);
    },
  });

  return {
    provide: {
      api,
    },
  };
});
