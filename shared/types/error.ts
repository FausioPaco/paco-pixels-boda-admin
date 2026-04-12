export type ServerValidationErrors =
  | Record<string, string | string[]>
  | Array<string>
  | null
  | undefined;

export type ServerError = {
  hasErrors: boolean;
  message: string;
  code?: string | null;
  status?: number | null;
  traceId?: string | null;
  errors?: ServerValidationErrors;
};

export type FetchErrorLike = {
  data?: unknown;
  statusCode?: number;
  message?: string;
};
