export default defineNuxtPlugin((nuxtApp) => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const token = useCookie<string>('token');

  const api = $fetch.create({
    baseURL: apiBaseUrl.toString(),
    onRequest({ options }) {
      if (token.value) {
        options.headers.set('Authorization', `Bearer ${token.value}`);
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => navigateTo('/'));
      }
    },
  });

  return {
    provide: {
      api,
    },
  };
});
