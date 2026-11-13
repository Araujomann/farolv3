import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { usePathname } from "expo-router";

import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  afterUiSettles,
  TITLE_COLOR_TRANSITION_MS,
  titleColorEasing,
  useProfileTitleColorStore,
} from "@/src/features/profile/titleColorStore";
import {
  mixHex,
  useOverLayerStyle,
  useUnderLayerStyle,
} from "@/components/ui/AnimatedColor";
import {
  TitleColorIcon,
  useTitleColor,
} from "@/src/features/profile/components/TitleColor";

import {
  House,
  Map,
  User,
  Plus,
  type LucideIcon,
} from "lucide-react-native";

const ACTIVE_COLOR = "#0969D7";
const INACTIVE_COLOR = "#6B7280";
const LEAVE_PROFILE_TRANSITION_MS = 700;

/**
 * Cor do rótulo: mistura a cor normal da aba com a cor do título conforme
 * `profileMix` (0 = cores normais, 1 = cor do título). Roda na thread de UI.
 */
function useTabLabelStyle(baseColor: string, profileMix: SharedValue<number>) {
  const titleColor = useTitleColor();

  return useAnimatedStyle(
    () => ({
      color: mixHex(baseColor, titleColor.value, profileMix.value),
    }),
    [baseColor],
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: LucideIcon;
  label: string;
  profileMix: SharedValue<number>;
};

const TAB_ICON_SIZE = 23;
const TAB_ICON_STROKE = 2.4;

function TabButton({
  icon: Icon,
  label,
  isFocused,
  profileMix,
  ...props
}: TabButtonProps) {
  const baseColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
  const baseIconStyle = useUnderLayerStyle(profileMix);
  const titleIconStyle = useOverLayerStyle(profileMix);
  const labelStyle = useTabLabelStyle(baseColor, profileMix);

  return (
    <Pressable
      {...props}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center gap-1">
        <View style={styles.icon}>
          <Animated.View style={[StyleSheet.absoluteFill, baseIconStyle]}>
            <Icon
              size={TAB_ICON_SIZE}
              color={baseColor}
              strokeWidth={TAB_ICON_STROKE}
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, titleIconStyle]}>
            <TitleColorIcon
              icon={Icon}
              size={TAB_ICON_SIZE}
              strokeWidth={TAB_ICON_STROKE}
            />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

type ReportTabProps = TabTriggerSlotProps & {
  profileMix: SharedValue<number>;
};

function ReportTab({
  isFocused,
  profileMix,
  ...props
}: ReportTabProps) {
  const labelStyle = useTabLabelStyle(
    isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
    profileMix,
  );

  return (
    <Pressable
      {...props}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center">
        {/* Espaço reservado para o botão */}
        <View className="h-8" />

        {/* Rótulo alinhado com os demais */}
        <Animated.Text style={[styles.label, labelStyle]}>
          Relatar
        </Animated.Text>

        {/* Botão flutuante */}
        <View
          className="absolute items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,

            // Sobe mais o botão sem mexer no rótulo
            top: -48,

            backgroundColor: ACTIVE_COLOR,

            elevation: 10,

            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.18,
            shadowRadius: 6,
          }}
        >
          <Plus
            size={31}
            color="#FFFFFF"
            strokeWidth={2.5}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function Layout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isTitleColorResolved = useProfileTitleColorStore(
    (state) => state.isTitleColorResolved,
  );
  const isProfileSelected = pathname === "/profile";
  // Só aplica a cor do título depois que ela é conhecida, evitando uma
  // troca intermediária para uma cor provisória.
  const shouldUseTitleColor = isProfileSelected && isTitleColorResolved;
  const profileMix = useSharedValue(0);

  useEffect(() => {
    // Espera a tela montar e a UI assentar; a animação em si roda
    // inteiramente na thread de UI.
    return afterUiSettles(() => {
      profileMix.value = withTiming(shouldUseTitleColor ? 1 : 0, {
        duration: shouldUseTitleColor
          ? TITLE_COLOR_TRANSITION_MS
          : LEAVE_PROFILE_TRANSITION_MS,
        easing: titleColorEasing,
      });
    });
  }, [profileMix, shouldUseTitleColor]);
  const isReportRoute =
    pathname === "/report" ||
    pathname.endsWith("/report") ||
    pathname.includes("/report/");
  const isAccidentDetailRoute = pathname.startsWith("/map/");

  return (
    <Tabs>
      <TabSlot />

      <TabList
        className="flex-row items-center justify-between rounded-t-3xl bg-white"
        style={{
          display: isReportRoute || isAccidentDetailRoute ? "none" : "flex",
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: 8,

          elevation: 12,

          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        }}
      >
        {/* HOME */}
        <TabTrigger
          name="home"
          href="/home"
          asChild
        >
          <TabButton
            icon={House}
            label="Home"
            profileMix={profileMix}
          />
        </TabTrigger>

        {/* MAPA */}
        <TabTrigger
          name="map"
          href="/map"
          asChild
        >
          <TabButton
            icon={Map}
            label="Mapa"
            profileMix={profileMix}
          />
        </TabTrigger>

        {/* RELATAR */}
        <TabTrigger
          name="report"
          href="/report"
          asChild
        >
          <ReportTab
            profileMix={profileMix}
          />
        </TabTrigger>

        {/* PERFIL */}
        <TabTrigger
          name="profile"
          href="/profile"
          asChild
        >
          <TabButton
            icon={User}
            label="Perfil"
            profileMix={profileMix}
          />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});
