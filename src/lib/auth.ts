import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AppRole = "USER" | "BUSINESS" | "ADMIN";

export type AppSession = {
  userId: string;
  name: string;
  email: string;
  role: AppRole;
};

export const SESSION_COOKIE = "petly_session";

const demoUsers: Record<string, AppSession & { password: string }> = {
  admin: {
    userId: "demo-admin",
    name: "Admin Petly",
    email: "admin@petly.local",
    role: "ADMIN",
    password: "admin123",
  },
  empresa: {
    userId: "demo-business",
    name: "VetCare CR",
    email: "empresa@petly.local",
    role: "BUSINESS",
    password: "empresa123",
  },
  usuario: {
    userId: "demo-user",
    name: "Usuario Petly",
    email: "usuario@petly.local",
    role: "USER",
    password: "usuario123",
  },
};

function getSecret() {
  return process.env.AUTH_SECRET ?? "petly_preview_demo_secret_replace_in_production";
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(session: AppSession) {
  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): AppSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    return JSON.parse(fromBase64Url(payload)) as AppSession;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireRole(role: AppRole, next = "/admin") {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (session.role !== role) {
    redirect(`/login?error=unauthorized&next=${encodeURIComponent(next)}`);
  }

  return session;
}

export function authenticateDemoUser(username: string, password: string) {
  const user = demoUsers[username.toLowerCase()];

  if (!user || user.password !== password) {
    return null;
  }

  const { password: _password, ...session } = user;
  return session;
}
