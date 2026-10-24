import "server-only";

export type Providers = { apple: boolean; google: boolean };

// Which "Continue with…" buttons to show. Read from Supabase's public settings, so a button
// appears as soon as that sign-in is switched on in Supabase, with no code change.
export async function enabledProviders(): Promise<Providers> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { apple: false, google: false };
    const json = (await res.json()) as { external?: Record<string, boolean> };
    // Apple on the website needs extra Apple set-up (a Services ID and key) beyond what the iPhone
    // app needs, so it stays hidden here until WEB_APPLE_SIGNIN=1 is set in Vercel.
    return { apple: !!json.external?.apple && process.env.WEB_APPLE_SIGNIN === "1", google: !!json.external?.google };
  } catch {
    return { apple: false, google: false };
  }
}
