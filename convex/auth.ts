import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Convex Auth (DECISIONS.md E-5): Password provider for email/password.
// Email verification is OFF by default (owner default #4): `verify`/`reset`
// stay unset until an email adapter is configured (RESEND_API_KEY) — the
// flow never fakes email delivery (Spec §54). Passwords are Scrypt-hashed
// by the provider.
//
// `profile` returns the users-table doc fields at sign-up. The app-domain
// profile row (handle, preferences, counters) is created idempotently by
// `users.ensure` (convex/users.ts) on first authenticated load — not here.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      validatePasswordRequirements(password: string) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
      },
    }),
  ],
});
