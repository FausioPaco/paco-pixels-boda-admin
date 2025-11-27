import { isMultiEventStaffUser } from '~~/shared/constants/roles';

export default defineNuxtRouteMiddleware((_) => {
  const authStore = useAuthStore();
  authStore.checkAuth();

  const { user } = storeToRefs(authStore);

  const eventStore = useEventStore();
  eventStore.loadFromCookies();

  if (!eventStore.eventId) {
    if (isMultiEventStaffUser(user.value?.roleName)) {
      return navigateTo('/eventos');
    }

    authStore.logout();
    return navigateTo('/');
  }
});
