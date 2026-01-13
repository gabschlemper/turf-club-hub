/**
 * Maps Supabase auth error codes to user-friendly messages in Portuguese
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return 'Erro desconhecido';

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: string })?.code;

  // Map common error codes
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'E-mail ou senha incorretos',
    'user_already_exists': 'Este e-mail já está cadastrado',
    'email_not_confirmed': 'E-mail ainda não confirmado. Verifique sua caixa de entrada',
    'weak_password': 'Senha muito fraca. Use pelo menos 6 caracteres',
    'user_not_found': 'Usuário não encontrado',
    'invalid_email': 'E-mail inválido',
    'email_taken': 'Este e-mail já está em uso',
    'signup_disabled': 'Cadastro de novos usuários está desativado',
    'over_request_rate_limit': 'Muitas tentativas. Aguarde alguns minutos',
  };

  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Map by message content
  if (errorMessage.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos';
  }
  if (errorMessage.includes('User already registered')) {
    return 'Este e-mail já está cadastrado';
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada';
  }
  if (errorMessage.includes('Password should be')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres';
  }
  if (errorMessage.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos';
  }
  if (errorMessage.includes('network')) {
    return 'Erro de conexão. Verifique sua internet';
  }

  return 'Ocorreu um erro. Tente novamente';
}
