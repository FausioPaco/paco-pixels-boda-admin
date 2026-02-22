export default defineNuxtPlugin(() => {
  const auth = useAuthStore();
  const sessionGuard = useSessionGuardStore();

  const token = useCookie<string | null>('token');
  const tokenExpiration = useCookie<string | null>('tokenExpiration');

  let warnTimer: ReturnType<typeof setTimeout> | null = null;
  let hardTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (warnTimer) clearTimeout(warnTimer);
    if (hardTimer) clearTimeout(hardTimer);
    warnTimer = null;
    hardTimer = null;
  };

  const schedule = () => {
    clearTimers();
    sessionGuard.reset();

    if (!token.value || !tokenExpiration.value) return;

    const expMs = new Date(tokenExpiration.value).getTime();
    const msLeft = expMs - Date.now();

    if (msLeft <= 0) {
      auth.logout();
      return navigateTo('/?reason=session-expired');
    }

    const warnAtMs = msLeft - 5 * 60 * 1000;

    if (warnAtMs > 0) {
      warnTimer = setTimeout(() => {
        sessionGuard.openWarning(expMs);
      }, warnAtMs);
    }

    hardTimer = setTimeout(() => {
      auth.logout();
      navigateTo('/?reason=session-expired');
    }, msLeft);
  };

  auth.checkAuth();
  schedule();

  watch([() => token.value, () => tokenExpiration.value], schedule);
});
