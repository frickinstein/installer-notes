import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { getUnreadCount } from "@/lib/queries/notifications";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const unread = useQuery({ queryKey: ["unread-count"], queryFn: getUnreadCount, refetchInterval: 60_000 });

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textBright,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Search",
          headerTitle: "Tint Notes",
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarBadge: unread.data ? unread.data : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white },
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
