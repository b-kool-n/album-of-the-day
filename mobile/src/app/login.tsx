import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WEB_URL, supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import { Button, Field, Message, T } from "@/components/ui";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function switchTo(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  async function submit() {
    setError(null);
    setInfo(null);
    const e = email.trim();
    if (!e) return setError("Enter your email.");

    if (mode === "signin") {
      if (!password) return setError("Enter your email and password.");
      setBusy(true);
      const { error: err } = await supabase.auth.signInWithPassword({ email: e, password });
      setBusy(false);
      if (err) {
        if (/confirm/i.test(err.message)) return setError("Confirm your email first. Check your inbox for the link we sent.");
        return setError("That email and password don't match. Try again.");
      }
      return;
    }

    const n = name.trim().slice(0, 40);
    if (!n) return setError("Add a name so friends know whose scores are whose.");
    if (password.length < 8) return setError("Use a password of at least 8 characters.");
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: e,
      password,
      // The email link confirms the account, then opens a page on the website saying to come back to the app.
      options: { data: { full_name: n }, emailRedirectTo: `${WEB_URL}/login?confirmed=1` },
    });
    setBusy(false);
    if (err) {
      if (/registered|exists/i.test(err.message)) return setError("There's already an account with that email. Sign in instead.");
      return setError(err.message);
    }
    if (!data.session) {
      setMode("signin");
      setInfo("Account created. Check your email and tap the link to confirm it, then come back here and sign in.");
    }
  }

  const title = mode === "signin" ? "Sign in" : "Make an account";

  return (
    <SafeAreaView style={st.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.inner} keyboardShouldPersistTaps="handled">
          <View style={st.brand}>
            <Logo size={64} />
            <T v="title" style={{ fontSize: 30, lineHeight: 32 }}>Album of the Day</T>
            <T v="muted">One album a day. Listen start to finish, score it, compare with everyone else.</T>
          </View>

          <T v="h2" accessibilityRole="header" style={{ marginTop: 28 }}>{title}</T>
          {mode === "signup" && (
            <Field label="Your name" value={name} onChangeText={setName} max={40} autoComplete="name" textContentType="name" hint="Shown next to your scores, notes and comments." />
          )}
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            textContentType={mode === "signup" ? "newPassword" : "password"}
            hint={mode === "signup" ? "At least 8 characters." : undefined}
            onSubmitEditing={submit}
          />
          <Button
            style={{ marginTop: 20 }}
            label={busy ? "One moment…" : mode === "signin" ? "Sign in" : "Make my account"}
            onPress={submit}
            busy={busy}
          />
          <Message error={error} done={info} />

          <View style={st.switches}>
            {mode !== "signin" && <Button kind="link" label="I already have an account" onPress={() => switchTo("signin")} />}
            {mode !== "signup" && <Button kind="link" label="Make an account" onPress={() => switchTo("signup")} />}
          </View>

          <Button kind="link" style={{ marginTop: 28, alignSelf: "center" }} label="Privacy policy" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  inner: { padding: 20, paddingBottom: 48, width: "100%", maxWidth: 480, alignSelf: "center" },
  brand: { gap: 12, marginTop: 24 },
  switches: { marginTop: 18, gap: 10, alignItems: "flex-start" },
});
