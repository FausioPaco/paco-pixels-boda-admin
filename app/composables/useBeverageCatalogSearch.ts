import { getBeverageService } from '~/services/beverageService';

export const useBeverageCatalogSearch = () => {
  const nuxtApp = useNuxtApp();
  const service = getBeverageService(nuxtApp.$api);

  const results = ref<BeverageCatalogItem[]>([]);
  const isSearching = ref(false);
  const error = ref<unknown>(null);

  const search = async (opts: {
    q: string;
    categoryId?: number | null;
    take?: number;
  }) => {
    const q = (opts.q ?? '').trim();

    // evita chamar backend com vazio
    if (!q) {
      results.value = [];
      return;
    }

    try {
      isSearching.value = true;
      error.value = null;

      results.value = await service.search({
        q,
        categoryId: opts.categoryId ?? null,
        take: opts.take ?? 10,
      });
    } finally {
      isSearching.value = false;
    }
  };

  const clear = () => {
    results.value = [];
  };

  return {
    results,
    isSearching,
    error,
    search,
    clear,
  };
};
