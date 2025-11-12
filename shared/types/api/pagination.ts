export type Pagination<T> = {
  totalCount: number;
  totalPeopleCount?: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  data: T[];
};

export type PaginationData<T> = Omit<Pagination<T>, 'data'>;
