import { AccidentComments } from "@/src/features/map/components/details/AccidentComments";
import { AccidentDetailsHeader } from "@/src/features/map/components/details/AccidentDetailsHeader";
import {
    AccidentDetailsError,
    AccidentDetailsLoading,
} from "@/src/features/map/components/details/AccidentDetailsStatus";
import { AccidentLocationSection } from "@/src/features/map/components/details/AccidentLocationSection";
import { AccidentSourceSection } from "@/src/features/map/components/details/AccidentSourceSection";
import { AccidentSummaryCard } from "@/src/features/map/components/details/AccidentSummaryCard";
import { AccidentTrustCard } from "@/src/features/map/components/details/AccidentTrustCard";
import { SectionCard } from "@/src/features/map/components/details/SectionCard";
import { useAccidentAddress } from "@/src/features/map/hooks/useAccidentAddress";
import { useAccidentDetails } from "@/src/features/map/hooks/useAccidentDetails";
import { useKeyboardHeight } from "@/src/shared/hooks/useKeyboardHeight";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation } from "@/src/i18n";

export default function AccidentDetailsScreen() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<{ accidentId?: string | string[] }>();
    const accidentId = Array.isArray(params.accidentId)
        ? params.accidentId[0]
        : params.accidentId;
    const user = useAuthStore((state) => state.user);
    const { width } = useWindowDimensions();
    const imageWidth = width - 32;
    const scrollViewRef = useRef<ScrollView>(null);

    // Ao abrir o teclado (campo de comentário), rola até o fim da tela.
    const keyboardHeight = useKeyboardHeight(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
    });

    const scrollToComment = useCallback(() => {
        requestAnimationFrame(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });
    }, []);

    const {
        accident,
        trustedByMe,
        isLoading,
        error,
        comment,
        setComment,
        isSendingComment,
        isUpdatingTrust,
        commentError,
        trustError,
        activeImage,
        setActiveImage,
        loadAccident,
        handleSendComment,
        handleToggleTrust,
        handleOpenMap,
    } = useAccidentDetails(accidentId);
    const { address, isLoadingAddress } = useAccidentAddress(accident);

    const isOwnReport =
        Boolean(user?.id) && accident?.created_by_id === user?.id;
    const isEmailVerified = Boolean(user?.is_email_verified);
    const canTrust =
        accident?.source === "APP" &&
        Boolean(accident.created_by_id) &&
        !isOwnReport &&
        (isEmailVerified || trustedByMe);

    return (
        <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
            <AccidentDetailsHeader
                paddingTop={insets.top + 8}
                onBack={() => router.back()}
            />

            {isLoading && !accident ? (
                <AccidentDetailsLoading />
            ) : error && !accident ? (
                <AccidentDetailsError
                    message={error}
                    onRetry={() => void loadAccident()}
                />
            ) : accident ? (
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        // No Android o sistema já desloca a janela para
                        // mostrar o campo focado (softwareKeyboardLayoutMode
                        // "pan"); somar a altura do teclado aqui criava um
                        // vão do tamanho do teclado acima dele.
                        paddingBottom:
                            (Platform.OS === "android" ? 0 : keyboardHeight) +
                            insets.bottom +
                            28,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <AccidentSummaryCard
                        accident={accident}
                        imageWidth={imageWidth}
                        activeImage={activeImage}
                        onActiveImageChange={setActiveImage}
                    />

                    {accident.description && (
                        <SectionCard title={t("accident.description")}>
                            <Text className="font-body text-[15px] leading-5.5 text-[#414755] dark:text-[#AAB0BD]">
                                {accident.description}
                            </Text>
                        </SectionCard>
                    )}

                    <AccidentLocationSection
                        address={address}
                        isLoadingAddress={isLoadingAddress}
                        onOpenMap={() => void handleOpenMap()}
                    />

                    <AccidentSourceSection accident={accident} />

                    <AccidentTrustCard
                        trustedCount={accident.trusted_count}
                        trustedByMe={trustedByMe}
                        canTrust={canTrust}
                        isUpdatingTrust={isUpdatingTrust}
                        isOwnReport={isOwnReport}
                        isEmailVerified={isEmailVerified}
                        trustError={trustError}
                        onToggleTrust={() => void handleToggleTrust()}
                    />

                    <AccidentComments
                        comments={accident.comments}
                        isEmailVerified={isEmailVerified}
                        comment={comment}
                        onChangeComment={setComment}
                        onCommentFocus={scrollToComment}
                        isSendingComment={isSendingComment}
                        commentError={commentError}
                        onSendComment={() => void handleSendComment()}
                        onVerifyEmail={() =>
                            router.push(verifyEmailFromAppRoute)
                        }
                    />
                </ScrollView>
            ) : null}
        </KeyboardAvoidingView>
    );
}
