import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SlidersHorizontal, X, Check } from "lucide-react-native";
import type {
    AccidentClassification,
    AccidentMapFilters,
    AccidentSeverity,
    AccidentSource,
    AccidentWeatherCondition,
} from "../types/accident.types";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation, type TranslationKey } from "@/src/i18n";
import { SEVERITY_COLORS } from "@/src/theme/colors";
const SEVERITY_OPTIONS: { value: AccidentSeverity; label: TranslationKey; color: string }[] = [
    { value: "low", label: "enums.severity.low", color: SEVERITY_COLORS.low },
    { value: "medium", label: "enums.severity.medium", color: SEVERITY_COLORS.medium },
    { value: "high", label: "enums.severity.high", color: SEVERITY_COLORS.high },
    { value: "critical", label: "enums.severity.critical", color: SEVERITY_COLORS.critical },
];

const CLASSIFICATION_OPTIONS: { value: AccidentClassification; label: TranslationKey }[] = [
    { value: "sem_vitima", label: "enums.classification.sem_vitima" },
    { value: "com_vitima", label: "enums.classification.com_vitima" },
];

const WEATHER_OPTIONS: { value: AccidentWeatherCondition; label: TranslationKey; icon: string }[] = [
    { value: "ceu_claro", label: "enums.weather.ceu_claro", icon: "☀️" },
    { value: "chuva", label: "enums.weather.chuva", icon: "🌧️" },
    { value: "nublado", label: "enums.weather.nublado", icon: "☁️" },
    { value: "garoa", label: "enums.weather.garoa", icon: "🌦️" },
];

const SOURCE_OPTIONS: { value: AccidentSource; label: TranslationKey }[] = [
    { value: "APP", label: "enums.source.APP" },
    { value: "PRF", label: "enums.source.PRF" },
];

type TemporalPeriod = "quarterly" | "semiannual" | "annual" | "biennial";

const TEMPORAL_PERIOD_OPTIONS: {
    value: TemporalPeriod;
    label: TranslationKey;
    months: number;
}[] = [
    { value: "quarterly", label: "filters.quarterly", months: 3 },
    { value: "semiannual", label: "filters.semiannual", months: 6 },
    { value: "annual", label: "filters.annual", months: 12 },
    { value: "biennial", label: "filters.biennial", months: 24 },
];

type MapFiltersProps = {
    filters: AccidentMapFilters;
    onApply: (filters: AccidentMapFilters) => void;
    onClear: () => void;
    onInteraction: () => void;
    topOffset?: number;
};

