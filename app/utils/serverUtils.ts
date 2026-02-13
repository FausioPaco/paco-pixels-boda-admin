export type ApiServerError =
  | string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | any
  | { error?: string }
  | { message: string }
  | { errors?: Record<string, string> };

export const getServerErrors = (error: ApiServerError) => {
  let errorMessage = 'Ocorreu um erro ao enviar o seu pedido: \n';

  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if ('error' in error && error.error) {
      errorMessage = error.error;
    } else if ('message' in error) {
      errorMessage = error.message;
    } else if ('errors' in error && error.errors) {
      for (const [_, value] of Object.entries(error.errors)) {
        errorMessage += `${value}\n`;
      }
    }
  }

  return errorMessage;
};
