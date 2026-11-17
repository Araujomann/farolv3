/**
 * Componentes compartilhados das telas de autenticação.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Mail } from "lucide-react-native";

import { AuthServerError } from "@/src/features/auth/components/AuthServerError";
import { AuthTextField } from "@/src/features/auth/components/AuthTextField";
import { tr } from "@/src/i18n";

// O botão de senha fica num InputSlot do Gluestack com
// `accessibilityElementsHidden` (propriedade só do iOS). No Android, alvo do
// app, ele continua acessível; por isso a busca inclui elementos ocultos.
const hidden = { includeHiddenElements: true };

describe("AuthTextField", () => {
    it("mostra o rótulo e repassa a digitação", () => {
        const onChangeText = jest.fn();
        render(
            <AuthTextField
                label="E-mail"
                icon={Mail}
                placeholder="Digite seu e-mail"
                onChangeText={onChangeText}
                value=""
            />,
        );

        expect(screen.getByText("E-mail")).toBeTruthy();
        fireEvent.changeText(
            screen.getByPlaceholderText("Digite seu e-mail"),
            "maria@exemplo.com",
        );
        expect(onChangeText).toHaveBeenCalledWith("maria@exemplo.com");
    });

    /**
     * DEFEITO CONHECIDO (acessibilidade). O `InputField` do Gluestack define
     * `aria-label="Input Field"` por padrão e o `TextInput` do React Native
     * dá prioridade a `aria-label` sobre `accessibilityLabel`. O rótulo que
     * as telas passam ("E-mail", "Senha"...) é descartado e o leitor de tela
     * anuncia "Input Field". `it.failing` passa enquanto o defeito existir
     * e passará a falhar quando ele for corrigido, avisando para trocar por
     * `it`. Ver RELATORIO_TESTES_AUTOMATIZADOS.md, seção 14.
     */
    it.failing("[defeito conhecido] expõe o rótulo do campo ao leitor de tela", () => {
        render(<AuthTextField label="E-mail" icon={Mail} accessibilityLabel="E-mail" />);

        expect(screen.getByLabelText("E-mail")).toBeTruthy();
    });

    it("traduz a mensagem de validação recebida como chave", () => {
        render(
            <AuthTextField
                label="E-mail"
                icon={Mail}
                error={{ type: "invalid", message: "auth.validation.invalidEmail" }}
            />,
        );

        expect(screen.getByText(tr("auth.validation.invalidEmail"))).toBeTruthy();
    });

    it("alterna a visibilidade da senha pelo botão com rótulo", () => {
        const onToggle = jest.fn();
        const { rerender } = render(
            <AuthTextField
                label="Senha"
                icon={Mail}
                passwordVisibility={{ isVisible: false, onToggle }}
            />,
        );

        fireEvent.press(screen.getByLabelText(tr("auth.showPassword"), hidden));
        expect(onToggle).toHaveBeenCalled();

        rerender(
            <AuthTextField
                label="Senha"
                icon={Mail}
                passwordVisibility={{ isVisible: true, onToggle }}
            />,
        );
        expect(screen.getByLabelText(tr("auth.hidePassword"), hidden)).toBeTruthy();
    });

    it("não mostra o botão de senha em campos comuns", () => {
        render(<AuthTextField label="Nome" icon={Mail} />);

        expect(screen.queryByLabelText(tr("auth.showPassword"), hidden)).toBeNull();
    });
});

describe("AuthServerError", () => {
    it("exibe a mensagem recebida", () => {
        render(<AuthServerError message="E-mail ou senha inválidos" />);

        expect(screen.getByText("E-mail ou senha inválidos")).toBeTruthy();
    });
});