export function MapFilters({
    filters,
    onApply,
    onClear,
    onInteraction,
    topOffset = 84,
}: MapFiltersProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<AccidentMapFilters>(filters);
    const [period, setPeriod] = useState<TemporalPeriod | null>(null);
    const [draftPeriod, setDraftPeriod] = useState<TemporalPeriod | null>(null);

    const activeCount =
        Object.entries(filters).filter(
            ([key, value]) =>
                key !== "from" &&
                key !== "to" &&
                value !== undefined &&
                value !== "",
        ).length + (filters.from || filters.to ? 1 : 0);

    const handleOpen = () => {
        setDraft(filters);
        setDraftPeriod(period);
        setIsOpen(true);
    };

    const handleApply = () => {
        const cleaned: AccidentMapFilters = {};
        if (draft.severity) cleaned.severity = draft.severity;
        if (draft.classificacao) cleaned.classificacao = draft.classificacao;
        if (draft.condicao_meteorologica)
            cleaned.condicao_meteorologica = draft.condicao_meteorologica;
        if (draft.source) cleaned.source = draft.source;
        if (draft.from) cleaned.from = draft.from;
        if (draft.to) cleaned.to = draft.to;
        onApply(cleaned);
        setPeriod(draftPeriod);
        setIsOpen(false);
    };

    const handleClear = () => {
        setDraft({});
        setDraftPeriod(null);
        setPeriod(null);
        onClear();
        setIsOpen(false);
    };

    const togglePeriod = (value: TemporalPeriod, months: number) => {
        if (draftPeriod === value) {
            setDraft((prev) => ({ ...prev, from: undefined, to: undefined }));
            setDraftPeriod(null);
            return;
        }

        const now = new Date();
        const from = new Date(now);
        const dayOfMonth = from.getDate();
        from.setDate(1);
        from.setMonth(from.getMonth() - months);
        const lastDayOfMonth = new Date(
            from.getFullYear(),
            from.getMonth() + 1,
            0,
        ).getDate();
        from.setDate(Math.min(dayOfMonth, lastDayOfMonth));

        setDraft((prev) => ({
            ...prev,
            from: from.toISOString(),
            to: now.toISOString(),
        }));
        setDraftPeriod(value);
    };

    const toggleFilter = <K extends keyof AccidentMapFilters>(
        key: K,
        value: AccidentMapFilters[K],
    ) => {
        setDraft((prev) => ({
            ...prev,
            [key]: prev[key] === value ? undefined : value,
        }));
    };

    if (!isOpen) {
        return (
            <Pressable
                onPress={handleOpen}
                onTouchStart={onInteraction}
                className="absolute right-4 z-10 flex-row items-center gap-1.5 rounded-full bg-white dark:bg-[#1A1D24] px-4 py-2.5 shadow-lg"
                style={{ top: insets.top + topOffset }}
            >
                <SlidersHorizontal size={16} color={colors.onSurface} />
                <Text className="text-sm font-body-semibold text-gray-700 dark:text-[#AAB0BD]">
                    {t("filters.title")}
                </Text>
                {activeCount > 0 && (
                    <View className="ml-0.5 h-5 w-5 items-center justify-center rounded-full bg-[#0969D7]">
                        <Text className="text-[10px] font-body-bold text-white">
                            {activeCount}
                        </Text>
                    </View>
                )}
            </Pressable>
        );
    }

    return (
        <View
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl bg-white dark:bg-[#1A1D24] pb-8 pt-4 shadow-2xl"
            onTouchStart={onInteraction}
        >
            <View className="mb-4 flex-row items-center justify-between px-5">
                <Text className="text-lg font-body-bold text-gray-900 dark:text-[#ECEEF4]">
                    {t("filters.title")}
                </Text>
                <Pressable
                    onPress={() => setIsOpen(false)}
                    className="rounded-full bg-gray-100 dark:bg-[#242833] p-2"
                >
                    <X size={18} color={colors.onSurface} />
                </Pressable>
            </View>

            <ScrollView
                className="max-h-96 px-5"
                showsVerticalScrollIndicator={false}
            >
                <FilterSection title={t("filters.severity")}>
                    {SEVERITY_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={t(opt.label)}
                            active={draft.severity === opt.value}
                            activeColor={opt.color}
                            dot={opt.color}
                            onPress={() => toggleFilter("severity", opt.value)}
                        />
                    ))}
                </FilterSection>

                <FilterSection title={t("filters.period")}>
                    {TEMPORAL_PERIOD_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={t(opt.label)}
                            active={draftPeriod === opt.value}
                            onPress={() => togglePeriod(opt.value, opt.months)}
                        />
                    ))}
                </FilterSection>

                <FilterSection title={t("filters.classification")}>
                    {CLASSIFICATION_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={t(opt.label)}
                            active={draft.classificacao === opt.value}
                            onPress={() =>
                                toggleFilter("classificacao", opt.value)
                            }
                        />
                    ))}
                </FilterSection>

                <FilterSection title={t("filters.weather")}>
                    {WEATHER_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={`${opt.icon} ${t(opt.label)}`}
                            active={
                                draft.condicao_meteorologica === opt.value
                            }
                            onPress={() =>
                                toggleFilter(
                                    "condicao_meteorologica",
                                    opt.value,
                                )
                            }
                        />
                    ))}
                </FilterSection>

                <FilterSection title={t("filters.source")}>
                    {SOURCE_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={t(opt.label)}
                            active={draft.source === opt.value}
                            onPress={() =>
                                toggleFilter("source", opt.value)
                            }
                        />
                    ))}
                </FilterSection>
            </ScrollView>

            <View className="mt-4 flex-row gap-3 px-5">
                <Pressable
                    onPress={handleClear}
                    className="flex-1 items-center rounded-full border border-gray-200 dark:border-[#3A3F4B] bg-gray-50 dark:bg-[#242833] py-3"
                >
                    <Text className="text-sm font-body-semibold text-gray-700 dark:text-[#AAB0BD]">
                        {t("filters.clear")}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={handleApply}
                    className="flex-1 items-center rounded-full bg-[#0969D7] py-3"
                >
                    <Text className="text-sm font-body-semibold text-white">
                        {t("filters.apply")}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}


function FilterSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-xs font-body-bold uppercase tracking-wide text-gray-500 dark:text-[#8B92A1]">
                {title}
            </Text>
            <View className="flex-row flex-wrap gap-2">{children}</View>
        </View>
    );
}

function FilterChip({
    label,
    active,
    activeColor: activeColorProp,
    dot,
    onPress,
}: {
    label: string;
    active: boolean;
    activeColor?: string;
    dot?: string;
    onPress: () => void;
}) {
    const { colors } = useAppTheme();
    const activeColor = activeColorProp ?? colors.accent;

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-2"
            style={{
                backgroundColor: active ? activeColor : colors.background,
                borderColor: active ? activeColor : colors.outlineVariant,
            }}
        >
            {dot && (
                <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                        backgroundColor: active ? "#FFFFFF" : dot,
                    }}
                />
            )}
            {!dot && active && <Check size={14} color="#FFFFFF" />}
            <Text
                className="text-sm font-body-medium"
                style={{ color: active ? "#FFFFFF" : colors.onSurface }}
            >
                {label}
            </Text>
        </Pressable>
    );
}
