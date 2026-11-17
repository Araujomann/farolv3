/**
 * Silencia avisos esperados. Vários hooks registram `console.warn` em
 * desenvolvimento ao tratar uma falha; nos testes de falha isso é o
 * comportamento previsto e só poluiria a saída. Retorna o espião para que
 * o teste possa verificar a chamada quando ela fizer parte do cenário.
 * O espião é restaurado automaticamente (`restoreMocks` no jest.config).
 */
export function silenceConsole(method: "warn" | "error" = "warn") {
    return jest.spyOn(console, method).mockImplementation(() => undefined);
}
