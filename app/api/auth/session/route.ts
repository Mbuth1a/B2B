import { cookies } from "next/headers";
import {
  accessCookieName,
  clearSessionCookies,
  getSupabaseConfig,
  readCurrentSupabaseUser,
  readProviderJson,
  refreshCookieName,
  setSessionCookies,
  toLinklyUser,
} from "@/app/lib/supabase-auth";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

async function refreshSession(configUrl: string, anonKey: string, refreshToken: string) {
  const response = await fetch(`${configUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return await readProviderJson(response) as TokenResponse;
}

export async function GET() {
  const config = getSupabaseConfig();
  if (!config) {
    return Response.json({ error: "Secure authentication is not configured on the server." }, { status: 503 });
  }
  const jar = await cookies();
  const accessToken = jar.get(accessCookieName)?.value;
  const refreshToken = jar.get(refreshCookieName)?.value;
  if (!accessToken && !refreshToken) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    let tokens: TokenResponse | null = accessToken ? { access_token: accessToken } : null;
    let user = accessToken ? await readCurrentSupabaseUser(config, accessToken) : null;
    if (!user && refreshToken) {
      tokens = await refreshSession(config.url, config.anonKey, refreshToken);
      if (tokens?.access_token) {
        user = await readCurrentSupabaseUser(config, tokens.access_token);
      }
    }
    const linklyUser = user ? toLinklyUser(config, user) : null;
    if (!linklyUser) {
      await clearSessionCookies();
      return Response.json({ error: "The session is invalid or the account role is not permitted." }, { status: 401 });
    }
    if (tokens?.access_token && tokens.refresh_token) {
      await setSessionCookies(tokens as Required<Pick<TokenResponse, "access_token" | "refresh_token">> & TokenResponse);
    }
    return Response.json({ user: linklyUser }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to verify the current session." }, { status: 502 });
  }
}
