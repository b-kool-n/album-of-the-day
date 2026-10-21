import { useSession } from "@/lib/session";
import { AppTabs } from "@/components/AppTabs";
import { Tour } from "@/components/Tour";

export default function TabsLayout() {
  const { profile } = useSession();
  return (
    <>
      <AppTabs />
      {profile && !profile.tour_seen && <Tour />}
    </>
  );
}
