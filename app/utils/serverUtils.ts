type ServerError =
  | string
  | { error?: string }
  | { message: string }
  | { errors?: Record<string, string> };

export const getServerErrors = (error: ServerError) => {
  let errorMessage =
    'Ocorreu um erro ao enviar o seu pedido. Tente novamente. \n';

  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if ('error' in error && error.error) {
      errorMessage = error.error;
    } else if ('message' in error) {
      errorMessage = error.message;
    } else if ('errors' in error && error.errors) {
      for (const [key, value] of Object.entries(error.errors)) {
        errorMessage += `${key}: ${value}\n`;
      }
    }
  }

  return errorMessage;
};
