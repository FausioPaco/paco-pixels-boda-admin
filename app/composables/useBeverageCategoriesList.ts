import { getBeverageService } from '~/services/beverageService';

export const useBeverageCategoriesList = async (opts?: {
  parameters?: BeverageCategoriesParameters;
  immediate?: boolean;
  cacheKey?: string;
}) => {
  const nuxtApp = useNuxtApp();
  const service = getBeverageService(nuxtApp.$api);
  const beverageCategories = useState<BeverageCategory[]>(
    'beverage-categories-list',
    () => [],
  );
  const pagination = useState<PaginationData<BeverageCategory> | null>(
    'beverage-categories-pagination',
    () => null,
  );

  const parameters = ref<BeverageCategoriesParameters>({
    searchQuery: opts?.parameters?.searchQuery ?? '',
    pageNumber: opts?.parameters?.pageNumber ?? 1,
    pageSize: opts?.parameters?.pageSize ?? 20,
    take: opts?.parameters?.take ?? null,
  });

  const cacheKey =
    opts?.cacheKey ??
    `beverage-categories-${parameters.value.searchQuery ?? ''}-${parameters.value.pageNumber}-${parameters.value.pageSize}-${parameters.value.take ?? 'none'}`;

  const { data, pending, error, refresh } = await useAsyncData(
    cacheKey,
    async () => service.getCategories(parameters.value),
    {
      immediate: opts?.immediate ?? true,
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          beverageCategories: data,
          pagination: paginationData,
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
      beverageCategories.value = data.value.beverageCategories;
      pagination.value = data.value.pagination;
    }
  });

  const refreshCategories = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(cacheKey);
    }
    await refresh();
  };

  const createCategory = async (name: string): Promise<BeverageCategory> => {
    revealErrorIfEmpty(name);

    const created = await service.createCategory({ name });
    await refresh();
    return created;
  };

  const setSearchQuery = async (searchQuery: string) => {
    parameters.value.searchQuery = searchQuery;
    parameters.value.pageNumber = 1;
    await refresh();
  };

  const setPage = async (pageNumber: number) => {
    parameters.value.pageNumber = pageNumber;
    await refresh();
  };

  function revealErrorIfEmpty(name: string) {
    if (!name || !name.trim())
      throw new Error('O nome da categoria é obrigatório.');
  }

  return {
    parameters,
    categories: beverageCategories,
    pagination,
    isLoading: pending,
    error,
    refreshCategories,
    createCategory,
    setSearchQuery,
    setPage,
  };
};
