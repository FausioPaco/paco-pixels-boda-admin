type Primitive = string | number | boolean | null | undefined;

export type ApiServerError =
  | string
  | {
      error?: string;
      message?: string;
      title?: string;
      detail?: string;
      code?: string;
      status?: number;
      traceId?: string;
      id?: string;
      errors?: ServerValidationErrors;
      data?: unknown;
    }
  | null
  | undefined;

const DEFAULT_ERROR_MESSAGE = 'Ocorreu um erro ao processar o seu pedido.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizePrimitive(value: Primitive): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);

  return null;
}

function collectValidationErrors(errors: ServerValidationErrors): string[] {
  if (!errors) return [];

  if (Array.isArray(errors)) {
    return errors
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (!isRecord(errors)) return [];

  const messages: string[] = [];

  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      messages.push(
        ...value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean),
      );

      continue;
    }

    if (typeof value === 'string' && value.trim()) {
      messages.push(value.trim());
    }
  }

  return messages;
}

function extractErrorPayload(error: unknown): Record<string, unknown> | null {
  if (!isRecord(error)) return null;

  if (isRecord(error.data)) return error.data;

  return error;
}

export function normalizeServerError(error: unknown): ServerError {
  const payload = extractErrorPayload(error);

  if (typeof error === 'string' && error.trim()) {
    return {
      hasErrors: true,
      message: error.trim(),
    };
  }

  if (!payload) {
    return {
      hasErrors: true,
      message: DEFAULT_ERROR_MESSAGE,
    };
  }

  const validationMessages = collectValidationErrors(
    payload.errors as ServerValidationErrors,
  );

  const message =
    normalizePrimitive(payload.message as Primitive) ||
    normalizePrimitive(payload.error as Primitive) ||
    normalizePrimitive(payload.title as Primitive) ||
    normalizePrimitive(payload.detail as Primitive) ||
    validationMessages[0] ||
    (isNonEmptyString((error as FetchErrorLike | undefined)?.message)
      ? (error as FetchErrorLike).message!.trim()
      : null) ||
    DEFAULT_ERROR_MESSAGE;

  return {
    hasErrors: true,
    message,
    code: isNonEmptyString(payload.code) ? payload.code : null,
    status:
      typeof payload.status === 'number'
        ? payload.status
        : typeof (error as FetchErrorLike | undefined)?.statusCode === 'number'
          ? (error as FetchErrorLike).statusCode!
          : null,
    traceId:
      (isNonEmptyString(payload.traceId) && payload.traceId) ||
      (isNonEmptyString(payload.id) && payload.id) ||
      null,
    errors:
      validationMessages.length > 0
        ? (payload.errors as ServerValidationErrors)
        : undefined,
  };
}

export const getServerErrors = (error: unknown) => {
  const normalized = normalizeServerError(error);

  if (normalized.errors) {
    const validationMessages = collectValidationErrors(normalized.errors);

    if (validationMessages.length > 0) {
      return validationMessages.join('\n');
    }
  }

  return normalized.message;
};

export function isFetchErrorLike(e: unknown): e is FetchErrorLike {
  return typeof e === 'object' && e !== null && 'data' in e;
}
