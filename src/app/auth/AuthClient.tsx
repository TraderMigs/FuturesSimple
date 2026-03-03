/* =========================
   File #2: src/app/auth/AuthClient.tsx
   ========================= */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AuthClient() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = (params.get("mode") || "login") as "login" | "signup";
  const nextPath = params.get("next") || "/app";

  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setMsg(null);
  }, [mode]);

  async function onSubmit() {
    setBusy(true);
    setMsg(null);
    try {
      if (!email || !password) {
        setMsg("Email and password required.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${nextPath}` },
        });
        if (error) throw error;
        setMsg("Check your email to confirm signup (then come back and log in).");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath);
      }
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#05070b] to-black px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-xs text-white/70 hover:text-white">
            ← Back
          </Link>
          <div className="text-xs text-white/60">FuturesSimple</div>
        </div>

        <Card className="p-5">
          <div className="text-lg font-semibold">{mode === "signup" ? "Create account" : "Log in"}</div>
          <div className="mt-1 text-xs text-white/60">
            Dark, mobile-first futures setups + calculator.
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 text-xs text-white/60">Email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>

            <div>
              <div className="mb-1 text-xs text-white/60">Password</div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </div>

            {msg ? <div className="text-xs text-white/70">{msg}</div> : null}

            <Button onClick={onSubmit} disabled={busy}>
              {busy ? "Working..." : mode === "signup" ? "Sign Up" : "Log In"}
            </Button>

            <div className="text-xs text-white/60">
              {mode === "signup" ? (
                <Link href="/auth" className="underline">
                  Already have an account? Log in
                </Link>
              ) : (
                <Link href="/auth?mode=signup" className="underline">
                  No account? Sign up
                </Link>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-4 text-[10px] leading-relaxed text-white/40">
          Futures trading is high risk. This app is educational and informational only.
        </div>
      </div>
    </main>
  );
}
