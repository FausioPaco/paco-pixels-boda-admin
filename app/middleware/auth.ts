import { useAuthStore } from '@/stores/auth';
import { isStaffUser } from '#shared/constants/roles';

export default defineNuxtRouteMiddleware((to) => {
  const store = useAuthStore();

  store.checkAuth();

  const { user } = storeToRefs(store);
  const token = useCookie<string>('token');

  if (token.value && isStaffUser(user.value?.roleName) && to?.name === '') {
    return navigateTo('/eventos');
  }

  if (!token.value && to?.name !== '') {
    abortNavigation();
    return navigateTo('/');
  }
});
