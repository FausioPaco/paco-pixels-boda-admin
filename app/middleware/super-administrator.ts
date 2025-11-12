import { useAuthStore } from '@/stores/auth';
import { isSuperAdministrator } from '#shared/constants/roles';

export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuthStore();

  if (!isSuperAdministrator(user?.roleName)) {
    return navigateTo('/login');
  }
});
