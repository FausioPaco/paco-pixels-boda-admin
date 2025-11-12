import { useAuthStore } from '@/stores/auth';
import { isStaffUser } from '#shared/constants/roles';

export default defineNuxtRouteMiddleware((to) => {
  const store = useAuthStore();

  store.checkAuth();

  const { user } = storeToRefs(store);
  const token = useCookie<string>('token');

  if (
    token.value &&
    isStaffUser(user.value?.roleName) &&
    to?.name === 'login'
  ) {
    return navigateTo('/admin');
  }

  if (!token.value && to?.name !== 'login') {
    abortNavigation();
    return navigateTo('/login');
  }
});
