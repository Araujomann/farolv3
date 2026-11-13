import {
    ArrowLeft,
    CarFront,
    Check,
    CircleAlert,
    MapPin,
    PenLine,
    PersonStanding,
    Send,
    Shapes,
    X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeOutUp,
    LinearTransition,
} from "react-native-reanimated";
import {
    useFocusEffect,
    useLocalSearchParams,
    useNavigation,
    useRouter,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";
import { createAccident } from "@/src/features/map/services/accidentService";
import { useAuthStore } from "@/src/store/authStore";
import type {
    AccidentClassification,
    AccidentSeverity,
    AccidentWeatherCondition,
} from "@/src/features/map/types/accident.types";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { tr, useTranslation, type TranslationKey } from "@/src/i18n";
import { SEVERITY_COLORS } from "@/src/theme/colors";
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_CUSTOM_TYPE_LENGTH = 60;

const SEVERITY_OPTIONS: {
    value: Exclude<AccidentSeverity, "unknown">;
    label: TranslationKey;
    color: string;
}[] = [
    { value: "low", label: "enums.severity.low", color: SEVERITY_COLORS.low },
    { value: "medium", label: "enums.severity.medium", color: SEVERITY_COLORS.medium },
    { value: "high", label: "enums.severity.high", color: SEVERITY_COLORS.high },
    { value: "critical", label: "enums.severity.critical", color: SEVERITY_COLORS.critical },
];

const ACCIDENT_TYPES = ["COLISÃO", "ATROPELAMENTO", "OUTRO"] as const;

const CLASSIFICATION_OPTIONS: {
    value: AccidentClassification;
    label: TranslationKey;
}[] = [
    { value: "sem_vitima", label: "enums.classification.sem_vitima" },
    { value: "com_vitima", label: "enums.classification.com_vitima" },
];

const WEATHER_OPTIONS: {
    value: AccidentWeatherCondition;
    label: TranslationKey;
}[] = [
    { value: "ceu_claro", label: "enums.weather.ceu_claro" },
    { value: "nublado", label: "enums.weather.nublado" },
    { value: "garoa", label: "enums.weather.garoa" },
    { value: "chuva", label: "enums.weather.chuva" },
];

const ACCIDENT_TYPE_ICONS = {
    COLISÃO: CarFront,
    ATROPELAMENTO: PersonStanding,
    OUTRO: Shapes,
} as const;

export default function ReportFormScreen() {
    const { t, language } = useTranslation();
    const { colors } = useAppTheme();
    const router = useRouter();
    const navigation = useNavigation();
    const tabsNavigation = useNavigation("/(tabs)");
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
    const [customType, setCustomType] = useState("");
    const [isCustomTypeFocused, setIsCustomTypeFocused] = useState(false);
    const customTypeInputRef = useRef<TextInput>(null);
    const isDescriptionFocusedRef = useRef(false);
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
    const allowExitRef = useRef(false);
    const [isExitDialogVisible, setIsExitDialogVisible] = useState(false);

    const { user } = useAuthStore();

    const longitude = Number(longitudeParam);
    const latitude = Number(latitudeParam);
    const hasLocation = Number.isFinite(longitude) && Number.isFinite(latitude);

    const showExitConfirmation = useCallback(() => {
        setIsExitDialogVisible(true);
    }, []);

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

    const focusCustomType = () => {
        // Espera a animação de entrada terminar para o teclado não
        // "empurrar" o campo enquanto ele ainda está aparecendo.
        setTimeout(() => customTypeInputRef.current?.focus(), 260);
    };

    const handleSelectAccidentType = (type: (typeof ACCIDENT_TYPES)[number]) => {
        setAccidentType(type);

        if (type === "OUTRO") {
            focusCustomType();
        } else if (isCustomTypeFocused) {
            Keyboard.dismiss();
        }
    };

    const handleSubmit = async () => {
        setSubmitError(null);

        // Verificação de e-mail não verificado
        if (!user?.is_email_verified) {
            setSubmitError(
                tr("report.form.verifyRequired"),
            );
            return;
        }

        if (!hasLocation) {
            setSubmitError(tr("report.form.locationUnavailable"));
            return;
        }

        if (!accidentType || !classification || !weather || !severity) {
            setSubmitError(tr("report.form.requiredFields"));
            return;
        }

        const normalizedCustomType = customType
            .trim()
            .replace(/\s+/g, " ")
            .toLocaleUpperCase("pt-BR");

        if (accidentType === "OUTRO" && !normalizedCustomType) {
            setSubmitError(tr("report.form.customTypeRequired"));
            customTypeInputRef.current?.focus();
            return;
        }

        setIsSubmitting(true);

        try {
            await createAccident({
                tipo_acidente:
                    accidentType === "OUTRO"
                        ? normalizedCustomType
                        : accidentType,
                classificacao_acidente: classification,
                condicao_meteorologica: weather,
                description: description.trim() || undefined,
                latitude,
                longitude,
                occurredAt: createdAt.toISOString(),
                severity,
            });

            allowExitRef.current = true;
            router.replace("/report/success");
        } catch (error) {
            if (__DEV__) {
                console.warn("Falha ao enviar relato", error);
            }
            setSubmitError(tr("report.form.submitError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const keyboardDidShowSubscription = Keyboard.addListener(
            "keyboardDidShow",
            (event) => {
                setKeyboardHeight(event.endCoordinates.height);
                if (isDescriptionFocusedRef.current) {
                    setTimeout(scrollToDescription, 80);
                }
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
            setAddressError(tr("report.form.confirmedLocationUnavailable"));
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
                        tr("report.form.addressError"),
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
            className="flex-1 bg-[#F1F3FE] dark:bg-[#242833]"
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
                            accessibilityLabel={t("report.form.backToLocation")}
                            onPress={handleBackPress}
                            className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#1A1D24] shadow-md"
                        >
                            <ArrowLeft size={22} color={colors.onSurface} />
                        </Pressable>
                        <View className="ml-3 flex-1">
                            <Text className="text-[13px] font-body-semibold uppercase tracking-wide text-[#0058BC] dark:text-[#3B87F5]">
                                {t("report.form.newReport")}
                            </Text>
                            <Text className="mt-0.5 text-[25px] font-display tracking-tight text-[#181C23] dark:text-[#ECEEF4]">
                                {t("report.form.title")}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.location")} />
                        <View className="mt-2 flex-row items-start rounded-2xl border border-[#C1C6D7]/50 dark:border-[#3A3F4B]/50 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3">
                            <MapPin
                                size={19}
                                color={colors.primary}
                                strokeWidth={2.25}
                            />
                            <View className="ml-2 flex-1">
                                {isLoadingAddress ? (
                                    <View className="flex-row items-center">
                                        <ActivityIndicator
                                            size="small"
                                            color={colors.primary}
                                        />
                                        <Text className="font-body ml-2 text-sm text-[#717786] dark:text-[#8B92A1]">
                                            {t("report.form.searchingAddress")}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text className="font-body text-[15px] leading-5 text-[#181C23] dark:text-[#ECEEF4]">
                                        {addressError ?? address}
                                    </Text>
                                )}
                                <Text className="font-body mt-1 text-xs text-[#717786] dark:text-[#8B92A1]">
                                    {hasLocation
                                        ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                        : t("report.form.coordinatesUnavailable")}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.dateTime")} />
                        <Text className="font-body mt-2 rounded-2xl border border-[#C1C6D7]/50 dark:border-[#3A3F4B]/50 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3 text-[15px] text-[#181C23] dark:text-[#ECEEF4]">
                            {new Intl.DateTimeFormat(language, {
                                dateStyle: "short",
                                timeStyle: "short",
                            }).format(createdAt)}
                        </Text>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.accidentType")} required />
                        <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                            {t("report.form.selectOption")}
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
                                        onPress={() =>
                                            handleSelectAccidentType(type)
                                        }
                                        className={`aspect-square flex-1 items-center justify-center rounded-2xl border px-1 ${
                                            selected
                                                ? "border-[#0058BC] bg-[#E8F0FF] dark:bg-[#16253F]"
                                                : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-white dark:bg-[#1A1D24]"
                                        }`}
                                    >
                                        <TypeIcon
                                            size={26}
                                            color={
                                                selected
                                                    ? colors.primary
                                                    : colors.onSurfaceVariant
                                            }
                                            strokeWidth={2}
                                        />
                                        <Text
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.72}
                                            className={`mt-2 w-full text-center text-[10px] font-body-bold tracking-normal ${
                                                selected
                                                    ? "text-[#0058BC] dark:text-[#3B87F5]"
                                                    : "text-[#414755] dark:text-[#AAB0BD]"
                                            }`}
                                        >
                                            {t(`enums.accidentType.${type}`).toLocaleUpperCase(language)}
                                        </Text>
                                        {selected && (
                                            <View className="absolute right-2 top-2">
                                                <Check
                                                    size={16}
                                                    color={colors.primary}
                                                    strokeWidth={2.5}
                                                />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                        {accidentType === "OUTRO" && (
                            <Animated.View
                                entering={FadeInDown.duration(240)}
                                exiting={FadeOutUp.duration(160)}
                            >
                                <View className="mt-4">
                                    <Text className="font-body-semibold text-[13px] text-[#414755] dark:text-[#AAB0BD]">
                                        {t("report.form.customTypeQuestion")}
                                    </Text>
                                    <View
                                        className={`mt-2 flex-row items-center rounded-2xl border px-3 ${
                                            isCustomTypeFocused
                                                ? "border-[#0058BC] bg-white dark:bg-[#1A1D24]"
                                                : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-[#F8F9FF] dark:bg-[#0E1015]"
                                        }`}
                                    >
                                        <PenLine
                                            size={18}
                                            color={
                                                isCustomTypeFocused
                                                    ? colors.primary
                                                    : colors.outline
                                            }
                                            strokeWidth={2.25}
                                        />
                                        <TextInput
                                            ref={customTypeInputRef}
                                            accessibilityLabel={t("report.form.accidentType")}
                                            value={customType}
                                            onChangeText={setCustomType}
                                            onFocus={() =>
                                                setIsCustomTypeFocused(true)
                                            }
                                            onBlur={() =>
                                                setIsCustomTypeFocused(false)
                                            }
                                            maxLength={MAX_CUSTOM_TYPE_LENGTH}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            onSubmitEditing={Keyboard.dismiss}
                                            placeholder={t("report.form.customTypePlaceholder")}
                                            placeholderTextColor={colors.outline}
                                            className="font-body-medium ml-2 h-12 flex-1 text-[15px] text-[#181C23] dark:text-[#ECEEF4]"
                                        />
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </View>

                    <Animated.View layout={LinearTransition.duration(240)}>
                    <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.classification")} required />
                        <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                            {t("report.form.victimsQuestion")}
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
                                                ? "border-[#0058BC] bg-[#E8F0FF] dark:bg-[#16253F]"
                                                : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-white dark:bg-[#1A1D24]"
                                        }`}
                                    >
                                        <Text
                                            className={`text-sm font-body-semibold ${
                                                selected
                                                    ? "text-[#0058BC] dark:text-[#3B87F5]"
                                                    : "text-[#414755] dark:text-[#AAB0BD]"
                                            }`}
                                        >
                                            {t(option.label)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.weather")} required />
                        <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                            {t("report.form.weatherQuestion")}
                        </Text>
                        <View className="mt-3 gap-2.5">
                            {[
                                WEATHER_OPTIONS.slice(0, 2),
                                WEATHER_OPTIONS.slice(2, 4),
                            ].map((row, rowIndex) => (
                                <View
                                    key={rowIndex}
                                    className="flex-row gap-2.5"
                                >
                                    {row.map((option) => {
                                        const selected =
                                            weather === option.value;
                                        return (
                                            <Pressable
                                                key={option.value}
                                                accessibilityRole="radio"
                                                accessibilityState={{
                                                    selected,
                                                }}
                                                onPress={() =>
                                                    setWeather(option.value)
                                                }
                                                className={`min-h-12 flex-1 items-center justify-center rounded-2xl border px-2 py-3 ${
                                                    selected
                                                        ? "border-[#0058BC] bg-[#E8F0FF] dark:bg-[#16253F]"
                                                        : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-white dark:bg-[#1A1D24]"
                                                }`}
                                            >
                                                <Text
                                                    numberOfLines={1}
                                                    adjustsFontSizeToFit
                                                    minimumFontScale={0.8}
                                                    className={`w-full text-center text-sm font-body-semibold ${
                                                        selected
                                                            ? "text-[#0058BC] dark:text-[#3B87F5]"
                                                            : "text-[#414755] dark:text-[#AAB0BD]"
                                                    }`}
                                                >
                                                    {t(option.label)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>

                    <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.severity")} required />
                        <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                            {t("report.form.severityQuestion")}
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
                                                ? "border-[#181C23] dark:border-[#ECEEF4]"
                                                : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60"
                                        }`}
                                        style={{
                                            backgroundColor: selected
                                                ? `${option.color}20`
                                                : colors.surface,
                                        }}
                                    >
                                        <View
                                            className="mr-2 h-3 w-3 rounded-full"
                                            style={{
                                                backgroundColor: option.color,
                                            }}
                                        />
                                        <Text className="text-sm font-body-semibold text-[#414755] dark:text-[#AAB0BD]">
                                            {t(option.label)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    <View className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
                        <FieldLabel label={t("report.form.description")} />
                        <TextInput
                            accessibilityLabel={t("report.form.description")}
                            multiline
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            value={description}
                            onFocus={() => {
                                isDescriptionFocusedRef.current = true;
                                scrollToDescription();
                            }}
                            onBlur={() => {
                                isDescriptionFocusedRef.current = false;
                            }}
                            onChangeText={(text) => {
                                setDescription(text);
                                scrollToDescription();
                            }}
                            placeholder={t("report.form.descriptionPlaceholder")}
                            placeholderTextColor={colors.outline}
                            textAlignVertical="top"
                            className="font-body mt-3 min-h-[150px] rounded-2xl border border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3 text-[15px] leading-5 text-[#181C23] dark:text-[#ECEEF4]"
                        />
                        <Text className="mt-2 text-right text-xs font-body-medium text-[#717786] dark:text-[#8B92A1]">
                            {description.length}/{MAX_DESCRIPTION_LENGTH}
                        </Text>
                    </View>

                    {submitError && (
                        <View
                            accessibilityRole="alert"
                            className="mt-4 rounded-2xl border border-[#F2B8B5] dark:border-[#5C2C26] bg-[#FFF1F0] dark:bg-[#2C1715] px-4 py-3"
                        >
                            <Text className="text-sm font-body-medium text-[#B42318] dark:text-[#FF7B70]">
                                {submitError}
                            </Text>
                        </View>
                    )}

                    <Pressable
                        accessibilityLabel={t("report.form.submitLabel")}
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
                                <Text className="text-[16px] font-display tracking-wide text-white">
                                    {t("report.form.submit").toLocaleUpperCase(language)}
                                </Text>
                            </>
                        )}
                    </Pressable>
                    </Animated.View>
                </View>
            </ScrollView>
            <Modal
                visible={isExitDialogVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setIsExitDialogVisible(false)}
            >
                <View className="flex-1 items-center justify-center bg-black/45 px-5">
                    <View className="w-full max-w-[390px] rounded-[28px] bg-white dark:bg-[#1A1D24] p-5 shadow-2xl">
                        <View className="mb-5 flex-row items-start justify-between">
                            <View className="flex-1 flex-row items-center gap-3 pr-4">
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFF1E8] dark:bg-[#2B2313]">
                                    <CircleAlert
                                        size={24}
                                        color="#C64F00"
                                        strokeWidth={2.25}
                                    />
                                </View>
                                <Text className="flex-1 text-[20px] font-display text-[#181C23] dark:text-[#ECEEF4]">
                                    {t("report.form.leaveTitle")}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel={t("profile.closeConfirmation")}
                                onPress={() => setIsExitDialogVisible(false)}
                                className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE] dark:bg-[#242833]"
                            >
                                <X size={18} color={colors.onSurfaceVariant} />
                            </Pressable>
                        </View>

                        <Text className="font-body mb-6 text-[15px] leading-[21px] text-[#414755] dark:text-[#AAB0BD]">
                            {t("report.form.leaveMessage")}
                        </Text>

                        <View className="gap-2.5">
                            <Pressable
                                accessibilityLabel={t("report.form.keepFillingLabel")}
                                onPress={() => setIsExitDialogVisible(false)}
                                className="h-12 items-center justify-center rounded-xl bg-[#0058BC]"
                            >
                                <Text className="text-[15px] font-body-bold text-white">
                                    {t("report.form.keepFilling")}
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityLabel={t("report.form.leave")}
                                onPress={handleExitReport}
                                className="h-12 items-center justify-center rounded-xl border border-[#F0B7A8] dark:border-[#5C2C26] bg-[#FFF8F5] dark:bg-[#2C1715]"
                            >
                                <Text className="text-[15px] font-body-bold text-[#B42318] dark:text-[#FF7B70]">
                                    {t("report.form.leave")}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
        <Text className="text-[16px] font-display text-[#181C23] dark:text-[#ECEEF4]">
            {label}
            {required && <Text className="text-[#B42318] dark:text-[#FF7B70]"> *</Text>}
        </Text>
    );
}
