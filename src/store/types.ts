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

export type AuthState = {
    user: User | null;
    token: string | null;
    isLoading: boolean; // Controla se estamos verificando o SecureStore (útil para SplashScreen)
};

export type AuthActions = {
    signIn: (user: User, token: string, refreshToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    restoreSession: () => Promise<void>;
    setUser: (user: User) => void;
};
