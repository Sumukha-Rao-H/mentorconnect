import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/db/schema";

// Kept free of `server-only` / next/headers so proxy.ts can import it too.
export const SESSION_COOKIE = "mm_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: number;
  role: Role;
  name: string;
  expiresAt: string;
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
