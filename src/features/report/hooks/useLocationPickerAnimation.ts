import {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const EXPANSION_DURATION = 650;
// Curva suave (estilo "emphasized decelerate"): começa sem tranco e assenta devagar.
const EXPANSION_EASING = Easing.bezier(0.32, 0.72, 0, 1);

type LocationPickerAnimationParams = {
    width: number;
    height: number;
    initialMapTop: number;
    initialMapSize: number;
};

/**
 * Animação de expansão do mapa de escolha de local: o círculo inicial vira
 * tela cheia, a folha de instruções sai e os controles/confirmação entram.
 */
export function useLocationPickerAnimation({
    width,
    height,
    initialMapTop,
    initialMapSize,
}: LocationPickerAnimationParams) {
    const expansionProgress = useSharedValue(0);

    const startExpansion = () => {
        // Inicia a animação na UI thread imediatamente, sem esperar o re-render.
        expansionProgress.value = withTiming(1, {
            duration: EXPANSION_DURATION,
            easing: EXPANSION_EASING,
        });
    };

    const mapWrapperStyle = useAnimatedStyle(() => ({
        top: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapTop, 0],
        ),
        left: interpolate(expansionProgress.value, [0, 1], [16, 0]),
        width: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize, width],
        ),
        height: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize, height],
        ),
        borderRadius: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize / 2, 0],
        ),
    }));

    // O mapa tem sempre o tamanho da tela: só a "janela" (wrapper) cresce.
    // Assim o Mapbox não precisa redimensionar a superfície GL a cada frame,
    // que era o que deixava a expansão travando. Apenas transladamos o mapa
    // para que o centro dele continue no centro da janela.
    const mapContentStyle = useAnimatedStyle(() => {
        const size = interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize, width],
        );
        const wrapperHeight = interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize, height],
        );

        return {
            transform: [
                { translateX: (size - width) / 2 },
                { translateY: (wrapperHeight - height) / 2 },
            ],
        };
    });

    const mapRingStyle = useAnimatedStyle(() => ({
        borderRadius: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize / 2, 0],
        ),
        opacity: interpolate(expansionProgress.value, [0, 0.6], [1, 0], "clamp"),
    }));

    const bottomSheetStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansionProgress.value, [0, 0.35, 1], [1, 0.8, 0]),
        transform: [
            {
                translateY: interpolate(
                    expansionProgress.value,
                    [0, 1],
                    [0, height * 0.42],
                ),
            },
        ],
    }));

    const expandedControlsStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansionProgress.value, [0, 0.65, 1], [0, 0.2, 1]),
        transform: [
            {
                translateY: interpolate(
                    expansionProgress.value,
                    [0, 1],
                    [12, 0],
                ),
            },
        ],
    }));

    const confirmationStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansionProgress.value, [0, 0.7, 1], [0, 0.2, 1]),
        transform: [
            {
                translateY: interpolate(
                    expansionProgress.value,
                    [0, 1],
                    [28, 0],
                ),
            },
        ],
    }));

    return {
        startExpansion,
        mapWrapperStyle,
        mapContentStyle,
        mapRingStyle,
        bottomSheetStyle,
        expandedControlsStyle,
        confirmationStyle,
    };
}
