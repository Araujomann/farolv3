/**
 * Substituto leve do `lucide-react-native`.
 *
 * O pacote real publica ~1.600 ícones em ESM (.mjs), que o preset do Jest
 * não transforma, e carregá-los em cada suíte aumenta o uso de memória. Os
 * ícones são apenas apresentação; aqui cada um vira um `View` vazio com o
 * nome do ícone em `testID`, o que basta para os testes de comportamento.
 */
import { forwardRef, type ComponentProps } from "react";
import { View } from "react-native";

const icons = new Map<string, unknown>();

function createIcon(name: string) {
    const Icon = forwardRef<View, ComponentProps<typeof View>>(
        function LucideIcon(_props, ref) {
            return <View ref={ref} testID={`icon-${name}`} />;
        },
    );
    Icon.displayName = name;
    return Icon;
}

module.exports = new Proxy(
    {},
    {
        get(_target, name) {
            if (name === "__esModule") return true;
            if (typeof name !== "string") return undefined;
            if (!icons.has(name)) icons.set(name, createIcon(name));
            return icons.get(name);
        },
    },
);
