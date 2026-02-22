import { useAuthStore } from '@/stores/auth';
import { isMultiEventStaffUser } from '#shared/constants/roles';

export default defineNuxtRouteMiddleware((to) => {
  const store = useAuthStore();

  store.checkAuth();

  const { user } = storeToRefs(store);
  const token = useCookie<string>('token');

  if (token.value && to?.path === '/') {
    // Só Super Admin / Admin vão para "/eventos"
    if (isMultiEventStaffUser(user.value?.roleName)) {
      return navigateTo('/eventos');
    }

    // Todos os outros (Gestor, Protocolo, Fotógrafo, Noivo, Noiva) → "/admin"
    return navigateTo('/admin');
  }

  // User não autenticado a tentar aceder a qualquer rota que não "/"
  if (!token.value && to?.path !== '/') {
    abortNavigation();
    return navigateTo('/?reason=session-expired');
  }
});
