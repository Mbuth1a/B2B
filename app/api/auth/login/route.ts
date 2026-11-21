import {
  getSupabaseConfig,
  readCurrentSupabaseUser,
  readProviderJson,
  requestIsSameOrigin,
  setSessionCookies,
  toLinklyUser,
} from "@/app/lib/supabase-auth";

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const config = getSupabaseConfig();
  if (!config) {
    return Response.json({ error: "Secure authentication is not configured on the server." }, { status: 503 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid sign-in request." }, { status: 400 });
  }
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    return Response.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "The authentication service is unavailable. Try again shortly." }, { status: 502 });
  }
  const tokenBody = await readProviderJson(tokenResponse);
  if (!tokenResponse.ok) {
    const message = typeof tokenBody.msg === "string" ? tokenBody.msg
      : typeof tokenBody.message === "string" ? tokenBody.message
        : "Email or password is incorrect.";
    return Response.json({ error: message }, { status: tokenResponse.status });
  }
  const accessToken = typeof tokenBody.access_token === "string" ? tokenBody.access_token : "";
  const refreshToken = typeof tokenBody.refresh_token === "string" ? tokenBody.refresh_token : "";
  if (!accessToken || !refreshToken) {
    return Response.json({ error: "The authentication provider did not return a valid session." }, { status: 502 });
  }

  let user;
  try {
    user = await readCurrentSupabaseUser(config, accessToken);
  } catch {
    return Response.json({ error: "Unable to verify the authenticated account." }, { status: 502 });
  }
  const linklyUser = user ? toLinklyUser(config, user) : null;
  if (!linklyUser) {
    return Response.json({ error: "This account has no permitted marketplace role. Contact the administrator." }, { status: 403 });
  }

  await setSessionCookies({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: typeof tokenBody.expires_in === "number" ? tokenBody.expires_in : undefined,
  });
  return Response.json({ user: linklyUser });
}
