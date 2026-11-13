import { useCallback, useRef, useState } from "react";
import {
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAccident } from "@/src/features/map/services/accidentService";
import { useAuthStore } from "@/src/store/authStore";
import type {
    AccidentClassification,
    AccidentWeatherCondition,
} from "@/src/features/map/types/accident.types";
import { AccidentTypeSelector } from "@/src/features/report/components/form/AccidentTypeSelector";
import { ClassificationSelector } from "@/src/features/report/components/form/ClassificationSelector";
import { DateTimeCard } from "@/src/features/report/components/form/DateTimeCard";
import { DescriptionField } from "@/src/features/report/components/form/DescriptionField";
import { ExitReportDialog } from "@/src/features/report/components/form/ExitReportDialog";
import { LocationCard } from "@/src/features/report/components/form/LocationCard";
import { ReportFormHeader } from "@/src/features/report/components/form/ReportFormHeader";
import { ReportSubmitButton } from "@/src/features/report/components/form/ReportSubmitButton";
import { SeveritySelector } from "@/src/features/report/components/form/SeveritySelector";
import { WeatherSelector } from "@/src/features/report/components/form/WeatherSelector";
import type {
    ReportAccidentType,
    ReportSeverity,
} from "@/src/features/report/constants/reportOptions";
import { useReportAddress } from "@/src/features/report/hooks/useReportAddress";
import { useReportExitGuard } from "@/src/features/report/hooks/useReportExitGuard";
import { useKeyboardHeight } from "@/src/shared/hooks/useKeyboardHeight";

import { tr } from "@/src/i18n";

export default function ReportFormScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { longitude: longitudeParam, latitude: latitudeParam } =
        useLocalSearchParams<{
            longitude?: string;
            latitude?: string;
        }>();
    const [accidentType, setAccidentType] =
        useState<ReportAccidentType | null>(null);
    const [customType, setCustomType] = useState("");
    const [isCustomTypeFocused, setIsCustomTypeFocused] = useState(false);
    const customTypeInputRef = useRef<TextInput>(null);
    const isDescriptionFocusedRef = useRef(false);
    const [severity, setSeverity] = useState<ReportSeverity | null>(null);
    const [classification, setClassification] =
        useState<AccidentClassification | null>(null);
    const [weather, setWeather] =
        useState<AccidentWeatherCondition | null>(null);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createdAt] = useState(() => new Date());
    const scrollViewRef = useRef<ScrollView>(null);

    const { user } = useAuthStore();

    const longitude = Number(longitudeParam);
    const latitude = Number(latitudeParam);
    const hasLocation = Number.isFinite(longitude) && Number.isFinite(latitude);

    const scrollToDescription = () => {
        requestAnimationFrame(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });
    };

    // Com a descrição em foco, rola até ela quando o teclado termina de abrir.
    const keyboardHeight = useKeyboardHeight(() => {
        if (isDescriptionFocusedRef.current) {
            setTimeout(scrollToDescription, 80);
        }
    });

    const {
        isExitDialogVisible,
        closeExitDialog,
        handleBackPress,
        handleExitReport,
        allowExit,
    } = useReportExitGuard(keyboardHeight);

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

    const { address, isLoadingAddress, addressError } = useReportAddress(
        hasLocation,
        latitude,
        longitude,
    );

    const focusCustomType = () => {
        // Espera a animação de entrada terminar para o teclado não
        // "empurrar" o campo enquanto ele ainda está aparecendo.
        setTimeout(() => customTypeInputRef.current?.focus(), 260);
    };

    const handleSelectAccidentType = (type: ReportAccidentType) => {
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

            allowExit();
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
                    // No Android o sistema já desloca a janela para mostrar
                    // o campo focado (softwareKeyboardLayoutMode "pan");
                    // somar a altura do teclado aqui criava um vão acima dele.
                    paddingBottom:
                        (Platform.OS === "android" ? 0 : keyboardHeight) +
                        insets.bottom +
                        28,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="px-4">
                    <ReportFormHeader onBack={handleBackPress} />

                    <LocationCard
                        isLoadingAddress={isLoadingAddress}
                        address={address}
                        addressError={addressError}
                        hasLocation={hasLocation}
                        latitude={latitude}
                        longitude={longitude}
                    />

                    <DateTimeCard createdAt={createdAt} />

                    <AccidentTypeSelector
                        accidentType={accidentType}
                        onSelectAccidentType={handleSelectAccidentType}
                        customType={customType}
                        onChangeCustomType={setCustomType}
                        isCustomTypeFocused={isCustomTypeFocused}
                        onCustomTypeFocusChange={setIsCustomTypeFocused}
                        customTypeInputRef={customTypeInputRef}
                    />

                    <Animated.View layout={LinearTransition.duration(240)}>
                    <ClassificationSelector
                        classification={classification}
                        onSelect={setClassification}
                    />

                    <WeatherSelector
                        weather={weather}
                        onSelect={setWeather}
                    />

                    <SeveritySelector
                        severity={severity}
                        onSelect={setSeverity}
                    />

                    <DescriptionField
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
                    />

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

                    <ReportSubmitButton
                        isSubmitting={isSubmitting}
                        onPress={handleSubmit}
                    />
                    </Animated.View>
                </View>
            </ScrollView>
            <ExitReportDialog
                visible={isExitDialogVisible}
                onClose={closeExitDialog}
                onConfirmExit={handleExitReport}
            />
        </KeyboardAvoidingView>
    );
}
