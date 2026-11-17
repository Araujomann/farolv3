import axios from "axios";

import { api } from "@/src/api/client";
import { createHttpMock } from "./httpMock";

/**
 * Liga o servidor simulado à instância `api` do app e ao `axios` global
 * (usado pelo cliente para renovar o token). Restaura os adaptadores
 * originais ao fim de cada teste.
 */
export function installHttpMock() {
    const http = createHttpMock();
    const originalApiAdapter = api.defaults.adapter;
    const originalAxiosAdapter = axios.defaults.adapter;

    beforeEach(() => {
        http.reset();
        api.defaults.adapter = http.adapter;
        axios.defaults.adapter = http.adapter;
        delete api.defaults.headers.common.Authorization;
    });

    afterEach(() => {
        api.defaults.adapter = originalApiAdapter;
        axios.defaults.adapter = originalAxiosAdapter;
    });

    return http;
}
