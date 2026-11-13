// Abre a tela de código de verificação a partir de dentro do app:
// envia um novo código ao abrir e "Verificar depois" volta para a tela anterior.
export const verifyEmailFromAppRoute = {
    pathname: "/(auth)/verify-email",
    params: { send: "1", from: "app" },
} as const;
