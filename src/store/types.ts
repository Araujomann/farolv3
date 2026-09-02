// Defina o tipo do seu Usuário de acordo com o que o Backend vai te retornar
export type User = {
  id: string;
  name: string;
  email: string;
  is_verified: boolean;
  email_verified_at: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean; // Controla se estamos verificando o SecureStore (útil para SplashScreen)
};

export type AuthActions = {
  signIn: (user: User, token: string, refresh_token: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
};