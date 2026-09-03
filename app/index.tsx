import { Redirect } from "expo-router";

// O auth guard no _layout.tsx cuida de redirecionar para /(tabs)/home
// se o usuário já tiver token válido. Aqui apenas enviamos para o
// fluxo de auth como ponto de entrada seguro.
export default function Index() {
    return <Redirect href="/(auth)/login" />;
}
