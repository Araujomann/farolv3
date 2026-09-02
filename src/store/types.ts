// Defina o tipo do seu Usuário de acordo com o que o Backend vai te retornar
export type User = {
  id: string;
  name: string;
  email: string;
  // adicione foto, token de notificação, etc, se necessário no futuro
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean; // Controla se estamos verificando o SecureStore (útil para SplashScreen)
};

export type AuthActions = {
  signIn: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
};