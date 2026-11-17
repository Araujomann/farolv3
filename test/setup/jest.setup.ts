import * as expoRouter from "../mocks/expoRouter";
import * as notifications from "../mocks/expoNotifications";
import * as secureStore from "../mocks/expoSecureStore";
import { useLanguageStore } from "@/src/i18n";

// O Keystore do Android não existe no Node: usa o armazenamento em memória.
jest.mock("expo-secure-store", () => require("../mocks/expoSecureStore"));

// Notificações push dependem de FCM e de módulos nativos.
jest.mock("expo-notifications", () => require("../mocks/expoNotifications"));

// Mock oficial da biblioteca: insets zerados, sem depender do provider nativo.
jest.mock("react-native-safe-area-context", () =>
    require("react-native-safe-area-context/jest/mock").default,
);

// Ícones são apenas apresentação (ver test/mocks/lucideReactNative.tsx).
jest.mock("lucide-react-native", () => require("../mocks/lucideReactNative"));

// Compatibilidade NativeWind v5 × mocks do React Native no Jest.
// O plugin Babel do react-native-css troca `ScrollView` do React Native por
// um wrapper que copia as propriedades estáticas com `Object.entries`. No
// mock de Jest do RN, `ScrollView.Context` não é uma propriedade própria do
// componente (é herdada) e fica de fora; a VirtualizedList (base da
// FlatList) lê `ScrollView.Context.Consumer` e quebra. Em produção o RN
// atribui `ScrollViewWrapper.Context = ScrollViewContext` diretamente, então
// isto afeta só os testes: aqui apenas devolvemos ao wrapper o Context.
{
    const { ScrollView: NativeScrollView } = jest.requireActual("react-native");
    const { ScrollView: CssScrollView } = jest.requireActual(
        "react-native-css/components/ScrollView",
    );
    if (!CssScrollView.Context) CssScrollView.Context = NativeScrollView.Context;
}

beforeEach(() => {
    secureStore.__reset();
    notifications.__reset();
    // Parâmetros e segmentos de rota simulados não vazam entre testes.
    expoRouter.__reset();
    // O idioma "system" dependeria da localidade da máquina que roda os
    // testes; fixamos pt-BR, idioma principal do aplicativo.
    useLanguageStore.setState({ preference: "pt-BR", isHydrated: true });
});
