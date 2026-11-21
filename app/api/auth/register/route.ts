import {
  getSupabaseConfig,
  readProviderJson,
  requestIsSameOrigin,
  setSessionCookies,
  toLinklyUser,
  type SupabaseUser,
} from "@/app/lib/supabase-auth";

const sellerCommodities = new Set(["Gold", "Silver", "Timber Logs"]);
const buyerCommodities = new Set(["Gold", "Silver", "Timber Logs", "Precious Metals"]);

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
    return Response.json({ error: "Invalid registration request." }, { status: 400 });
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const country = typeof input.country === "string" ? input.country.trim() : "";
  const role = input.role;
  const category = typeof input.category === "string" ? input.category : "";
  const interests = Array.isArray(input.interests)
    ? input.interests.filter((item): item is string => typeof item === "string")
    : [];

  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || !phone || !country || country.length > 100) {
    return Response.json({ error: "Enter a valid name, email, phone, country, and password of at least 8 characters." }, { status: 400 });
  }
  if (role !== "buyer" && role !== "seller") {
    return Response.json({ error: "Choose a buyer or seller account." }, { status: 400 });
  }
  if (email === config.adminEmail) {
    return Response.json({ error: "This email is reserved for the marketplace administrator." }, { status: 400 });
  }
  if (role === "seller" && !sellerCommodities.has(category)) {
    return Response.json({ error: "Seller accounts may offer Gold, Silver, or Timber Logs." }, { status: 400 });
  }
  if (role === "buyer" && (!interests.length || interests.some((item) => !buyerCommodities.has(item)))) {
    return Response.json({ error: "Select at least one valid buyer commodity interest." }, { status: 400 });
  }

  let signupResponse: Response;
  try {
    const redirectTo = new URL("/", new URL(request.url).origin).toString();
    signupResponse = await fetch(
      `${config.url}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          data: { name, phone, country, category: role === "seller" ? category : undefined, interests, account_type: role },
        }),
        cache: "no-store",
      }
    );
  } catch {
    return Response.json({ error: "The authentication service is unavailable. Try again shortly." }, { status: 502 });
  }
  const signupBody = await readProviderJson(signupResponse);
  if (!signupResponse.ok) {
    const message = typeof signupBody.msg === "string" ? signupBody.msg
      : typeof signupBody.message === "string" ? signupBody.message
        : "Unable to create the account.";
    return Response.json({ error: message }, { status: signupResponse.status });
  }

  const supabaseUser = signupBody.user as SupabaseUser | undefined;
  if (!supabaseUser?.id) {
    return Response.json({ error: "The authentication provider did not return a user identity." }, { status: 502 });
  }

  let roleResponse: Response;
  try {
    roleResponse = await fetch(`${config.url}/auth/v1/admin/users/${encodeURIComponent(supabaseUser.id)}`, {
      method: "PUT",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app_metadata: { role } }),
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "Account created, but role setup failed. Contact support before signing in." }, { status: 502 });
  }
  if (!roleResponse.ok) {
    return Response.json({ error: "Account created, but secure role setup failed. Contact support before signing in." }, { status: 502 });
  }

  const tokens = signupBody as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (tokens.access_token && tokens.refresh_token) {
    await setSessionCookies({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    });
  }

  const user = toLinklyUser(config, {
    ...supabaseUser,
    email,
    app_metadata: { ...supabaseUser.app_metadata, role },
    user_metadata: { ...supabaseUser.user_metadata, name, phone, country, interests },
  });
  if (!user) {
    return Response.json({ error: "The authentication provider returned an invalid account." }, { status: 502 });
  }
  return Response.json({ user, confirmationRequired: !tokens.access_token });
}
