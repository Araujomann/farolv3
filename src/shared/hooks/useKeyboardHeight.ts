import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";

/**
 * Altura atual do teclado (0 quando fechado), via `keyboardDidShow` e
 * `keyboardDidHide`.
 *
 * `onKeyboardDidShow` é capturado apenas na montagem, como os listeners
 * registrados com dependências vazias: use-o somente com funções que leem
 * refs ou valores estáveis.
 */
export function useKeyboardHeight(onKeyboardDidShow?: () => void) {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const onKeyboardDidShowRef = useRef(onKeyboardDidShow);

    useEffect(() => {
        const keyboardDidShowSubscription = Keyboard.addListener(
            "keyboardDidShow",
            (event) => {
                setKeyboardHeight(event.endCoordinates.height);
                onKeyboardDidShowRef.current?.();
            },
        );
        const keyboardDidHideSubscription = Keyboard.addListener(
            "keyboardDidHide",
            () => setKeyboardHeight(0),
        );

        return () => {
            keyboardDidShowSubscription.remove();
            keyboardDidHideSubscription.remove();
        };
    }, []);

    return keyboardHeight;
}
