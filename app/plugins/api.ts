export default defineNuxtPlugin((nuxtApp) => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const token = useCookie<string | null>('token');

  const api = $fetch.create({
    baseURL: apiBaseUrl.toString(),

    onRequest({ options }) {
      // ✅ obrigatório para cookies cross-domain (refreshToken)
      options.credentials = 'include';

      // normalizar headers
      const headers = new Headers(options.headers as HeadersInit | undefined);

      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`);
      }

      options.headers = headers;
    },

    async onResponseError(ctx) {
      if (ctx.response?.status !== 401) return;

      const headers = new Headers(
        ctx.options.headers as HeadersInit | undefined,
      );

      // evita loop infinito de refresh
      if (headers.get('x-refresh-tried') === '1') {
        await nuxtApp.runWithContext(() =>
          navigateTo('/?reason=session-expired'),
        );
        return;
      }

      const refreshed = await nuxtApp.runWithContext(async () => {
        const auth = useAuthStore();
        return await auth.tryRefresh();
      });

      if (!refreshed) {
        await nuxtApp.runWithContext(() =>
          navigateTo('/?reason=session-expired'),
        );
        return;
      }

      // repete request com token novo
      const newToken = useCookie<string | null>('token').value;

      const retryHeaders = new Headers(
        ctx.options.headers as HeadersInit | undefined,
      );
      retryHeaders.set('x-refresh-tried', '1');
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);

      ctx.options.headers = retryHeaders;
      ctx.options.credentials = 'include';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await $fetch(ctx.request, ctx.options as any);
    },
  });

  return {
    provide: {
      api,
    },
  };
});
