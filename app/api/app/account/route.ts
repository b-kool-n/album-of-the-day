import { revalidatePath } from "next/cache";
import { unauthorised, viewerFromRequest } from "@/lib/supabase/bearer";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";

// Phone app: delete the signed-in person's account and everything attached to it.
// Body: { confirm: true }
export async function DELETE(request: Request) {
  const viewer = await viewerFromRequest(request);
  if (!viewer) return unauthorised();
  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown };
  if (body.confirm !== true) return Response.json({ error: "Tick the box to confirm." }, { status: 400 });
  if (!hasAdminKey()) return Response.json({ error: "Account deletion isn't switched on yet. Ask the curator, or try again later." }, { status: 503 });

  const { error } = await createAdminClient().auth.admin.deleteUser(viewer.userId);
  if (error) return Response.json({ error: "Couldn't delete your account. Try again." }, { status: 500 });
  revalidatePath("/", "layout");
  return Response.json({ done: true });
}
