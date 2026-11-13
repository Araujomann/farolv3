import { create } from "zustand";
import {
    cancelAnimation,
    Easing,
    makeMutable,
    withTiming,
} from "react-native-reanimated";

import { mixHex } from "@/components/ui/AnimatedColor";

/** Cor exibida enquanto a cor real do título ainda não foi carregada. */
export const DEFAULT_TITLE_COLOR = "#0969D7";
export const TITLE_COLOR_TRANSITION_MS = 1700;
export const titleColorEasing = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * Progresso (0 → 1) da transição entre `fromColor` e `toColor`.
 * Vive na thread de UI, então a animação não depende da thread JS.
 */
export const titleColorProgress = makeMutable(1);

type ProfileTitleColorState = {
    /** Cor final (alvo) do título do usuário. */
    titleColor: string;
    /** Cores entre as quais a interface está transicionando. */
    fromColor: string;
    toColor: string;
    /** `true` depois que a cor real do título foi carregada ao menos uma vez. */
    isTitleColorResolved: boolean;
    setTitleColor: (color: string) => void;
};

type Cancel = () => void;

/** Executa `callback` depois que o próximo frame foi pintado. */
function afterNextPaint(callback: () => void): Cancel {
    let secondFrame: number | null = null;
    const firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(callback);
    });

    return () => {
        cancelAnimationFrame(firstFrame);
        if (secondFrame !== null) {
            cancelAnimationFrame(secondFrame);
        }
    };
}

/**
 * Aguarda a interface assentar: os componentes recém-montados são pintados
 * e a thread JS termina o trabalho pendente (timers só disparam quando ela
 * está livre). Só então chama `callback`.
 */
export function afterUiSettles(callback: () => void, settleMs = 140): Cancel {
    let cancelCurrent: Cancel = afterNextPaint(() => {
        const timeout = setTimeout(() => {
            cancelCurrent = afterNextPaint(callback);
        }, settleMs);
        cancelCurrent = () => clearTimeout(timeout);
    });

    return () => cancelCurrent();
}

let pendingTransition: Cancel | null = null;

export const useProfileTitleColorStore = create<ProfileTitleColorState>(
    (set, get) => ({
        titleColor: DEFAULT_TITLE_COLOR,
        fromColor: DEFAULT_TITLE_COLOR,
        toColor: DEFAULT_TITLE_COLOR,
        isTitleColorResolved: false,
        setTitleColor: (color) => {
            const state = get();
            if (state.isTitleColorResolved && state.titleColor === color) {
                return;
            }

            pendingTransition?.();
            cancelAnimation(titleColorProgress);

            // Congela a cor visível no momento (inclusive no meio de uma
            // transição) para que a próxima comece exatamente dali.
            const visibleColor = mixHex(
                state.fromColor,
                state.toColor,
                titleColorProgress.value,
            );

            // 1) Ambas as camadas passam a mostrar a cor visível: nada muda
            //    na tela, independentemente do valor de progresso.
            set({
                titleColor: color,
                isTitleColorResolved: true,
                fromColor: visibleColor,
                toColor: visibleColor,
            });

            pendingTransition = afterNextPaint(() => {
                // 2) Prepara a cor de destino com o progresso zerado
                //    (ainda sem mudança visível).
                titleColorProgress.value = 0;
                set({ toColor: color });

                // 3) Espera todos os ícones/componentes estarem montados e a
                //    UI assentar, e então anima tudo junto na thread de UI.
                pendingTransition = afterUiSettles(() => {
                    pendingTransition = null;
                    titleColorProgress.value = withTiming(1, {
                        duration: TITLE_COLOR_TRANSITION_MS,
                        easing: titleColorEasing,
                    });
                });
            });
        },
    }),
);
