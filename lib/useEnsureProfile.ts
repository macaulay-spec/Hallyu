import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// After sign-in the users row exists but the app profile may not yet — call
// `users.ensure` once per authenticated session (idempotent mutation).
export function useEnsureProfile(isAuthenticated: boolean) {
  const ensure = useMutation(api.users.ensure);
  const ran = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !ran.current) {
      ran.current = true;
      ensure().catch(() => {
        ran.current = false; // retry on next mount after transient failure
      });
    }
    if (!isAuthenticated) {
      ran.current = false;
    }
  }, [isAuthenticated, ensure]);
}
