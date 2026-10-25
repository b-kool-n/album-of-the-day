import { useSession } from "@/lib/session";
import { AppTabs } from "@/components/AppTabs";
import { TermsPrompt } from "@/components/TermsPrompt";
import { Tour } from "@/components/Tour";

export default function TabsLayout() {
  const { profile } = useSession();
  return (
    <>
      <AppTabs />
      {/* People who joined before the terms existed, or through Apple or Google, agree once. */}
      {profile && !profile.terms_accepted_at ? <TermsPrompt /> : profile && !profile.tour_seen && <Tour />}
    </>
  );
}
