import { getBeverageService } from '~/services/beverageService';

export const useBeverageCatalogList = async (opts?: {
  parameters?: Partial<BeverageCatalogParameters>;
  immediate?: boolean;
  cacheKey?: string;
}) => {
  const beverageItems = useState<BeverageCatalogItem[]>(
    'beverage-catalog-list',
    () => [],
  );
  const pagination = useState<PaginationData<BeverageCatalogItem> | null>(
    'beverage-catalog-pagination',
    () => null,
  );

  const nuxtApp = useNuxtApp();
  const service = getBeverageService(nuxtApp.$api);

  const parameters = ref<BeverageCatalogParameters>({
    searchQuery: opts?.parameters?.searchQuery ?? '',
    categoryId: opts?.parameters?.categoryId ?? null,
    pageNumber: opts?.parameters?.pageNumber ?? 1,
    pageSize: opts?.parameters?.pageSize ?? 10,
    onlyActive: opts?.parameters?.onlyActive ?? true,
    take: opts?.parameters?.take ?? null,
  });

  const cacheKey =
    opts?.cacheKey ??
    `beverage-catalog-${parameters.value.searchQuery ?? ''}-${parameters.value.categoryId ?? 'all'}-${parameters.value.pageNumber}-${parameters.value.pageSize}-${parameters.value.onlyActive}-${parameters.value.take ?? 'none'}`;

  const { data, pending, error, refresh } = await useAsyncData(
    cacheKey,
    () => service.getCatalogItems(parameters.value),
    {
      immediate: opts?.immediate ?? true,
      transform(input) {
        const { data, ...paginationData } = input;
        return {
          beverageItems: data,
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
      beverageItems.value = data.value.beverageItems;
      pagination.value = data.value.pagination;
    }
  });

  const setPage = async (pageNumber: number) => {
    parameters.value.pageNumber = pageNumber;
    await refresh();
  };

  const setSearchQuery = async (searchQuery: string) => {
    parameters.value.searchQuery = searchQuery;
    parameters.value.pageNumber = 1;
    await refresh();
  };

  const setCategoryId = async (categoryId: number | null) => {
    parameters.value.categoryId = categoryId;
    parameters.value.pageNumber = 1;
    await refresh();
  };

  const refreshCatalog = async (opts?: { force?: boolean }) => {
    if (opts?.force) {
      clearNuxtData(cacheKey);
    }
    await refresh();
  };

  return {
    parameters,
    catalog: beverageItems,
    isLoading: pending,
    error,
    pagination,
    refreshCatalog,
    setPage,
    setSearchQuery,
    setCategoryId,
  };
};
