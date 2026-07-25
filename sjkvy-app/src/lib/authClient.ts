"use client";
// authClient.ts — browser wrappers over the /api/auth/* BFF routes. Cookies are httpOnly and set
// by the server; these helpers only carry JSON. Errors surface the API's generic messages.
export interface AuthError { code: string; message: string }
export interface Challenge { challengeId: string; resendAvailableAt?: string; expiresAt?: string }
export interface VerifiedSession { roles: string[]; home: string }

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${path}`, {
    method: "POST", credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error((data as AuthError).message || "Request failed"), { code: (data as AuthError).code, status: res.status });
  return data as T;
}

export const authClient = {
  register: (b: { name: string; email: string; password: string; confirmPassword: string }) => call<Challenge>("register", b),
  verifyRegistration: (b: { challengeId: string; otp: string }) => call<VerifiedSession>("register/verify", b),
  login: (b: { email: string; password: string }) => call<Challenge>("login", b),
  verifyLogin: (b: { challengeId: string; otp: string }) => call<VerifiedSession>("login/verify", b),
  resend: (challengeId: string) => call<Challenge>("otp/resend", { challengeId }),
  forgot: (email: string) => call<Challenge & { ok: boolean }>("password/forgot", { email }),
  reset: (b: { challengeId: string; otp: string; newPassword: string; confirmPassword: string }) => call<{ ok: boolean }>("password/reset", b),
  logout: () => call<{ ok: boolean }>("logout", {}),
};
