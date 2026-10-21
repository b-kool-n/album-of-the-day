import { revalidatePath } from "next/cache";
import { unauthorised, viewerFromRequest } from "@/lib/supabase/bearer";
import { submitSuggestion } from "@/lib/suggest";

// Phone app: suggest an album from a Spotify link. Body: { link, reason? }
export async function POST(request: Request) {
  const viewer = await viewerFromRequest(request);
  if (!viewer) return unauthorised();
  const body = (await request.json().catch(() => ({}))) as { link?: unknown; reason?: unknown };
  const result = await submitSuggestion(viewer.supabase, viewer.userId, String(body.link ?? ""), String(body.reason ?? ""));
  if ("error" in result) return Response.json(result, { status: 400 });
  revalidatePath("/", "layout");
  return Response.json(result);
}
