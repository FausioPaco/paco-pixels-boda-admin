import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const authenticated = ref<boolean>(false);

  const setUserData = (authResult: AuthResponse) => {
    const expirationDate = new Date(
      new Date().getTime() + authResult.expirationMinutes * 1000,
    );

    const token = useCookie<string>('token', {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });

    const tokenExpiration = useCookie<Date>('tokenExpiration', {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });

    const userData = useCookie<User>('user', {
      expires: expirationDate,
      secure: true,
    });

    token.value = authResult.token;
    tokenExpiration.value = expirationDate;
    user.value = authResult.user;
    userData.value = authResult.user;
    authenticated.value = true;
  };

  const logout = () => {
    const token = useCookie('token');
    const tokenExpiration = useCookie('tokenExpiration');
    const userData = useCookie('user');

    token.value = null;
    tokenExpiration.value = null;
    userData.value = null;
    user.value = null;
    authenticated.value = false;
  };

  const checkAuth = () => {
    const token = useCookie<string>('token');
    const tokenExpiration = useCookie<Date>('tokenExpiration');
    const userData = useCookie<User>('user');

    if (new Date() > tokenExpiration.value || !token) {
      logout();
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

  return {
    user,
    authenticated,
    setUserData,
    logout,
    checkAuth,
    isAdministrator,
    isSuperAdministrator,
  };
});
