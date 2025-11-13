export default defineNuxtRouteMiddleware((to) => {
  // ex.: só exigir evento em rotas do admin
  if (!to.path.startsWith('/admin')) return;

  const store = useEventStore();
  store.loadFromCookies();

  if (!store.eventId) {
    return navigateTo('/eventos');
  }
});

// numa página de lista de eventos
// const { events } = await useEventsList();
// const eventStore = useEventStore();

// const choose = (ev: Event) => {
//   eventStore.selectEvent({
//     id: ev.id,
//     name: ev.name,
//     slug: ev.slug,
//     eventTypeId: ev.eventTypeId ?? null,
//   });
//   navigateTo('/admin/desks'); // segue o fluxo que quiseres
// };
