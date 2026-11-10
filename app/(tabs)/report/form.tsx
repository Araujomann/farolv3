import {
    ArrowLeft,
    CarFront,
    Check,
    MapPin,
    PersonStanding,
    Send,
    Shapes,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";
import { createAccident } from "@/src/features/map/services/accidentService";
import type {
    AccidentClassification,
    AccidentSeverity,
    AccidentWeatherCondition,
} from "@/src/features/map/types/accident.types";

const MAX_DESCRIPTION_LENGTH = 1000;

const SEVERITY_OPTIONS: {
    value: Exclude<AccidentSeverity, "unknown">;
    label: string;
    color: string;
}[] = [
    { value: "low", label: "Baixa", color: "#0969D7" },
    { value: "medium", label: "Média", color: "#D99A24" },
    { value: "high", label: "Alta", color: "#D9534F" },
    { value: "critical", label: "Crítica", color: "#B42318" },
];

const ACCIDENT_TYPES = ["COLISÃO", "ATROPELAMENTO", "OUTRO"] as const;

const CLASSIFICATION_OPTIONS: {
    value: AccidentClassification;
    label: string;
}[] = [
    { value: "sem_vitima", label: "Sem vítima" },
    { value: "com_vitima", label: "Com vítima" },
];

const WEATHER_OPTIONS: {
    value: AccidentWeatherCondition;
    label: string;
}[] = [
    { value: "ceu_claro", label: "Céu claro" },
    { value: "nublado", label: "Nublado" },
    { value: "garoa", label: "Garoa" },
    { value: "chuva", label: "Chuva" },
];

const ACCIDENT_TYPE_ICONS = {
    COLISÃO: CarFront,
    ATROPELAMENTO: PersonStanding,
    OUTRO: Shapes,
} as const;

export default function ReportFormScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { longitude: longitudeParam, latitude: latitudeParam } =
        useLocalSearchParams<{
            longitude?: string;
            latitude?: string;
        }>();
    const [address, setAddress] = useState("");
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [accidentType, setAccidentType] = useState<
        (typeof ACCIDENT_TYPES)[number] | null
    >(null);
    const [severity, setSeverity] = useState<
        Exclude<AccidentSeverity, "unknown"> | null
    >(null);
    const [classification, setClassification] =
        useState<AccidentClassification | null>(null);
    const [weather, setWeather] =
        useState<AccidentWeatherCondition | null>(null);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createdAt] = useState(() => new Date());
    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const longitude = Number(longitudeParam);
    const latitude = Number(latitudeParam);
    const hasLocation = Number.isFinite(longitude) && Number.isFinite(latitude);

    const handleBackPress = useCallback(() => {
        if (keyboardHeight > 0) {
            Keyboard.dismiss();
            return;
        }

        router.back();
    }, [keyboardHeight, router]);

    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    handleBackPress();
                    return true;
                },
            );

            return () => subscription.remove();
        }, [handleBackPress]),
    );

    useFocusEffect(
        useCallback(() => {
            const resetScrollPosition = () => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            };
            const frame = requestAnimationFrame(resetScrollPosition);
            const interaction = InteractionManager.runAfterInteractions(
                resetScrollPosition,
            );

            return () => {
                cancelAnimationFrame(frame);
                interaction.cancel();
            };
        }, []),
    );

    const scrollToDescription = () => {
        requestAnimationFrame(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });
    };

    const handleSubmit = async () => {
        setSubmitError(null);

        if (!hasLocation) {
            setSubmitError("A localização do acidente não está disponível.");
            return;
        }

        if (!accidentType || !classification || !weather || !severity) {
            setSubmitError("Preencha todos os campos obrigatórios.");
            return;
        }

        setIsSubmitting(true);

        try {
            await createAccident({
                tipo_acidente: accidentType,
                classificacao_acidente: classification,
                condicao_meteorologica: weather,
                description: description.trim() || undefined,
                latitude,
                longitude,
                occurredAt: createdAt.toISOString(),
                severity,
            });

            Alert.alert(
                "Relato enviado",
                "Seu relato foi recebido e está aguardando análise da equipe de moderação.",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/report"),
                    },
                ],
            );
        } catch (error) {
            const responseMessage =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof error.response === "object" &&
                error.response !== null &&
                "data" in error.response &&
                typeof error.response.data === "object" &&
                error.response.data !== null &&
                "error" in error.response.data &&
                typeof error.response.data.error === "object" &&
                error.response.data.error !== null &&
                "message" in error.response.data.error &&
                typeof error.response.data.error.message === "string"
                    ? error.response.data.error.message
                    : null;

            setSubmitError(
                responseMessage ??
                    "Não foi possível enviar o relato. Verifique sua conexão e tente novamente.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const keyboardDidShowSubscription = Keyboard.addListener(
            "keyboardDidShow",
            (event) => {
                setKeyboardHeight(event.endCoordinates.height);
                setTimeout(scrollToDescription, 80);
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

    useEffect(() => {
        let isMounted = true;

        if (!hasLocation) {
            setAddressError("A localização confirmada não está disponível.");
            setIsLoadingAddress(false);
            return () => {
                isMounted = false;
            };
        }

        reverseGeocode(longitude, latitude)
            .then((resolvedAddress) => {
                if (isMounted) {
                    setAddress(resolvedAddress);
                }
            })
            .catch((error: unknown) => {
                console.warn("Falha ao obter endereço da localização", error);
                if (isMounted) {
                    setAddressError(
                        "Não foi possível carregar o endereço. Verifique sua conexão.",
                    );
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingAddress(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [hasLocation, latitude, longitude]);

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[#F1F3FE]"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                className="flex-1"
                automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                contentOffset={{ x: 0, y: 0 }}
                contentContainerStyle={{
                    paddingTop: insets.top + 16,
                    paddingBottom: keyboardHeight + insets.bottom + 28,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="px-4">
                    <View className="mb-6 flex-row items-center">
                        <Pressable
                            accessibilityLabel="Voltar para seleção de localização"
                            onPress={handleBackPress}
                            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
                        >
                            <ArrowLeft size={22} color="#181C23" />
                        </Pressable>
                        <View className="ml-3 flex-1">
                            <Text className="text-[13px] font-semibold uppercase tracking-wide text-[#0058BC]">
                                Novo relato
                            </Text>
                            <Text className="mt-0.5 text-[25px] font-bold text-[#181C23]">
                                Relatar acidente
                            </Text>
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Localização" />
                        <View className="mt-2 flex-row items-start rounded-2xl border border-[#C1C6D7]/50 bg-[#F8F9FF] px-3 py-3">
                            <MapPin
                                size={19}
                                color="#0058BC"
                                strokeWidth={2.25}
                            />
                            <View className="ml-2 flex-1">
                                {isLoadingAddress ? (
                                    <View className="flex-row items-center">
                                        <ActivityIndicator
                                            size="small"
                                            color="#0058BC"
                                        />
                                        <Text className="ml-2 text-sm text-[#717786]">
                                            Buscando endereço...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text className="text-[15px] leading-5 text-[#181C23]">
                                        {addressError ?? address}
                                    </Text>
                                )}
                                <Text className="mt-1 text-xs text-[#717786]">
                                    {hasLocation
                                        ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                        : "Coordenadas indisponíveis"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Data e horário" />
                        <Text className="mt-2 rounded-2xl border border-[#C1C6D7]/50 bg-[#F8F9FF] px-3 py-3 text-[15px] text-[#181C23]">
                            {new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                            }).format(createdAt)}
                        </Text>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Tipo de acidente" required />
                        <Text className="mt-1 text-sm text-[#717786]">
                            Selecione uma opção
                        </Text>
                        <View className="mt-3 flex-row gap-2.5">
                            {ACCIDENT_TYPES.map((type) => {
                                const selected = accidentType === type;
                                const TypeIcon = ACCIDENT_TYPE_ICONS[type];
                                return (
                                    <Pressable
                                        key={type}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        onPress={() => setAccidentType(type)}
                                        className={`aspect-square flex-1 items-center justify-center rounded-2xl border px-1 ${
                                            selected
                                                ? "border-[#0058BC] bg-[#E8F0FF]"
                                                : "border-[#C1C6D7]/60 bg-white"
                                        }`}
                                    >
                                        <TypeIcon
                                            size={26}
                                            color={
                                                selected
                                                    ? "#0058BC"
                                                    : "#414755"
                                            }
                                            strokeWidth={2}
                                        />
                                        <Text
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.72}
                                            className={`mt-2 w-full text-center text-[10px] font-bold tracking-normal ${
                                                selected
                                                    ? "text-[#0058BC]"
                                                    : "text-[#414755]"
                                            }`}
                                        >
                                            {type}
                                        </Text>
                                        {selected && (
                                            <View className="absolute right-2 top-2">
                                                <Check
                                                    size={16}
                                                    color="#0058BC"
                                                    strokeWidth={2.5}
                                                />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Classificação" required />
                        <Text className="mt-1 text-sm text-[#717786]">
                            Houve vítimas no acidente?
                        </Text>
                        <View className="mt-3 flex-row gap-2.5">
                            {CLASSIFICATION_OPTIONS.map((option) => {
                                const selected = classification === option.value;
                                return (
                                    <Pressable
                                        key={option.value}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        onPress={() =>
                                            setClassification(option.value)
                                        }
                                        className={`min-h-12 flex-1 items-center justify-center rounded-2xl border px-3 py-3 ${
                                            selected
                                                ? "border-[#0058BC] bg-[#E8F0FF]"
                                                : "border-[#C1C6D7]/60 bg-white"
                                        }`}
                                    >
                                        <Text
                                            className={`text-sm font-semibold ${
                                                selected
                                                    ? "text-[#0058BC]"
                                                    : "text-[#414755]"
                                            }`}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Condição meteorológica" required />
                        <Text className="mt-1 text-sm text-[#717786]">
                            Como estava o tempo no local?
                        </Text>
                        <View className="mt-3 flex-row flex-wrap gap-2">
                            {WEATHER_OPTIONS.map((option) => {
                                const selected = weather === option.value;
                                return (
                                    <Pressable
                                        key={option.value}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        onPress={() => setWeather(option.value)}
                                        className={`min-h-12 min-w-[45%] flex-1 items-center justify-center rounded-2xl border px-3 py-3 ${
                                            selected
                                                ? "border-[#0058BC] bg-[#E8F0FF]"
                                                : "border-[#C1C6D7]/60 bg-white"
                                        }`}
                                    >
                                        <Text
                                            className={`text-sm font-semibold ${
                                                selected
                                                    ? "text-[#0058BC]"
                                                    : "text-[#414755]"
                                            }`}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Severidade" required />
                        <Text className="mt-1 text-sm text-[#717786]">
                            Como você avalia o ocorrido?
                        </Text>
                        <View className="mt-3 flex-row flex-wrap gap-2">
                            {SEVERITY_OPTIONS.map((option) => {
                                const selected = severity === option.value;
                                return (
                                    <Pressable
                                        key={option.value}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        onPress={() =>
                                            setSeverity(option.value)
                                        }
                                        className={`min-w-[45%] flex-1 flex-row items-center justify-center rounded-2xl border px-3 py-3 ${
                                            selected
                                                ? "border-[#181C23]"
                                                : "border-[#C1C6D7]/60"
                                        }`}
                                        style={{
                                            backgroundColor: selected
                                                ? `${option.color}20`
                                                : "#FFFFFF",
                                        }}
                                    >
                                        <View
                                            className="mr-2 h-3 w-3 rounded-full"
                                            style={{
                                                backgroundColor: option.color,
                                            }}
                                        />
                                        <Text className="text-sm font-semibold text-[#414755]">
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View className="rounded-3xl bg-white p-4 shadow-lg">
                        <FieldLabel label="Descrição do ocorrido" />
                        <TextInput
                            accessibilityLabel="Descrição do ocorrido"
                            multiline
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            value={description}
                            onFocus={scrollToDescription}
                            onChangeText={(text) => {
                                setDescription(text);
                                scrollToDescription();
                            }}
                            placeholder="Conte brevemente o que aconteceu, incluindo informações importantes."
                            placeholderTextColor="#8A90A0"
                            textAlignVertical="top"
                            className="mt-3 min-h-[150px] rounded-2xl border border-[#C1C6D7]/60 bg-[#F8F9FF] px-3 py-3 text-[15px] leading-5 text-[#181C23]"
                        />
                        <Text className="mt-2 text-right text-xs font-medium text-[#717786]">
                            {description.length}/{MAX_DESCRIPTION_LENGTH}
                        </Text>
                    </View>

                    {submitError && (
                        <View
                            accessibilityRole="alert"
                            className="mt-4 rounded-2xl border border-[#F2B8B5] bg-[#FFF1F0] px-4 py-3"
                        >
                            <Text className="text-sm font-medium text-[#B42318]">
                                {submitError}
                            </Text>
                        </View>
                    )}

                    <Pressable
                        accessibilityLabel="Enviar relato"
                        accessibilityRole="button"
                        disabled={isSubmitting}
                        onPress={handleSubmit}
                        className={`mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0058BC] px-4 shadow-lg ${
                            isSubmitting ? "opacity-70" : ""
                        }`}
                        style={({ pressed }) => ({
                            opacity: isSubmitting ? 0.7 : pressed ? 0.82 : 1,
                            transform: [{ scale: pressed ? 0.99 : 1 }],
                        })}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Send
                                    size={20}
                                    color="#FFFFFF"
                                    strokeWidth={2.25}
                                />
                                <Text className="text-[16px] font-bold tracking-wide text-white">
                                    ENVIAR RELATO
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function FieldLabel({
    label,
    required = false,
}: {
    label: string;
    required?: boolean;
}) {
    return (
        <Text className="text-[16px] font-bold text-[#181C23]">
            {label}
            {required && <Text className="text-[#B42318]"> *</Text>}
        </Text>
    );
}
