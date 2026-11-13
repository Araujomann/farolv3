import { Text } from "@/components/ui/text";
import {
    createAccidentComment,
    getAccidentDetails,
    getAccidentTrust,
    setAccidentTrust,
} from "@/src/features/map/services/accidentService";
import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    BadgeCheck,
    CalendarDays,
    MapPin,
    Send,
    ShieldCheck,
    UserRound,
} from "lucide-react-native";
import { Image } from "expo-image";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Keyboard,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#0058BC";
const PAGE_BACKGROUND = "#F2F2F7";
const SEVERITY_LABELS = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
    unknown: "Não informada",
} as const;
const CLASSIFICATION_LABELS = {
    com_vitima: "Com vítima",
    sem_vitima: "Sem vítima",
} as const;
const WEATHER_LABELS = {
    ceu_claro: "Céu claro",
    chuva: "Chuva",
    nublado: "Nublado",
    garoa: "Garoa",
} as const;

export default function AccidentDetailsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<{ accidentId?: string | string[] }>();
    const accidentId = Array.isArray(params.accidentId)
        ? params.accidentId[0]
        : params.accidentId;
    const user = useAuthStore((state) => state.user);
    const { width } = useWindowDimensions();
    const imageWidth = width - 32;
    const requestId = useRef(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const [accident, setAccident] = useState<AccidentDetail | null>(null);
    const [trustedByMe, setTrustedByMe] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isUpdatingTrust, setIsUpdatingTrust] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [trustError, setTrustError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [address, setAddress] = useState<string | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            "keyboardDidShow",
            (event) => {
                setKeyboardHeight(event.endCoordinates.height);
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 80);
            },
        );
        const hideSubscription = Keyboard.addListener(
            "keyboardDidHide",
            () => setKeyboardHeight(0),
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const scrollToComment = useCallback(() => {
        requestAnimationFrame(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });
    }, []);

    const loadAccident = useCallback(async () => {
        const currentRequestId = ++requestId.current;
        if (!accidentId) {
            setError("Não foi possível identificar este acidente.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setCommentError(null);
        setTrustError(null);

        try {
            const [detailsResult, trustResult] = await Promise.allSettled([
                getAccidentDetails(accidentId),
                getAccidentTrust(accidentId),
            ]);

            if (detailsResult.status === "rejected") {
                throw detailsResult.reason;
            }

            const details = detailsResult.value;
            const trust =
                trustResult.status === "fulfilled"
                    ? trustResult.value
                    : null;

            if (requestId.current === currentRequestId) {
                setAccident({
                    ...details,
                    trusted_count:
                        trust?.trusted_count ?? details.trusted_count ?? 0,
                });
                setTrustedByMe(trust?.trusted_by_me ?? false);
                if (trustResult.status === "rejected") {
                    if (__DEV__) {
                        console.warn(
                            "Falha ao carregar os selos de confiança",
                            trustResult.reason,
                        );
                    }
                    setTrustError(
                        "Não foi possível carregar os votos de confiança. Você ainda pode consultar os detalhes do acidente.",
                    );
                }
                setActiveImage(0);
            }
        } catch (loadError) {
            if (__DEV__) {
                console.warn("Falha ao carregar detalhes do acidente", loadError);
            }
            if (requestId.current === currentRequestId) {
                setError(
                    "Não foi possível carregar os detalhes deste acidente. Verifique a conexão e tente novamente.",
                );
            }
        } finally {
            if (requestId.current === currentRequestId) {
                setIsLoading(false);
            }
        }
    }, [accidentId]);

    useEffect(() => {
        void loadAccident();
        return () => {
            requestId.current += 1;
        };
    }, [loadAccident]);

    const addressAccidentId = accident?.id;
    const addressLongitude = accident?.longitude;
    const addressLatitude = accident?.latitude;

    useEffect(() => {
        if (
            addressAccidentId === undefined ||
            addressLongitude === undefined ||
            addressLatitude === undefined
        ) {
            return;
        }

        let isCurrent = true;
        setAddress(null);
        setIsLoadingAddress(true);

        reverseGeocode(addressLongitude, addressLatitude)
            .then((result) => {
                if (isCurrent) setAddress(result);
            })
            .catch((addressError) => {
                if (__DEV__) {
                    console.warn(
                        "Falha ao carregar o endereço do acidente",
                        addressError,
                    );
                }
            })
            .finally(() => {
                if (isCurrent) setIsLoadingAddress(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [addressAccidentId, addressLatitude, addressLongitude]);

    const handleSendComment = useCallback(async () => {
        const body = comment.trim();
        if (!accidentId || !body || isSendingComment) return;

        setIsSendingComment(true);
        setCommentError(null);
        try {
            const createdComment = await createAccidentComment(accidentId, body);
            setAccident((current) =>
                current
                    ? {
                          ...current,
                          comments: [...current.comments, createdComment],
                      }
                    : current,
            );
            setComment("");
        } catch (commentError) {
            if (__DEV__) {
                console.warn("Falha ao publicar comentário", commentError);
            }
            setCommentError(
                "Não foi possível publicar seu comentário. Verifique sua conexão e tente novamente.",
            );
        } finally {
            setIsSendingComment(false);
        }
    }, [accidentId, comment, isSendingComment]);

    const handleToggleTrust = useCallback(async () => {
        if (!accidentId || !accident || isUpdatingTrust) return;

        setIsUpdatingTrust(true);
        setTrustError(null);
        try {
            const nextTrust = await setAccidentTrust(
                accidentId,
                !trustedByMe,
            );
            setTrustedByMe(nextTrust.trusted_by_me);
            setAccident((current) =>
                current
                    ? { ...current, trusted_count: nextTrust.trusted_count }
                    : current,
            );
        } catch (trustError) {
            if (__DEV__) {
                console.warn("Falha ao atualizar selo de confiança", trustError);
            }
            setTrustError(
                "Não foi possível atualizar o selo de confiança. Verifique sua conexão e tente novamente.",
            );
        } finally {
            setIsUpdatingTrust(false);
        }
    }, [accident, accidentId, isUpdatingTrust, trustedByMe]);

    const handleOpenMap = useCallback(async () => {
        if (!accident) return;
        const url = `https://maps.google.com/?q=${accident.latitude},${accident.longitude}`;

        try {
            await Linking.openURL(url);
        } catch (openError) {
            if (__DEV__) {
                console.warn("Falha ao abrir a localização", openError);
            }
            Alert.alert(
                "Não foi possível abrir o mapa",
                "Tente novamente em instantes.",
            );
        }
    }, [accident]);

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
            style={{ backgroundColor: PAGE_BACKGROUND }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
            <View
                className="flex-row items-center border-b border-gray-100 bg-white px-4 pb-3"
                style={{ paddingTop: insets.top + 8 }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Voltar ao mapa"
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-full bg-gray-50"
                >
                    <ArrowLeft size={20} color={PRIMARY} />
                </Pressable>
                <Text className="flex-1 text-center text-lg font-bold text-[#181C23]">
                    Detalhes do acidente
                </Text>
                <View className="h-10 w-10" />
            </View>

            {isLoading && !accident ? (
                <View className="flex-1 items-center justify-center px-6">
                    <ActivityIndicator size="large" color={PRIMARY} />
                    <Text className="mt-3 text-sm text-gray-600">
                        Carregando detalhes...
                    </Text>
                </View>
            ) : error && !accident ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-center text-sm text-gray-700">
                        {error}
                    </Text>
                    <Pressable
                        onPress={() => void loadAccident()}
                        className="mt-4 rounded-full bg-[#0058BC] px-5 py-3"
                    >
                        <Text className="font-semibold text-white">
                            Tentar novamente
                        </Text>
                    </Pressable>
                </View>
            ) : accident ? (
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom:
                            keyboardHeight + insets.bottom + 28,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="overflow-hidden rounded-2xl bg-white">
                        {accident.images.length > 0 ? (
                            <View>
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={(event) => {
                                        const nextIndex = Math.round(
                                            event.nativeEvent.contentOffset.x /
                                                imageWidth,
                                        );
                                        setActiveImage(
                                            Math.min(
                                                nextIndex,
                                                accident.images.length - 1,
                                            ),
                                        );
                                    }}
                                >
                                    {accident.images.map((image) => (
                                        <Image
                                            key={image.id}
                                            source={{ uri: image.image_url }}
                                            contentFit="cover"
                                            accessibilityLabel={
                                                image.caption ??
                                                "Imagem do acidente"
                                            }
                                            style={{
                                                width: imageWidth,
                                                height: 220,
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                                {accident.images.length > 1 && (
                                    <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-2">
                                        {accident.images.map((image, index) => (
                                            <View
                                                key={image.id}
                                                className={`h-2 w-2 rounded-full ${
                                                    index === activeImage
                                                        ? "bg-white"
                                                        : "bg-white/50"
                                                }`}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="h-[180px] items-center justify-center bg-[#EAF1FF]">
                                <MapPin size={34} color={PRIMARY} />
                                <Text className="mt-2 text-sm font-medium text-[#414755]">
                                    Sem imagem para este acidente
                                </Text>
                            </View>
                        )}
                        <View className="p-4">
                            <View className="flex-row items-start justify-between gap-3">
                                <Text className="flex-1 text-[22px] font-bold text-[#181C23]">
                                    {accident.tipo_acidente ||
                                        "Ocorrência registrada"}
                                </Text>
                                <View className="rounded-full bg-[#FFF1E8] px-3 py-1.5">
                                    <Text className="text-xs font-semibold text-[#B42318]">
                                        {SEVERITY_LABELS[accident.severity]}
                                    </Text>
                                </View>
                            </View>
                            <View className="mt-3 flex-row flex-wrap gap-2">
                                <InfoChip
                                    icon={<CalendarDays size={15} color="#5D5E63" />}
                                    label={formatDate(accident.occurred_at)}
                                />
                                <InfoChip
                                    icon={<ShieldCheck size={15} color="#5D5E63" />}
                                    label={
                                        CLASSIFICATION_LABELS[
                                            accident.classificacao_acidente
                                        ]
                                    }
                                />
                                <InfoChip
                                    icon={<MapPin size={15} color="#5D5E63" />}
                                    label={
                                        WEATHER_LABELS[
                                            accident.condicao_meteorologica
                                        ]
                                    }
                                />
                            </View>
                        </View>
                    </View>

                    {accident.description && (
                        <SectionCard title="Descrição">
                            <Text className="text-[15px] leading-[22px] text-[#414755]">
                                {accident.description}
                            </Text>
                        </SectionCard>
                    )}

                    <SectionCard title="Localização">
                        <View className="flex-row items-center gap-2">
                            <MapPin size={18} color={PRIMARY} />
                            {isLoadingAddress ? (
                                <View className="flex-1 flex-row items-center gap-2">
                                    <ActivityIndicator
                                        size="small"
                                        color={PRIMARY}
                                    />
                                    <Text className="flex-1 text-sm text-[#414755]">
                                        Buscando endereço...
                                    </Text>
                                </View>
                            ) : (
                                <Text className="flex-1 text-sm text-[#414755]">
                                    {address ?? "Endereço não disponível"}
                                </Text>
                            )}
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => void handleOpenMap()}
                            className="mt-3 items-center rounded-xl bg-[#F1F3FE] py-3"
                        >
                            <Text className="text-sm font-semibold text-[#0058BC]">
                                Abrir localização no mapa
                            </Text>
                        </Pressable>
                    </SectionCard>

                    <SectionCard title="Fonte do relato">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <BadgeCheck
                                    size={20}
                                    color={accident.source === "PRF" ? "#14804A" : PRIMARY}
                                />
                                <Text className="text-sm font-semibold text-[#181C23]">
                                    {accident.source === "PRF"
                                        ? "Polícia Rodoviária Federal"
                                        : "Relato da comunidade"}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-500">
                                {formatDate(accident.created_at)}
                            </Text>
                        </View>
                    </SectionCard>

                    <View className="mt-4 rounded-2xl bg-white p-4">
                        <View className="flex-row items-center justify-between gap-3">
                            <View className="flex-1">
                                <Text className="text-xs font-semibold uppercase tracking-wide text-[#5D5E63]">
                                    Confiabilidade
                                </Text>
                                <Text className="mt-1 text-sm text-[#414755]">
                                    {trustedByMe
                                        ? "Você marcou este relato como confiável."
                                        : "Ajude a comunidade a identificar relatos confiáveis."}
                                </Text>
                            </View>
                            <View className="items-center rounded-xl bg-[#F1F3FE] px-3 py-2">
                                <Text className="text-xl font-bold text-[#0058BC]">
                                    {accident.trusted_count}
                                </Text>
                                <Text className="text-[10px] text-[#414755]">
                                    selos
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
                            onPress={() => void handleToggleTrust()}
                            className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                                trustedByMe
                                    ? "bg-[#EAF7EF]"
                                    : "bg-[#0058BC]"
                            } ${!canTrust || isUpdatingTrust ? "opacity-60" : ""}`}
                        >
                            {isUpdatingTrust ? (
                                <ActivityIndicator
                                    size="small"
                                    color={trustedByMe ? "#14804A" : "#FFFFFF"}
                                />
                            ) : (
                                <BadgeCheck
                                    size={19}
                                    color={trustedByMe ? "#14804A" : "#FFFFFF"}
                                />
                            )}
                            <Text
                                className={`text-sm font-semibold ${
                                    trustedByMe
                                        ? "text-[#14804A]"
                                        : "text-white"
                                }`}
                            >
                                {trustedByMe
                                    ? "Retirar selo confiável"
                                    : canTrust
                                      ? "Marcar como confiável"
                                      : isOwnReport
                                        ? "Você é autor deste relato"
                                        : !isEmailVerified
                                          ? "Confirme seu e-mail para votar"
                                          : "Selo disponível para relatos da comunidade"}
                            </Text>
                        </Pressable>
                    </View>
                    {trustError && (
                        <Text
                            accessibilityRole="alert"
                            className="mt-3 text-xs text-[#BA1A1A]"
                        >
                            {trustError}
                        </Text>
                    )}

                    <SectionCard
                        title={`Comentários (${accident.comments.length})`}
                    >
                        {accident.comments.length === 0 ? (
                            <Text className="py-2 text-sm text-gray-500">
                                Nenhum comentário até o momento.
                            </Text>
                        ) : (
                            <View className="gap-4">
                                {accident.comments.map((item) => (
                                    <View
                                        key={item.id}
                                        className="flex-row gap-3"
                                    >
                                        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE]">
                                            <UserRound
                                                size={18}
                                                color="#5D5E63"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row flex-wrap items-center justify-between gap-x-2">
                                                <Text className="text-xs font-semibold text-[#181C23]">
                                                    {item.author_name ??
                                                        "Pessoa da comunidade"}
                                                </Text>
                                                <Text className="text-[11px] text-gray-500">
                                                    {formatDate(item.created_at)}
                                                </Text>
                                            </View>
                                            <Text className="mt-1 text-sm leading-5 text-[#414755]">
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
                                        accessibilityLabel="Adicionar comentário"
                                        value={comment}
                                        onChangeText={setComment}
                                        onFocus={scrollToComment}
                                        placeholder="Adicionar comentário..."
                                        placeholderTextColor="#717786"
                                        maxLength={2000}
                                        multiline
                                        editable={!isSendingComment}
                                        returnKeyType="send"
                                        onSubmitEditing={() =>
                                            void handleSendComment()
                                        }
                                        className="min-h-11 flex-1 rounded-2xl bg-[#F1F3FE] px-4 py-3 pl-3 text-[15px] text-[#181C23]"
                                        style={{
                                            maxHeight: 120,
                                            textAlignVertical: "top",
                                        }}
                                    />
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Enviar comentário"
                                        accessibilityState={{
                                            disabled:
                                                !comment.trim() ||
                                                isSendingComment,
                                        }}
                                        disabled={
                                            !comment.trim() || isSendingComment
                                        }
                                        onPress={() =>
                                            void handleSendComment()
                                        }
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
                                        className="mt-2 text-xs text-[#BA1A1A]"
                                    >
                                        {commentError}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Verificar e-mail para comentar"
                                onPress={() =>
                                    router.push(verifyEmailFromAppRoute)
                                }
                                className="mt-4 rounded-xl bg-amber-50 px-3 py-3"
                            >
                                <Text className="text-sm text-amber-800">
                                    Confirme seu e-mail para participar dos
                                    comentários e votar.{" "}
                                    <Text className="text-sm font-bold text-[#0058BC]">
                                        Verificar agora
                                    </Text>
                                </Text>
                            </Pressable>
                        )}
                    </SectionCard>
                </ScrollView>
            ) : null}
        </KeyboardAvoidingView>
    );
}

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <View className="mt-4 rounded-2xl bg-white p-4">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5D5E63]">
                {title}
            </Text>
            {children}
        </View>
    );
}

function InfoChip({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <View className="flex-row items-center gap-1.5 rounded-full bg-[#F1F3FE] px-2.5 py-1.5">
            {icon}
            <Text className="text-xs font-medium text-[#414755]">{label}</Text>
        </View>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Data não informada";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}