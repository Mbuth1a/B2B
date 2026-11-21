import { cookies } from "next/headers";
import {
  accessCookieName,
  clearSessionCookies,
  getSupabaseConfig,
  requestIsSameOrigin,
} from "@/app/lib/supabase-auth";

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const config = getSupabaseConfig();
  const accessToken = (await cookies()).get(accessCookieName)?.value;
  await clearSessionCookies();
  if (!config || !accessToken) return Response.json({ ok: true });

  try {
    const response = await fetch(`${config.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return Response.json({ error: "Signed out locally, but the provider could not revoke the session." }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Signed out locally, but the provider is unavailable to revoke the session." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
