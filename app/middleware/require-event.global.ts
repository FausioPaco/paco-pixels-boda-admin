export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return;

  const eventStore = useEventStore();
  eventStore.loadFromCookies();

  if (!eventStore.eventId) {
    console.log('Sem evento: ' + eventStore.eventId);
    return navigateTo('/eventos');
  }
});
