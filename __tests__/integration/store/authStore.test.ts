/**
 * Store de autenticação (Zustand) integrada aos serviços reais de
 * autenticação e de notificações, com a API SIMULADA no adaptador HTTP e
 * o armazenamento seguro em memória.
 */
import { useAuthStore } from "@/src/store/authStore";
import { makeUser } from "@/test/fixtures";
import { __getStore, __reset } from "@/test/mocks/expoSecureStore";
import { silenceConsole } from "@/test/utils/console";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

const http = installHttpMock();

const initialState = useAuthStore.getState();

beforeEach(() => {
    useAuthStore.setState(initialState, true);
});

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("signIn", () => {
    it("salva os tokens e autentica o usuário verificado sem pedir código", async () => {
        const user = makeUser();

        await useAuthStore.getState().signIn(user, "access", "refresh");

        expect(__getStore()).toEqual({ token: "access", refresh_token: "refresh" });
        expect(useAuthStore.getState()).toMatchObject({
            user,
            token: "access",
            isLoading: false,
            emailVerificationPrompt: null,
        });
    });

    it.each(["login", "register"] as const)(
        "marca a verificação de e-mail pendente após %s",
        async (source) => {
            const user = makeUser({ is_email_verified: false });

            await useAuthStore.getState().signIn(user, "a", "r", source);

            expect(useAuthStore.getState().emailVerificationPrompt).toBe(source);
        },
    );

    it("permite adiar a verificação", async () => {
        await useAuthStore
            .getState()
            .signIn(makeUser({ is_email_verified: false }), "a", "r");

        useAuthStore.getState().dismissEmailVerificationPrompt();

        expect(useAuthStore.getState().emailVerificationPrompt).toBeNull();
    });
});

describe("restoreSession", () => {
    it("sem token salvo, termina o carregamento sem usuário", async () => {
        await useAuthStore.getState().restoreSession();

        expect(useAuthStore.getState()).toMatchObject({
            user: null,
            token: null,
            isLoading: false,
        });
        expect(http.calls).toHaveLength(0);
    });

    it("com token salvo, busca o usuário atualizado na API", async () => {
        const user = makeUser();
        __reset({ token: "saved", refresh_token: "refresh" });
        http.on("GET", "/users/me", { status: 200, data: { data: user } });

        await useAuthStore.getState().restoreSession();

        expect(useAuthStore.getState()).toMatchObject({
            user,
            token: "saved",
            isLoading: false,
        });
        // Sessão restaurada não reabre a tela de código de verificação.
        expect(useAuthStore.getState().emailVerificationPrompt).toBeNull();
    });

    it("descarta a sessão quando o token não pode ser renovado", async () => {
        __reset({ token: "expired", refresh_token: "revoked" });
        http.on("GET", "/users/me", apiError(401, "TOKEN_EXPIRED"));
        http.on("POST", "/auth/refresh", apiError(401, "INVALID_REFRESH_TOKEN"));

        await useAuthStore.getState().restoreSession();

        expect(useAuthStore.getState()).toMatchObject({
            user: null,
            token: null,
            isLoading: false,
        });
        expect(__getStore()).toEqual({});
    });
});

describe("signOut", () => {
    it("remove o dispositivo das notificações, revoga a sessão e limpa os dados", async () => {
        await useAuthStore.getState().signIn(makeUser(), "access", "refresh");
        __reset({
            token: "access",
            refresh_token: "refresh",
            expo_push_token: "ExponentPushToken[abc]",
        });
        http.on("DELETE", "/notifications/push-token", { status: 204 });
        http.on("POST", "/auth/logout", { status: 204 });

        await useAuthStore.getState().signOut();
        await flush();

        const [unregister] = http.callsTo("DELETE", "/notifications/push-token");
        expect(JSON.parse(unregister.data)).toEqual({
            token: "ExponentPushToken[abc]",
        });
        const [logout] = http.callsTo("POST", "/auth/logout");
        expect(JSON.parse(logout.data)).toEqual({ refreshToken: "refresh" });
        expect(__getStore()).toEqual({});
        expect(useAuthStore.getState()).toMatchObject({ user: null, token: null });
    });

    it("sai mesmo sem rede (falhas da API não bloqueiam a saída)", async () => {
        const error = silenceConsole("error");
        await useAuthStore.getState().signIn(makeUser(), "access", "refresh");
        __reset({
            token: "access",
            refresh_token: "refresh",
            expo_push_token: "ExponentPushToken[abc]",
        });
        http.on("DELETE", "/notifications/push-token", apiError(503, "OFFLINE"));
        http.on("POST", "/auth/logout", apiError(503, "OFFLINE"));

        await useAuthStore.getState().signOut();
        await flush();

        expect(error).toHaveBeenCalledWith(
            "Falha ao remover o dispositivo das notificações",
            expect.anything(),
        );
        expect(__getStore()).toEqual({ expo_push_token: "ExponentPushToken[abc]" });
        expect(useAuthStore.getState().token).toBeNull();
    });
});

describe("clearDeletedAccountSession", () => {
    it("limpa tokens e o token de push sem chamar a API", async () => {
        await useAuthStore.getState().signIn(makeUser(), "access", "refresh");
        __reset({
            token: "access",
            refresh_token: "refresh",
            expo_push_token: "ExponentPushToken[abc]",
        });

        await useAuthStore.getState().clearDeletedAccountSession();

        expect(__getStore()).toEqual({});
        expect(http.calls).toHaveLength(0);
        expect(useAuthStore.getState().user).toBeNull();
    });
});
