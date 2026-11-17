import {
    AxiosError,
    type AxiosAdapter,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";

/**
 * Servidor HTTP simulado no nível do adaptador do Axios.
 *
 * Substitui apenas o transporte: interceptadores, cabeçalhos, renovação de
 * token e tratamento de erros do cliente real continuam sendo executados.
 * Nenhuma requisição sai do processo. Isto NÃO é um teste contra a CrashMap
 * API real: as respostas são definidas pelo próprio teste.
 */
export type MockReply = { status: number; data?: unknown };
type ReplyFactory = (
    config: InternalAxiosRequestConfig,
) => MockReply | Promise<MockReply>;

type Route = {
    method: string;
    url: string;
    reply: MockReply | ReplyFactory;
    once: boolean;
};

export type HttpMock = ReturnType<typeof createHttpMock>;

export function createHttpMock() {
    const routes: Route[] = [];
    const calls: InternalAxiosRequestConfig[] = [];

    const adapter: AxiosAdapter = async (config) => {
        calls.push(config);
        const method = (config.method ?? "get").toUpperCase();
        const url = config.url ?? "";
        const index = routes.findIndex(
            (route) =>
                route.method === method &&
                (url === route.url || url.endsWith(route.url)),
        );
        if (index === -1) {
            throw new Error(`Requisição não prevista no teste: ${method} ${url}`);
        }

        const route = routes[index];
        if (route.once) routes.splice(index, 1);
        const reply =
            typeof route.reply === "function"
                ? await route.reply(config)
                : route.reply;

        const response: AxiosResponse = {
            data: reply.data,
            status: reply.status,
            statusText: String(reply.status),
            headers: {},
            config,
            request: {},
        };
        if (reply.status >= 200 && reply.status < 300) return response;

        throw new AxiosError(
            `Request failed with status code ${reply.status}`,
            reply.status >= 500
                ? AxiosError.ERR_BAD_RESPONSE
                : AxiosError.ERR_BAD_REQUEST,
            config,
            {},
            response,
        );
    };

    const add = (
        method: string,
        url: string,
        reply: MockReply | ReplyFactory,
        once: boolean,
    ) => {
        routes.push({ method: method.toUpperCase(), url, reply, once });
    };

    return {
        adapter,
        calls,
        /** Responde sempre que a rota for chamada. */
        on: (method: string, url: string, reply: MockReply | ReplyFactory) =>
            add(method, url, reply, false),
        /** Responde só na próxima chamada da rota (tem prioridade por ordem). */
        once: (method: string, url: string, reply: MockReply | ReplyFactory) =>
            add(method, url, reply, true),
        callsTo: (method: string, url: string) =>
            calls.filter(
                (call) =>
                    (call.method ?? "get").toUpperCase() ===
                        method.toUpperCase() &&
                    (call.url ?? "").endsWith(url),
            ),
        reset: () => {
            routes.length = 0;
            calls.length = 0;
        },
    };
}

/** Erro no formato de resposta da API: `{ error: { code, message } }`. */
export function apiError(
    status: number,
    code: string,
    message = code,
): MockReply {
    return { status, data: { error: { code, message } } };
}
