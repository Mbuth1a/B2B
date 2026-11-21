import { cookies } from "next/headers";
import {
  accessCookieName,
  getSupabaseConfig,
  readCurrentSupabaseUser,
  readProviderJson,
  requestIsSameOrigin,
  toLinklyUser,
} from "@/app/lib/supabase-auth";

export async function PATCH(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const config = getSupabaseConfig();
  if (!config) {
    return Response.json({ error: "Secure authentication is not configured on the server." }, { status: 503 });
  }
  const accessToken = (await cookies()).get(accessCookieName)?.value;
  if (!accessToken) return Response.json({ error: "Sign in to update your profile." }, { status: 401 });

  let input: Record<string, unknown>;
  try {
    input = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid profile update." }, { status: 400 });
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid name and email address." }, { status: 400 });
  }

  try {
    const currentUser = await readCurrentSupabaseUser(config, accessToken);
    if (!currentUser) return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
    const currentLinklyUser = toLinklyUser(config, currentUser);
    if (!currentLinklyUser) return Response.json({ error: "This account has no permitted marketplace role." }, { status: 403 });
    if (currentLinklyUser.role === "admin" && email !== currentLinklyUser.email) {
      return Response.json({ error: "The administrator sign-in email is managed by the deployment configuration." }, { status: 403 });
    }
    const metadata = currentUser.user_metadata ?? {};
    const response = await fetch(`${config.url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        data: { ...metadata, name },
      }),
      cache: "no-store",
    });
    const body = await readProviderJson(response);
    if (!response.ok) {
      const message = typeof body.msg === "string" ? body.msg
        : typeof body.message === "string" ? body.message
          : "Unable to update your profile.";
      return Response.json({ error: message }, { status: response.status });
    }

    const updatedUser = body.user as typeof currentUser | undefined;
    const linklyUser = updatedUser ? toLinklyUser(config, updatedUser) : null;
    if (!linklyUser) {
      return Response.json({ error: "The authentication provider returned an invalid profile." }, { status: 502 });
    }
    return Response.json({
      user: linklyUser,
      emailChangePending: linklyUser.email !== email,
    });
  } catch {
    return Response.json({ error: "Unable to reach the authentication service." }, { status: 502 });
  }
}
