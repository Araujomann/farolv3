/**
 * Configuração do Jest para o aplicativo Farol.
 *
 * - Preset `jest-expo/android`: o app é distribuído para Android, então os
 *   testes resolvem `Platform.OS === "android"` e os arquivos `.android.*`.
 * - Os testes ficam em `__tests__/` (fora de `app/`, como recomenda o Expo
 *   Router), separados por tipo: unit, components e integration.
 */
/** @type {import('jest').Config} */
module.exports = {
    preset: "jest-expo/android",
    rootDir: __dirname,
    testMatch: ["<rootDir>/__tests__/**/*.test.ts?(x)"],
    moduleNameMapper: {
        // babel.config.ts usa jsxImportSource "nativewind"; no Metro o
        // resolver do NativeWind v5 redireciona esse runtime para o do React.
        "^nativewind/jsx-runtime$": "react/jsx-runtime",
        "^nativewind/jsx-dev-runtime$": "react/jsx-dev-runtime",
        // global.css é processado pelo Metro/NativeWind; nos testes, vazio.
        "\\.css$": "<rootDir>/test/mocks/styleMock.js",
    },
    globalSetup: "<rootDir>/test/setup/globalSetup.js",
    setupFiles: ["<rootDir>/test/setup/env.ts"],
    setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.ts"],
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|lucide-react-native|@gluestack-ui/.*|nativewind|react-native-css|@legendapp/.*|@rnmapbox/.*|tailwind-variants)",
    ],
    // Metade dos núcleos: limita o uso de memória em máquinas modestas.
    // Para rodar um arquivo por vez: npm run test:serial.
    maxWorkers: "50%",
    clearMocks: true,
    restoreMocks: true,
    // V8: o provedor padrão (Babel/istanbul) instrumenta os arquivos não
    // carregados por nenhum teste no processo principal, onde o Babel não
    // consegue carregar o plugin do NativeWind a partir do babel.config.ts
    // ("require is not defined"). Esses arquivos sumiam do relatório e a
    // cobertura parecia maior do que é. Com V8 eles entram com 0%.
    coverageProvider: "v8",
    collectCoverageFrom: [
        "app/**/*.{ts,tsx}",
        "src/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        // Variantes web: o app é distribuído só para Android.
        "!**/*.web.{ts,tsx}",
        // Declarações de tipo não têm código executável.
        "!**/*.d.ts",
        // Arquivos vazios (0 bytes) reservados em auth/ (ver ARCHITECTURE.MD).
        "!src/features/auth/components/{LoginForm,RegisterForm}.tsx",
        "!src/features/auth/hooks/{useAuth,useLoginForm}.ts",
        "!src/features/auth/services/authService.ts",
        "!src/features/auth/types/auth.types.ts",
    ],
    // Metas definidas depois da primeira medição (58,6% linhas, 84,3%
    // ramificações, 68,0% funções): um pouco abaixo do medido, para barrar
    // regressões sem exigir cobertura de telas que dependem do mapa nativo.
    // As camadas de regra de negócio têm metas próprias, mais altas; o Jest
    // calcula o "global" só com os arquivos fora delas (51,9% de linhas).
    coverageThreshold: {
        global: { statements: 48, branches: 78, functions: 60, lines: 48 },
        "./src/api/": { statements: 80, branches: 80, functions: 70, lines: 80 },
        "./src/features/map/services/": { statements: 90, branches: 85, functions: 90, lines: 90 },
        "./src/features/map/utils/": { statements: 95, branches: 95, functions: 95, lines: 95 },
        "./src/features/report/utils/": { statements: 95, branches: 95, functions: 95, lines: 95 },
        "./src/features/home/utils/": { statements: 95, branches: 95, functions: 95, lines: 95 },
        "./src/i18n/": { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
    coverageDirectory: "<rootDir>/coverage",
    coverageReporters: ["text", "text-summary", "html", "lcov", "json-summary"],
};
