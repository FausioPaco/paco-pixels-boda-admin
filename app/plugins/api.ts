import type { FetchOptions } from 'ofetch';

export default defineNuxtPlugin((nuxtApp) => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const token = useCookie<string | null>('token');

  const logoutAndRedirect = async () => {
    await nuxtApp.runWithContext(async () => {
      const t = useCookie<string | null>('token');
      t.value = null;

      const auth = useAuthStore();
      if (typeof auth.logout === 'function') {
        await auth.logout();
      }

      await navigateTo('/?reason=session-expired');
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

      // 🔥 Logout imediato para erros de servidor / gateway
      if (status === 502 || status === 503 || status === 504) {
        await logoutAndRedirect();
        return;
      }

      // Refresh apenas em 401
      if (status !== 401) return;

      const headers = new Headers(
        ctx.options.headers as HeadersInit | undefined,
      );

      if (headers.get('x-refresh-tried') === '1') {
        await logoutAndRedirect();
        return;
      }

      const refreshed = await nuxtApp.runWithContext(async () => {
        const auth = useAuthStore();
        return await auth.tryRefresh();
      });

      if (!refreshed) {
        await logoutAndRedirect();
        return;
      }

      const newToken = useCookie<string | null>('token').value;

      const retryHeaders = new Headers(
        ctx.options.headers as HeadersInit | undefined,
      );

      retryHeaders.set('x-refresh-tried', '1');
      if (newToken) {
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
      }

      ctx.options.headers = retryHeaders;
      ctx.options.credentials = 'include';

      const opts = ctx.options as FetchOptions<'json'>;
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
