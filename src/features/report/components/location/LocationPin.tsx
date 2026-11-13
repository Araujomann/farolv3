import { View } from "react-native";

import { useAppTheme } from "@/src/theme/useAppTheme";

/** Alfinete fixo no centro do mapa, marcando o local escolhido. */
export function LocationPin() {
    const { colors } = useAppTheme();
    return (
        <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
        >
            <View className="-mt-2 items-center">
                <View
                    style={{
                        width: 34,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                >
                    <View
                        style={{
                            width: 29,
                            height: 29,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#FF3B30",
                            borderWidth: 3,
                            borderColor: colors.surface,
                            borderRadius: 18,
                            borderBottomRightRadius: 6,
                            transform: [{ rotate: "45deg" }],
                            shadowColor: "#000000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.38,
                            shadowRadius: 5,
                            elevation: 7,
                        }}
                    >
                        <View
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: colors.surface,
                                transform: [{ rotate: "-45deg" }],
                            }}
                        />
                    </View>
                </View>
                <View className="-mt-2 h-3.5 w-4 rounded-full bg-black/35" />
            </View>
        </View>
    );
}
