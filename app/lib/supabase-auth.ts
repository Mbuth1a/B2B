import { cookies } from "next/headers";

export type AccountRole = "buyer" | "seller" | "admin";

export type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type LinklyUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  interests?: string[];
  role: AccountRole;
};

export type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  adminEmail: string;
};

export const accessCookieName = "linkly_access_token";
export const refreshCookieName = "linkly_refresh_token";

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.LINKLY_ADMIN_EMAIL?.trim().toLowerCase();
  if (!url || !anonKey || !serviceRoleKey || !adminEmail) return null;
  return { url, anonKey, serviceRoleKey, adminEmail };
}

export function requestIsSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function readProviderJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) as unknown : {};
  } catch {
    body = { message: text || `Authentication provider returned HTTP ${response.status}.` };
  }
  return body && typeof body === "object" ? body as Record<string, unknown> : {};
}

export async function readCurrentSupabaseUser(
  config: SupabaseConfig,
  accessToken: string
): Promise<SupabaseUser | null> {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return await response.json() as SupabaseUser;
}

export function toLinklyUser(config: SupabaseConfig, user: SupabaseUser): LinklyUser | null {
  const email = user.email?.trim().toLowerCase();
  const appRole = user.app_metadata?.role;
  const role: AccountRole | null = appRole === "admin" && email === config.adminEmail
    ? "admin"
    : appRole === "buyer" || appRole === "seller"
      ? appRole
      : null;
  if (!email || !role) return null;
  const metadata = user.user_metadata ?? {};
  const interests = Array.isArray(metadata.interests)
    ? metadata.interests.filter((item): item is string => typeof item === "string")
    : undefined;
  return {
    id: user.id,
    name: typeof metadata.name === "string" ? metadata.name : email,
    email,
    phone: typeof metadata.phone === "string" ? metadata.phone : undefined,
    country: typeof metadata.country === "string" ? metadata.country : undefined,
    interests,
    role,
  };
}

export async function setSessionCookies(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}): Promise<void> {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  jar.set(accessCookieName, tokens.access_token, {
    ...baseOptions,
    maxAge: Math.max(60, tokens.expires_in ?? 3600),
  });
  jar.set(refreshCookieName, tokens.refresh_token, {
    ...baseOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(accessCookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
  jar.set(refreshCookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
}
