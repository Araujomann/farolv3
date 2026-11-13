import { Send, UserRound } from "lucide-react-native";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SectionCard } from "@/src/features/map/components/details/SectionCard";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";
import { formatDateTime as formatDate, useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AccidentCommentsProps = {
    comments: AccidentDetail["comments"];
    isEmailVerified: boolean;
    comment: string;
    onChangeComment: (text: string) => void;
    onCommentFocus: () => void;
    isSendingComment: boolean;
    commentError: string | null;
    onSendComment: () => void;
    onVerifyEmail: () => void;
};

/**
 * Lista de comentários e, para e-mails verificados, o campo de envio;
 * caso contrário, um convite para verificar o e-mail.
 */
export function AccidentComments({
    comments,
    isEmailVerified,
    comment,
    onChangeComment,
    onCommentFocus,
    isSendingComment,
    commentError,
    onSendComment,
    onVerifyEmail,
}: AccidentCommentsProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <SectionCard
            title={t("accident.comments", {
                count: String(comments.length),
            })}
        >
            {comments.length === 0 ? (
                <Text className="font-body py-2 text-sm text-gray-500 dark:text-[#8B92A1]">
                    {t("accident.noComments")}
                </Text>
            ) : (
                <View className="gap-4">
                    {comments.map((item) => (
                        <View
                            key={item.id}
                            className="flex-row gap-3"
                        >
                            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE] dark:bg-[#242833]">
                                <UserRound
                                    size={18}
                                    color={colors.onSurfaceVariant}
                                />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row flex-wrap items-center justify-between gap-x-2">
                                    <Text className="text-xs font-body-semibold text-[#181C23] dark:text-[#ECEEF4]">
                                        {item.author_name ??
                                            t("accident.communityMember")}
                                    </Text>
                                    <Text className="font-body text-[11px] text-gray-500 dark:text-[#8B92A1]">
                                        {formatDate(item.created_at)}
                                    </Text>
                                </View>
                                <Text className="font-body mt-1 text-sm leading-5 text-[#414755] dark:text-[#AAB0BD]">
                                    {item.body}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {isEmailVerified ? (
                <View className="mt-4">
                    <View className="flex-row items-end gap-2">
                        <TextInput
                            accessibilityLabel={t("accident.addComment")}
                            value={comment}
                            onChangeText={onChangeComment}
                            onFocus={onCommentFocus}
                            placeholder={t("accident.addCommentPlaceholder")}
                            placeholderTextColor={colors.outline}
                            maxLength={2000}
                            multiline
                            editable={!isSendingComment}
                            returnKeyType="send"
                            onSubmitEditing={onSendComment}
                            className="font-body min-h-11 flex-1 rounded-2xl bg-[#F1F3FE] dark:bg-[#242833] px-4 py-3 pl-3 text-[15px] text-[#181C23] dark:text-[#ECEEF4]"
                            style={{
                                maxHeight: 120,
                                textAlignVertical: "top",
                            }}
                        />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("accident.sendComment")}
                            accessibilityState={{
                                disabled:
                                    !comment.trim() ||
                                    isSendingComment,
                            }}
                            disabled={
                                !comment.trim() || isSendingComment
                            }
                            onPress={onSendComment}
                            className="h-11 w-11 items-center justify-center rounded-full bg-[#0058BC] disabled:opacity-50"
                        >
                            {isSendingComment ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Send
                                    size={18}
                                    color="#FFFFFF"
                                />
                            )}
                        </Pressable>
                    </View>
                    {commentError && (
                        <Text
                            accessibilityRole="alert"
                            className="font-body mt-2 text-xs text-[#BA1A1A] dark:text-[#FF7B70]"
                        >
                            {commentError}
                        </Text>
                    )}
                </View>
            ) : (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("accident.verifyToComment")}
                    onPress={onVerifyEmail}
                    className="mt-4 rounded-xl bg-amber-50 dark:bg-[#2B2313] px-3 py-3"
                >
                    <Text className="font-body text-sm text-amber-800 dark:text-[#F5D58A]">
                        {t("accident.verifyToCommentText")}{" "}
                        <Text className="text-sm font-body-bold text-[#0058BC] dark:text-[#3B87F5]">
                            {t("accident.verifyNow")}
                        </Text>
                    </Text>
                </Pressable>
            )}
        </SectionCard>
    );
}
