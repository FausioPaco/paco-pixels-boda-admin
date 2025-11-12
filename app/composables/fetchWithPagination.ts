import type { $Fetch } from 'nitropack';

export async function fetchWithPagination<T>(
  fetch: $Fetch,
  url: string,
  options?: Parameters<typeof fetch>[1],
): Promise<Pagination<T>> {
  let pagination: PaginationData<T> = {
    totalCount: 0,
    totalPeopleCount: 0,
    pageSize: 0,
    currentPage: 1,
    totalPages: 1,
  };

  const onResponse = (ctx: { response: Response }) => {
    const rawHeader = ctx.response.headers.get('x-pagination');
    if (rawHeader) {
      try {
        pagination = JSON.parse(rawHeader);
      } catch (err) {
        console.warn('Erro ao parsear x-pagination:', err);
      }
    }
  };

  const data = await fetch<T[]>(url, {
    ...options,
    onResponse,
  });

  return {
    ...pagination,
    data,
  };
}
