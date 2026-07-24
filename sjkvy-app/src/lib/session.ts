// session.ts — SERVER-ONLY. Dev sign-in issuer: maps an app-role to a seeded backend
// profile and mints the HS256 JWT the existing sjkvy-api already validates. This is the
// documented dev token-issuer (README) — in production it is replaced by the real identity
// provider (Supabase Auth / Clerk). The secret matches the API's JWT_SECRET.
import "server-only";
import { SignJWT } from "jose";

export const ROLES = ["applicant", "student", "staff", "admin"] as const;
export type AppRole = (typeof ROLES)[number];

// app-role → a seeded profile that actually holds that relationship in the DB.
const ROLE_PROFILE: Record<AppRole, string> = {
  applicant: "a0000000-0000-0000-0000-00000000000a", // Applicant A (has an application)
  student: "a0000000-0000-0000-0000-00000000000b", // Applicant B (enrolled student)
  staff: "50000000-0000-0000-0000-0000000000a1", // Operator One (centre membership)
  admin: "50000000-0000-0000-0000-0000000000a4", // CAD One (centre admin)
};

const secret = () => new TextEncoder().encode(process.env.DEV_JWT_SECRET ?? "");

export function isRole(v: string): v is AppRole {
  return (ROLES as readonly string[]).includes(v);
}

export async function mintToken(role: AppRole): Promise<string> {
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ROLE_PROFILE[role])
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}
