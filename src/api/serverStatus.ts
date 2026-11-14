import type { InternalAxiosRequestConfig } from "axios";
import { create } from "zustand";

/**
 * Tempo máximo de espera por uma resposta da API.
 *
 * A Crash Map API roda no plano gratuito do Render, que hiberna o serviço após
 * ~15 min sem acesso; a primeira requisição depois disso espera a API acordar
 * (~1 min). Com o limite antigo (10 s) essa primeira requisição falhava.
 */
export const API_TIMEOUT_MS = 70_000;

/** A partir de quanto tempo uma requisição é considerada lenta (exibe o aviso). */
const SLOW_REQUEST_NOTICE_MS = 4_000;

interface ServerStatusState {
    /** Requisições em andamento há mais de SLOW_REQUEST_NOTICE_MS. */
    slowRequests: number;
}

export const useServerStatusStore = create<ServerStatusState>(() => ({
    slowRequests: 0,
}));

type TrackedConfig = InternalAxiosRequestConfig & {
    _slowTimer?: ReturnType<typeof setTimeout>;
    _markedSlow?: boolean;
};

function changeSlowRequests(delta: number) {
    useServerStatusStore.setState((state) => ({
        slowRequests: Math.max(0, state.slowRequests + delta),
    }));
}

/** Começa a acompanhar uma requisição (chamado no interceptor de requisição). */
export function beginRequestTracking(config: InternalAxiosRequestConfig) {
    // Uma requisição refeita (ex.: após renovar o token) reaproveita o config.
    endRequestTracking(config);

    const tracked = config as TrackedConfig;
    tracked._slowTimer = setTimeout(() => {
        tracked._slowTimer = undefined;
        tracked._markedSlow = true;
        changeSlowRequests(1);
    }, SLOW_REQUEST_NOTICE_MS);
}

/** Encerra o acompanhamento, com sucesso ou erro (interceptor de resposta). */
export function endRequestTracking(config?: InternalAxiosRequestConfig) {
    if (!config) return;

    const tracked = config as TrackedConfig;
    if (tracked._slowTimer) {
        clearTimeout(tracked._slowTimer);
        tracked._slowTimer = undefined;
    }
    if (tracked._markedSlow) {
        tracked._markedSlow = false;
        changeSlowRequests(-1);
    }
}

/** `true` enquanto houver requisição demorando (servidor provavelmente acordando). */
export function useIsServerSlow() {
    return useServerStatusStore((state) => state.slowRequests > 0);
}
