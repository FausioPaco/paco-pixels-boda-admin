export type PageMeta = { title: string; description: string };

export const usePageData = () => {
  const pageMeta = useState<PageMeta>('page-meta', () => ({
    title: '',
    description: '',
  }));

  const setPageMeta = (meta: Partial<PageMeta>) => {
    pageMeta.value = { ...pageMeta.value, ...meta };
  };

  return { pageMeta, setPageMeta };
};
