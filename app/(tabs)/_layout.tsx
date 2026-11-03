import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { usePathname } from "expo-router";

import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  House,
  Map,
  User,
  Plus,
  type LucideIcon,
} from "lucide-react-native";

const ACTIVE_COLOR = "#0969D7";
const INACTIVE_COLOR = "#6B7280";

type TabButtonProps = TabTriggerSlotProps & {
  icon: LucideIcon;
  label: string;
};

function TabButton({
  icon: Icon,
  label,
  isFocused,
  ...props
}: TabButtonProps) {
  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      {...props}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center gap-1">
        <Icon
          size={23}
          color={color}
          strokeWidth={2.4}
        />

        <Text
          className="text-xs font-semibold"
          style={{
            color,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function ReportTab({
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const textColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      {...props}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center">
        {/* Espaço reservado para o botão */}
        <View className="h-8" />

        {/* Rótulo alinhado com os demais */}
        <Text
          className="text-xs font-semibold"
          style={{
            color: textColor,
          }}
        >
          Relatar
        </Text>

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
  const isReportRoute =
    pathname === "/report" ||
    pathname.endsWith("/report") ||
    pathname.includes("/report/");

  return (
    <Tabs>
      <TabSlot />

      <TabList
        className="flex-row items-center justify-between rounded-t-3xl bg-white"
        style={{
          display: isReportRoute ? "none" : "flex",
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
          />
        </TabTrigger>

        {/* RELATAR */}
        <TabTrigger
          name="report"
          href="/report"
          asChild
        >
          <ReportTab />
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
          />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}