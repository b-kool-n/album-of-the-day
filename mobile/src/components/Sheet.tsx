import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/lib/theme";

// A message that slides up from the bottom and never covers more than about half the screen.
// Tapping outside closes it, unless it has no onClose (the terms, which need an answer).
export function Sheet({ children, onClose, label }: { children: ReactNode; onClose?: () => void; label: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={() => onClose?.()}>
      <View style={st.wrap}>
        <Pressable style={st.dim} onPress={onClose} disabled={!onClose} accessibilityLabel="Close" accessible={!!onClose} />
        <View style={[st.sheet, { paddingBottom: insets.bottom + 20 }]} accessibilityViewIsModal accessibilityLabel={label}>
          <View style={st.handle} />
          <ScrollView bounces={false} contentContainerStyle={{ paddingTop: 6 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end" },
  dim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    maxHeight: "55%",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: C.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.orange,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 8 },
});
