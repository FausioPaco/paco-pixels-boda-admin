import { useAuthStore } from '@/stores/auth';
import { isAdministrator, isSuperAdministrator } from '#shared/constants/roles';

export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuthStore();

  if (
    !isAdministrator(user?.roleName) ||
    !isSuperAdministrator(user?.roleName)
  ) {
    return navigateTo('/login');
  }
});
