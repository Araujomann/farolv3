export type UserRole = "user" | "moderator" | "admin";

export type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    is_email_verified: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
};

// Como a sessão foi iniciada: decide se mostramos a tela de código de verificação.
export type SignInSource = "login" | "register";

export type AuthState = {
    user: User | null;
    token: string | null;
    isLoading: boolean; // Controla se estamos verificando o SecureStore (útil para SplashScreen)
    // Quando != null e o e-mail não estiver verificado, o app abre a tela de código
    // logo após o login/cadastro. Fica null ao restaurar a sessão ou após "Verificar depois".
    emailVerificationPrompt: SignInSource | null;
};

export type AuthActions = {
    signIn: (
        user: User,
        token: string,
        refreshToken: string,
        source?: SignInSource,
    ) => Promise<void>;
    dismissEmailVerificationPrompt: () => void;
    signOut: () => Promise<void>;
    restoreSession: () => Promise<void>;
    setUser: (user: User) => void;
};
