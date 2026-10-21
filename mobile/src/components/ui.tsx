import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch as RNSwitch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "@/lib/theme";
import { Logo, Disc } from "./Logo";

// ===== Text =====

type Variant = "body" | "muted" | "small" | "eyebrow" | "h1" | "title" | "h2" | "num" | "label" | "err" | "ok";

export function T({ v = "body", style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[s.base, s[v], style]} maxFontSizeMultiplier={1.6} />;
}

// ===== Page =====

// A scrolling page with the brand bar at the top and pull-to-refresh.
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  brand = true,
  top,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  brand?: boolean;
  top?: ReactNode;
}) {
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      {brand && (
        <View style={s.brandBar}>
          <Logo size={30} />
          <T style={s.wordmark} accessibilityRole="header">Album of the Day</T>
        </View>
      )}
      {top}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} colors={[C.orange]} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={C.orange} />
    </View>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <View style={s.empty}>
      <View style={{ width: 120 }}>
        <Disc size={120} />
      </View>
      <T v="title" style={{ fontSize: 26, textAlign: "center" }}>{title}</T>
      {children && <T v="muted" style={{ textAlign: "center" }}>{children}</T>}
      {action}
    </View>
  );
}

export function Panel({ title, sub, children, style, right }: { title?: string; sub?: string; children?: ReactNode; style?: StyleProp<ViewStyle>; right?: ReactNode }) {
  return (
    <View style={[s.panel, style]}>
      {(title || right) && (
        <View style={s.panelHead}>
          <View style={{ flex: 1 }}>
            {title && <T v="h2" accessibilityRole="header">{title}</T>}
            {sub && <T v="muted" style={{ marginTop: 2 }}>{sub}</T>}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <View style={s.banner}>
      <T>{children}</T>
    </View>
  );
}

// ===== Controls =====

export function Button({
  label,
  onPress,
  kind = "orange",
  small = false,
  disabled = false,
  busy = false,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  kind?: "orange" | "white" | "ghost" | "link";
  small?: boolean;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      accessibilityHint={accessibilityHint}
      hitSlop={kind === "link" ? 10 : 4}
      style={({ pressed }) => [
        kind === "link" ? s.link : [s.btn, small && s.btnSmall, s[`btn_${kind}`]],
        off && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[kind === "link" ? s.linkText : [s.btnText, small && { fontSize: 14 }, s[`btnText_${kind}`]]]} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, hint, count, max, ...input }: TextInputProps & { label?: string; hint?: string; count?: number; max?: number }) {
  return (
    <View style={{ marginTop: 16 }}>
      {label && <T v="label" style={{ marginBottom: 6 }}>{label}</T>}
      <TextInput
        placeholderTextColor="#6b6b6b"
        selectionColor={C.orange}
        cursorColor={C.orange}
        keyboardAppearance="dark"
        maxLength={max}
        {...input}
        style={[s.input, input.multiline && s.textarea, input.style as StyleProp<TextStyle>]}
      />
      {hint && <T v="small" style={{ marginTop: 6 }}>{hint}</T>}
      {max != null && count != null && <T v="small" style={{ textAlign: "right", marginTop: 4 }}>{count}/{max}</T>}
    </View>
  );
}

export function Toggle({ label, detail, value, onChange, disabled }: { label: string; detail?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Pressable style={s.switchRow} onPress={() => !disabled && onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} accessibilityLabel={label} accessibilityHint={detail}>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: F.semibold }}>{label}</T>
        {detail && <T v="small">{detail}</T>}
      </View>
      <RNSwitch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: C.line, true: C.orange }}
        thumbColor={C.ink}
        ios_backgroundColor={C.line}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

export function Chip({ label, hot = false }: { label: string; hot?: boolean }) {
  return (
    <View style={[s.chip, hot && { borderColor: C.orange }]}>
      <Text style={[s.chipText, hot && { color: C.orange }]} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
  );
}

export function Message({ error, done }: { error?: string | null; done?: string | null }) {
  if (error) return <T v="err" style={{ marginTop: 12 }} accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</T>;
  if (done) return <T v="ok" style={{ marginTop: 12 }} accessibilityLiveRegion="polite">{done}</T>;
  return null;
}

export const s = StyleSheet.create({
  base: { color: C.ink, fontFamily: F.regular, fontSize: 15, lineHeight: 22 },
  body: {},
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  small: { color: C.muted, fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily: F.mono, fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: "uppercase", color: C.muted },
  h1: { fontFamily: F.display, fontSize: 40, lineHeight: 40, textTransform: "uppercase", letterSpacing: -0.4 },
  title: { fontFamily: F.display, fontSize: 34, lineHeight: 36, textTransform: "uppercase" },
  h2: { fontFamily: F.heading, fontSize: 22, lineHeight: 26, textTransform: "uppercase" },
  num: { fontFamily: F.monoBold },
  label: { fontFamily: F.semibold },
  err: { color: C.warn, fontSize: 14, lineHeight: 20 },
  ok: { color: C.ink, fontSize: 14, lineHeight: 20 },

  screen: { flex: 1, backgroundColor: C.bg },
  brandBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  wordmark: { fontFamily: F.display, fontSize: 22, lineHeight: 24, textTransform: "uppercase", letterSpacing: -0.2 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 16, paddingBottom: 48, width: "100%", maxWidth: 560, alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, minHeight: 240 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 48, paddingHorizontal: 12 },

  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 18, marginTop: 22 },
  panelHead: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  banner: { marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: C.soft, borderWidth: 1, borderColor: "#4a2414" },

  btn: { borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22, alignItems: "center", justifyContent: "center", minHeight: 48 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 38 },
  btn_orange: { backgroundColor: C.orange },
  btn_white: { backgroundColor: C.ink },
  btn_ghost: { borderWidth: 1, borderColor: C.line },
  btnText: { fontFamily: F.bold, fontSize: 16 },
  btnText_orange: { color: C.onOrange },
  btnText_white: { color: C.bg },
  btnText_ghost: { color: C.ink },
  link: { paddingVertical: 4 },
  linkText: { fontFamily: F.regular, fontSize: 14, color: C.muted, textDecorationLine: "underline" },

  input: { borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.bg, color: C.ink, fontFamily: F.regular, fontSize: 16, paddingHorizontal: 12, paddingVertical: 11 },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 14, marginTop: 14, borderRadius: 10, backgroundColor: C.soft },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, alignSelf: "flex-end" },
  chipText: { fontFamily: F.mono, fontSize: 11, color: C.muted },
});
