import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";
import { C, F } from "@/lib/theme";

// Stand-in tab bar for the web build only (used for previews). Phones use the native tab bar.
export function AppTabs() {
  return (
    <Tabs>
      <View style={{ flex: 1 }}>
        <TabSlot />
      </View>
      <TabList style={st.bar}>
        <TabTrigger name="index" href="/" asChild><Tab label="Today" /></TabTrigger>
        <TabTrigger name="me" href="/me" asChild><Tab label="Your scores" /></TabTrigger>
        <TabTrigger name="archive" href="/archive" asChild><Tab label="Archive" /></TabTrigger>
        <TabTrigger name="suggest" href="/suggest" asChild><Tab label="Suggest" /></TabTrigger>
        <TabTrigger name="account" href="/account" asChild><Tab label="Account" /></TabTrigger>
      </TabList>
    </Tabs>
  );
}

function Tab({ label, isFocused, ...props }: TabTriggerSlotProps & { label: string }) {
  return (
    <Pressable {...(props as PressableProps)} style={st.tab}>
      <View style={[st.dot, isFocused && { backgroundColor: C.orange }]} />
      <Text style={[st.label, isFocused && { color: C.ink }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingTop: 8, paddingBottom: 22 },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.line },
  label: { fontFamily: F.semibold, fontSize: 11, color: C.muted },
});
