export default defineNuxtRouteMiddleware((to) => {
  // ex.: só exigir evento em rotas do admin
  if (!to.path.startsWith('/admin')) return;

  const store = useEventStore();
  store.loadFromCookies();

  if (!store.eventId) {
    return navigateTo('/eventos');
  }
});
