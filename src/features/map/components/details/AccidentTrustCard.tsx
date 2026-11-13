import { BadgeCheck } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AccidentTrustCardProps = {
    trustedCount: number | undefined;
    trustedByMe: boolean;
    canTrust: boolean;
    isUpdatingTrust: boolean;
    isOwnReport: boolean;
    isEmailVerified: boolean;
    trustError: string | null;
    onToggleTrust: () => void;
};

/** Selos de confiança do relato e o botão para dar/remover o selo. */
export function AccidentTrustCard({
    trustedCount,
    trustedByMe,
    canTrust,
    isUpdatingTrust,
    isOwnReport,
    isEmailVerified,
    trustError,
    onToggleTrust,
}: AccidentTrustCardProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <>
            <View className="mt-4 rounded-2xl bg-white dark:bg-[#1A1D24] p-4">
                <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                        <Text className="text-xs font-body-semibold uppercase tracking-wide text-[#5D5E63] dark:text-[#AAB0BD]">
                            {t("accident.reliability")}
                        </Text>
                        <Text className="font-body mt-1 text-sm text-[#414755] dark:text-[#AAB0BD]">
                            {trustedByMe
                                ? t("accident.trustedByYou")
                                : t("accident.trustInvite")}
                        </Text>
                    </View>
                    <View className="items-center rounded-xl bg-[#F1F3FE] dark:bg-[#242833] px-3 py-2">
                        <Text className="text-xl font-display text-[#0058BC] dark:text-[#3B87F5]">
                            {trustedCount}
                        </Text>
                        <Text className="font-body text-[10px] text-[#414755] dark:text-[#AAB0BD]">
                            {t("accident.seals", { count: trustedCount ?? 0 })}
                        </Text>
                    </View>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                        disabled: !canTrust || isUpdatingTrust,
                        selected: trustedByMe,
                    }}
                    disabled={!canTrust || isUpdatingTrust}
                    onPress={onToggleTrust}
                    className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                        trustedByMe
                            ? "bg-[#EAF7EF] dark:bg-[#12271B]"
                            : "bg-[#0058BC]"
                    } ${!canTrust || isUpdatingTrust ? "opacity-60" : ""}`}
                >
                    {isUpdatingTrust ? (
                        <ActivityIndicator
                            size="small"
                            color={trustedByMe ? colors.success : "#FFFFFF"}
                        />
                    ) : (
                        <BadgeCheck
                            size={19}
                            color={trustedByMe ? colors.success : "#FFFFFF"}
                        />
                    )}
                    <Text
                        className={`text-sm font-body-semibold ${
                            trustedByMe
                                ? "text-[#14804A] dark:text-[#5BD48A]"
                                : "text-white"
                        }`}
                    >
                        {trustedByMe
                            ? t("accident.removeTrust")
                            : canTrust
                              ? t("accident.markTrusted")
                              : isOwnReport
                                ? t("accident.ownReport")
                                : !isEmailVerified
                                  ? t("accident.verifyToVote")
                                  : t("accident.trustOnlyCommunity")}
                    </Text>
                </Pressable>
            </View>
            {trustError && (
                <Text
                    accessibilityRole="alert"
                    className="font-body mt-3 text-xs text-[#BA1A1A] dark:text-[#FF7B70]"
                >
                    {trustError}
                </Text>
            )}
        </>
    );
}
