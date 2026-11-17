/**
 * Cliente HTTP (src/api/client.ts) com a CrashMap API SIMULADA no
 * adaptador do Axios. Verifica os interceptadores reais: envio do token,
 * renovação automática após 401 e limpeza da sessão quando ela expira.
 */
import { api } from "@/src/api/client";
import { __getStore, __reset } from "@/test/mocks/expoSecureStore";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

const http = installHttpMock();

const refreshed = {
    status: 200,
    data: {
        data: {
            tokens: { accessToken: "new-access", refreshToken: "new-refresh" },
        },
    },
};

afterEach(() => {
    delete api.defaults.headers.common.Authorization;
});

it("usa a URL da API definida no ambiente", () => {
    expect(api.defaults.baseURL).toBe("http://api.farol.test");
});

it("envia o token salvo no cabeçalho Authorization", async () => {
    __reset({ token: "saved-token" });
    http.on("GET", "/users/me", { status: 200, data: { data: {} } });

    await api.get("/users/me");

    expect(http.calls[0].headers.Authorization).toBe("Bearer saved-token");
});

it("não envia Authorization quando não há sessão", async () => {
    http.on("GET", "/accidents/map", { status: 200, data: { data: [] } });

    await api.get("/accidents/map");

    expect(http.calls[0].headers.Authorization).toBeUndefined();
});

it("renova o token após 401 e refaz a requisição original", async () => {
    __reset({ token: "expired", refresh_token: "refresh-1" });
    http.once("GET", "/users/me", apiError(401, "TOKEN_EXPIRED"));
    http.on("POST", "/auth/refresh", refreshed);
    http.on("GET", "/users/me", { status: 200, data: { data: { id: "u1" } } });

    const response = await api.get("/users/me");

    expect(response.data).toEqual({ data: { id: "u1" } });
    const [refreshCall] = http.callsTo("POST", "/auth/refresh");
    expect(refreshCall.url).toBe("http://api.farol.test/auth/refresh");
    expect(JSON.parse(refreshCall.data)).toEqual({ refreshToken: "refresh-1" });
    expect(http.calls.at(-1)?.headers.Authorization).toBe("Bearer new-access");
    expect(__getStore()).toEqual({
        token: "new-access",
        refresh_token: "new-refresh",
    });
});

it("faz uma única renovação para vários 401 simultâneos", async () => {
    __reset({ token: "expired", refresh_token: "refresh-1" });
    let releaseRefresh: () => void = () => undefined;
    const refreshGate = new Promise<void>((resolve) => {
        releaseRefresh = resolve;
    });
    http.once("GET", "/a", apiError(401, "TOKEN_EXPIRED"));
    http.once("GET", "/b", apiError(401, "TOKEN_EXPIRED"));
    http.on("POST", "/auth/refresh", async () => {
        await refreshGate;
        return refreshed;
    });
    http.on("GET", "/a", { status: 200, data: "A" });
    http.on("GET", "/b", { status: 200, data: "B" });

    const requests = Promise.all([api.get("/a"), api.get("/b")]);
    await new Promise((resolve) => setImmediate(resolve));
    releaseRefresh();
    const [a, b] = await requests;

    expect(a.data).toBe("A");
    expect(b.data).toBe("B");
    expect(http.callsTo("POST", "/auth/refresh")).toHaveLength(1);
    const retriedB = http.callsTo("GET", "/b").at(-1);
    expect(retriedB?.headers.Authorization).toBe("Bearer new-access");
});

it("encerra a sessão local quando a renovação falha", async () => {
    __reset({ token: "expired", refresh_token: "revoked" });
    http.on("GET", "/users/me", apiError(401, "TOKEN_EXPIRED"));
    http.on("POST", "/auth/refresh", apiError(401, "INVALID_REFRESH_TOKEN"));

    await expect(api.get("/users/me")).rejects.toMatchObject({
        response: { status: 401 },
    });
    expect(__getStore()).toEqual({});
});

it("encerra a sessão sem chamar a API quando não há refresh token", async () => {
    __reset({ token: "expired" });
    http.on("GET", "/users/me", apiError(401, "TOKEN_EXPIRED"));

    await expect(api.get("/users/me")).rejects.toThrow(
        "Sem refresh_token disponível",
    );
    expect(http.callsTo("POST", "/auth/refresh")).toHaveLength(0);
    expect(__getStore()).toEqual({});
});

it("não tenta renovar quando a requisição refeita volta a dar 401", async () => {
    __reset({ token: "expired", refresh_token: "refresh-1" });
    http.on("GET", "/users/me", apiError(401, "STILL_UNAUTHORIZED"));
    http.on("POST", "/auth/refresh", refreshed);

    await expect(api.get("/users/me")).rejects.toMatchObject({
        response: { status: 401 },
    });
    expect(http.callsTo("POST", "/auth/refresh")).toHaveLength(1);
    expect(http.callsTo("GET", "/users/me")).toHaveLength(2);
});

it("repassa outros erros sem tentar renovar", async () => {
    __reset({ token: "valid", refresh_token: "refresh-1" });
    http.on("GET", "/users/me", apiError(500, "INTERNAL"));

    await expect(api.get("/users/me")).rejects.toMatchObject({
        response: { status: 500 },
    });
    expect(http.callsTo("POST", "/auth/refresh")).toHaveLength(0);
    expect(__getStore()).toEqual({ token: "valid", refresh_token: "refresh-1" });
});
