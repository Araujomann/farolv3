import { useCallback, useRef, useState } from "react";
import { BackHandler, Keyboard } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";

/**
 * Impede sair do formulário de relato sem confirmação: intercepta o
 * `beforeRemove` da navegação e o botão voltar do Android (que antes fecha
 * o teclado, se aberto) e controla o diálogo de confirmação de saída.
 */
export function useReportExitGuard(keyboardHeight: number) {
    const navigation = useNavigation();
    const tabsNavigation = useNavigation("/(tabs)");
    const allowExitRef = useRef(false);
    const [isExitDialogVisible, setIsExitDialogVisible] = useState(false);

    const showExitConfirmation = useCallback(() => {
        setIsExitDialogVisible(true);
    }, []);

    const closeExitDialog = () => {
        setIsExitDialogVisible(false);
    };

    /** Libera a próxima saída da tela sem pedir confirmação. */
    const allowExit = () => {
        allowExitRef.current = true;
    };

    const handleExitReport = () => {
        setIsExitDialogVisible(false);
        allowExitRef.current = true;
        navigation.dispatch({ type: "POP_TO_TOP" });
        tabsNavigation.dispatch({
            type: "JUMP_TO",
            payload: { name: "map" },
        });
    };

    const handleBackPress = useCallback(() => {
        if (keyboardHeight > 0) {
            Keyboard.dismiss();
            return;
        }

        showExitConfirmation();
    }, [keyboardHeight, showExitConfirmation]);

    useFocusEffect(
        useCallback(() => {
            allowExitRef.current = false;
            const beforeRemoveSubscription = navigation.addListener(
                "beforeRemove",
                (event) => {
                    if (allowExitRef.current) {
                        return;
                    }

                    event.preventDefault();
                    showExitConfirmation();
                },
            );
            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    handleBackPress();
                    return true;
                },
            );

            return () => {
                beforeRemoveSubscription();
                subscription.remove();
            };
        }, [handleBackPress, navigation, showExitConfirmation]),
    );

    return {
        isExitDialogVisible,
        closeExitDialog,
        handleBackPress,
        handleExitReport,
        allowExit,
    };
}
