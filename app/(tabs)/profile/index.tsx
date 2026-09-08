import React, { useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, Mail, CalendarDays, User as UserIcon, ShieldCheck } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText, ButtonIcon, ButtonSpinner } from "@/components/ui/button";

import { useAuthStore } from "@/src/store/authStore";

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
        } finally {
            setIsLoggingOut(false);
        }
    };

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() ?? "?";

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : "—";

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 32,
            }}
        >
            <ProfileHeader initials={initials} name={user?.name} email={user?.email} />
            <AccountInfo
                email={user?.email}
                name={user?.name}
                isVerified={user?.is_verified}
                memberSince={memberSince}
            />
            <LogoutButton isLoggingOut={isLoggingOut} onPress={handleLogout} />
        </ScrollView>
    );
}


/* ─── Sub-componentes locais ─── */

type ProfileHeaderProps = {
    initials: string;
    name?: string;
    email?: string;
};

function ProfileHeader({ initials, name, email }: ProfileHeaderProps) {
    return (
        <VStack space="sm" className="items-center px-6 pb-8 pt-4">
            <Box className="h-24 w-24 items-center justify-center rounded-full bg-primary">
                <Text className="text-3xl font-bold text-on-primary">{initials}</Text>
            </Box>
            <VStack space="xs" className="items-center">
                <Text className="text-xl font-bold text-foreground">{name ?? "Usuário"}</Text>
                <Text className="text-sm text-muted-foreground">{email ?? "—"}</Text>
            </VStack>
        </VStack>
    );
}

type AccountInfoProps = {
    email?: string;
    name?: string;
    isVerified?: boolean;
    memberSince: string;
};

function AccountInfo({ email, name, isVerified, memberSince }: AccountInfoProps) {
    return (
        <VStack space="sm" className="px-6">
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informações da conta
            </Text>
            <Box className="rounded-2xl bg-card p-4">
                <VStack space="md">
                    <InfoRow icon={Mail} label="E-mail" value={email ?? "—"} />
                    <Box className="h-px bg-border" />
                    <InfoRow icon={UserIcon} label="Nome" value={name ?? "—"} />
                    <Box className="h-px bg-border" />
                    <InfoRow
                        icon={ShieldCheck}
                        label="E-mail verificado"
                        value={isVerified ? "Sim" : "Não verificado"}
                    />
                    <Box className="h-px bg-border" />
                    <InfoRow icon={CalendarDays} label="Membro desde" value={memberSince} />
                </VStack>
            </Box>
        </VStack>
    );
}

type InfoRowProps = {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
};

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
    return (
        <Box className="flex-row items-center gap-3">
            <Box className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon size={18} color="#0058BC" />
            </Box>
            <VStack>
                <Text className="text-xs text-muted-foreground">{label}</Text>
                <Text className="text-sm font-medium text-foreground">{value}</Text>
            </VStack>
        </Box>
    );
}

type LogoutButtonProps = {
    isLoggingOut: boolean;
    onPress: () => void;
};

function LogoutButton({ isLoggingOut, onPress }: LogoutButtonProps) {
    return (
        <Box className="px-6 pt-8">
            <Button
                variant="outline"
                className="h-12 rounded-xl border-error"
                onPress={onPress}
                disabled={isLoggingOut}
            >
                {isLoggingOut ? (
                    <ButtonSpinner color="#BA1A1A" />
                ) : (
                    <>
                        <ButtonIcon as={LogOut} className="text-error" />
                        <ButtonText className="text-error font-semibold">Sair da conta</ButtonText>
                    </>
                )}
            </Button>
        </Box>
    );
}
