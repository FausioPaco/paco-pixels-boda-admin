import { getUserService } from '~/services/userService';

export const useRolesList = async () => {
  const roles = useState<Role[]>('get-roles', () => []);

  const nuxtApp = useNuxtApp();
  const key = 'get-roles';

  const { data, refresh, status } = await useAsyncData(
    key,
    () => getUserService(nuxtApp.$api).getRoles(),
    {
      transform(input) {
        return {
          rolesList: input,
          fetchedAt: new Date(),
        };
      },
      getCachedData(key) {
        const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
        if (!cached) return;
        if (!cached.fetchedAt || cacheExpired(cached.fetchedAt, 20)) return;
        return cached;
      },
    },
  );

  watchEffect(() => {
    if (data.value) {
      roles.value = data.value.rolesList;
    }
  });

  const refreshRoles = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(key);
    }
    await refresh();
  };

  return {
    roles,
    isRefreshing: status.value === 'pending',
    refreshRoles,
  };
};
