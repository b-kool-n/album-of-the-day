import { router } from "expo-router";
import { View } from "react-native";
import { Button, Empty, Panel, Screen, T } from "./ui";

export function goToSignUp() {
  router.push({ pathname: "/login", params: { mode: "signup" } });
}
export function goToSignIn() {
  router.push({ pathname: "/login", params: { mode: "signin" } });
}

// In place of something that needs an account, such as scoring or comments.
export function JoinPrompt({ title, body }: { title: string; body: string }) {
  return (
    <Panel title={title}>
      <T v="muted" style={{ marginTop: 8 }}>{body}</T>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <Button small label="Make an account" onPress={goToSignUp} />
        <Button kind="link" label="Sign in" onPress={goToSignIn} />
      </View>
    </Panel>
  );
}

// A whole tab that needs an account: Your scores, Suggest and Account.
export function JoinScreen({ title, body }: { title: string; body: string }) {
  return (
    <Screen>
      <Empty
        title={title}
        action={
          <View style={{ gap: 12, alignItems: "center", marginTop: 8 }}>
            <Button label="Make an account" onPress={goToSignUp} />
            <Button kind="link" label="I already have an account" onPress={goToSignIn} />
          </View>
        }
      >
        {body}
      </Empty>
    </Screen>
  );
}
