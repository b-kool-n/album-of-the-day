// The phone's own tab bar (iOS and Android).
import { NativeTabs } from "expo-router/native-tabs";
import { C } from "@/lib/theme";

export function AppTabs() {
  return (
    <NativeTabs backgroundColor={C.bg} tintColor={C.orange} iconColor={{ default: C.muted, selected: C.orange }} labelStyle={{ default: { color: C.muted }, selected: { color: C.ink } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="opticaldisc" md="album" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>Your scores</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="archive">
        <NativeTabs.Trigger.Label>Archive</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.stack" md="library_music" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="suggest">
        <NativeTabs.Trigger.Label>Suggest</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
