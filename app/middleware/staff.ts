import { useAuthStore } from '@/stores/auth';
import { isStaffUser } from '#shared/constants/roles';

export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuthStore();

  if (!isStaffUser(user?.roleName)) {
    return navigateTo('/login');
  }
});
