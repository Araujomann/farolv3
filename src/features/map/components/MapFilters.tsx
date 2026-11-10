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

const SEVERITY_OPTIONS: { value: AccidentSeverity; label: string; color: string }[] = [
    { value: "low", label: "Baixa", color: "#0969D7" },
    { value: "medium", label: "Média", color: "#D99A24" },
    { value: "high", label: "Alta", color: "#D9534F" },
    { value: "critical", label: "Crítica", color: "#B42318" },
];

const CLASSIFICATION_OPTIONS: { value: AccidentClassification; label: string }[] = [
    { value: "sem_vitima", label: "Sem vítima" },
    { value: "com_vitima", label: "Com vítima" },
];

const WEATHER_OPTIONS: { value: AccidentWeatherCondition; label: string; icon: string }[] = [
    { value: "ceu_claro", label: "Céu claro", icon: "☀️" },
    { value: "chuva", label: "Chuva", icon: "🌧️" },
    { value: "nublado", label: "Nublado", icon: "☁️" },
    { value: "garoa", label: "Garoa", icon: "🌦️" },
];

const SOURCE_OPTIONS: { value: AccidentSource; label: string }[] = [
    { value: "APP", label: "Usuários" },
    { value: "PRF", label: "PRF (oficial)" },
];

type MapFiltersProps = {
    filters: AccidentMapFilters;
    onApply: (filters: AccidentMapFilters) => void;
    onClear: () => void;
    topOffset?: number;
};

export function MapFilters({
    filters,
    onApply,
    onClear,
    topOffset = 84,
}: MapFiltersProps) {
    const insets = useSafeAreaInsets();
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<AccidentMapFilters>(filters);

    const activeCount = Object.values(filters).filter(
        (v) => v !== undefined && v !== "",
    ).length;

    const handleOpen = () => {
        setDraft(filters);
        setIsOpen(true);
    };

    const handleApply = () => {
        const cleaned: AccidentMapFilters = {};
        if (draft.severity) cleaned.severity = draft.severity;
        if (draft.classificacao) cleaned.classificacao = draft.classificacao;
        if (draft.condicao_meteorologica)
            cleaned.condicao_meteorologica = draft.condicao_meteorologica;
        if (draft.source) cleaned.source = draft.source;
        onApply(cleaned);
        setIsOpen(false);
    };

    const handleClear = () => {
        setDraft({});
        onClear();
        setIsOpen(false);
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
                className="absolute right-4 z-10 flex-row items-center gap-1.5 rounded-full bg-white px-4 py-2.5 shadow-lg"
                style={{ top: insets.top + topOffset }}
            >
                <SlidersHorizontal size={16} color="#374151" />
                <Text className="text-sm font-semibold text-gray-700">
                    Filtros
                </Text>
                {activeCount > 0 && (
                    <View className="ml-0.5 h-5 w-5 items-center justify-center rounded-full bg-[#0969D7]">
                        <Text className="text-[10px] font-bold text-white">
                            {activeCount}
                        </Text>
                    </View>
                )}
            </Pressable>
        );
    }

    return (
        <View className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl bg-white pb-8 pt-4 shadow-2xl">
            <View className="mb-4 flex-row items-center justify-between px-5">
                <Text className="text-lg font-bold text-gray-900">
                    Filtros
                </Text>
                <Pressable
                    onPress={() => setIsOpen(false)}
                    className="rounded-full bg-gray-100 p-2"
                >
                    <X size={18} color="#374151" />
                </Pressable>
            </View>

            <ScrollView
                className="max-h-96 px-5"
                showsVerticalScrollIndicator={false}
            >
                <FilterSection title="Severidade">
                    {SEVERITY_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={opt.label}
                            active={draft.severity === opt.value}
                            activeColor={opt.color}
                            dot={opt.color}
                            onPress={() => toggleFilter("severity", opt.value)}
                        />
                    ))}
                </FilterSection>

                <FilterSection title="Classificação">
                    {CLASSIFICATION_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={opt.label}
                            active={draft.classificacao === opt.value}
                            onPress={() =>
                                toggleFilter("classificacao", opt.value)
                            }
                        />
                    ))}
                </FilterSection>

                <FilterSection title="Condição meteorológica">
                    {WEATHER_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={`${opt.icon} ${opt.label}`}
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

                <FilterSection title="Fonte dos dados">
                    {SOURCE_OPTIONS.map((opt) => (
                        <FilterChip
                            key={opt.value}
                            label={opt.label}
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
                    className="flex-1 items-center rounded-full border border-gray-200 bg-gray-50 py-3"
                >
                    <Text className="text-sm font-semibold text-gray-700">
                        Limpar
                    </Text>
                </Pressable>
                <Pressable
                    onPress={handleApply}
                    className="flex-1 items-center rounded-full bg-[#0969D7] py-3"
                >
                    <Text className="text-sm font-semibold text-white">
                        Aplicar
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
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                {title}
            </Text>
            <View className="flex-row flex-wrap gap-2">{children}</View>
        </View>
    );
}

function FilterChip({
    label,
    active,
    activeColor = "#0969D7",
    dot,
    onPress,
}: {
    label: string;
    active: boolean;
    activeColor?: string;
    dot?: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-2"
            style={{
                backgroundColor: active ? activeColor : "#F9FAFB",
                borderColor: active ? activeColor : "#E5E7EB",
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
                className="text-sm font-medium"
                style={{ color: active ? "#FFFFFF" : "#374151" }}
            >
                {label}
            </Text>
        </Pressable>
    );
}
