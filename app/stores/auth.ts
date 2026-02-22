import { defineStore } from 'pinia';
import { getAuthService } from '~/services/authService';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const authenticated = ref<boolean>(false);

  const setUserData = (authResult: AuthResponse) => {
    const expirationDate = new Date(
      Date.now() + authResult.expirationMinutes * 60 * 1000,
    );

    const token = useCookie<string>('token', {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });

    const tokenExpiration = useCookie<string | null>('tokenExpiration', {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });

    const userData = useCookie<User>('user', {
      expires: expirationDate,
      secure: true,
    });

    token.value = authResult.token;
    tokenExpiration.value = expirationDate.toISOString();
    user.value = authResult.user;
    userData.value = authResult.user;
    authenticated.value = true;
  };

  const logout = () => {
    const token = useCookie<string | null>('token');
    const tokenExpiration = useCookie<string | null>('tokenExpiration');
    const userData = useCookie<User | null>('user');

    token.value = null;
    tokenExpiration.value = null;
    userData.value = null;
    user.value = null;
    authenticated.value = false;
  };

  const logoutAsync = async () => {
    try {
      const nuxtApp = useNuxtApp();
      const authService = getAuthService(nuxtApp.$api);
      await authService.logout();
    } catch {
      // se falhar no servidor, mesmo assim limpamos localmente
    } finally {
      logout();
    }
  };

  const tryRefresh = async (): Promise<boolean> => {
    try {
      const nuxtApp = useNuxtApp();
      const authService = getAuthService(nuxtApp.$api);

      const authResult = await authService.refresh();
      setUserData(authResult);
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const checkAuth = () => {
    const token = useCookie<string | null>('token');
    const tokenExpiration = useCookie<string | null>('tokenExpiration');
    const userData = useCookie<User | null>('user');

    const exp = tokenExpiration.value ? new Date(tokenExpiration.value) : null;

    if (!token.value || !exp || new Date() > exp) {
      logout();
      return;
    }

    if (userData.value) {
      authenticated.value = true;
      user.value = userData.value;
    }
  };

  const isAdministrator = computed(
    () => user.value?.roleName === 'Administrador',
  );

  const isSuperAdministrator = computed(
    () => user.value?.roleName === 'Super Administrador',
  );

  const isMultiEventStaffUser = computed(
    () =>
      user.value?.roleName === 'Super Administrador' ||
      user.value?.roleName === 'Administrador',
  );

  const hasEventAssigned = computed(() => !!user.value?.eventId);

  return {
    user,
    authenticated,
    setUserData,
    logout,
    logoutAsync,
    tryRefresh,
    checkAuth,
    isAdministrator,
    isSuperAdministrator,
    isMultiEventStaffUser,
    hasEventAssigned,
  };
});
