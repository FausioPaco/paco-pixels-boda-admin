export type ServerError = {
  hasErrors: boolean;
  message: string;
};

type FetchErrorLike = {
  data?: unknown;
  statusCode?: number;
  message?: string;
};

export function isFetchErrorLike(e: unknown): e is FetchErrorLike {
  return typeof e === 'object' && e !== null && 'data' in e;
}
