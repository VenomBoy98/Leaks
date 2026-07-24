// auth-adapter.ts — the seam for real authentication. The app talks to this interface;
// today it is fulfilled by the dev issuer (behind DEV_AUTH), and a real email-OTP / provider
// (Supabase Auth, Clerk, custom OTP) implements the same interface in production WITHOUT
// changing any page. No insecure production login is created here.
export interface Session {
  role: "applicant" | "student" | "staff" | "admin";
  // Identity is derived server-side from the session cookie; the browser holds no token.
}

export interface AuthAdapter {
  /** Begin sign-in (e.g. send an OTP to an email/phone). Returns a challenge id. */
  begin?(identifier: string): Promise<{ challengeId: string }>;
  /** Complete sign-in (e.g. verify OTP) → establishes the httpOnly session cookie. */
  complete(input: { role?: string; challengeId?: string; otp?: string }): Promise<Session>;
  /** Clear the session. */
  signOut(): Promise<void>;
}

// Dev adapter — used only when DEV_AUTH is enabled. Maps a chosen role to a seeded user.
export const devAuthAdapter: AuthAdapter = {
  async complete({ role }) {
    const res = await fetch("/api/dev-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: role ?? "applicant" }),
    });
    if (!res.ok) throw new Error("sign-in failed");
    const j = (await res.json()) as { role: Session["role"] };
    return { role: j.role };
  },
  async signOut() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
  },
};
