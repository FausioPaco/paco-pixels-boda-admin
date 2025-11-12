import { getUserService } from '~/services/userService';

export const useUser = async (userId: number) => {
  const user = useState<User | null>('get-user', () => null);
  const nuxtApp = useNuxtApp();

  const { data, refresh, status } = await useAsyncData(
    'get-user-' + userId,
    () => getUserService(nuxtApp.$api).getUser(userId),
    {
      default: () => null,
      transform(input) {
        return { ...input, fetchedAt: new Date() };
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
    if (data.value) user.value = data.value;
  });

  return {
    user,
    isRefreshing: status.value === 'pending',
    refreshUser: refresh,
  };
};
