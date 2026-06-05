import axios from 'axios';

export function resolveChatError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Falha de rede. Verifique sua conexão e tente de novo.';
    }
    const status = error.response.status;
    const body = error.response.data as { message?: string } | undefined;
    if (status === 429) {
      return (
        body?.message ??
        'Muitas perguntas em pouco tempo. Aguarde um minuto e tente de novo.'
      );
    }
    if (status >= 500) {
      return 'O servidor está indisponível. Tente novamente em instantes.';
    }
    if (status === 400 && body?.message) {
      return body.message;
    }
  }
  return 'Não foi possível obter resposta. Tente novamente em instantes.';
}
