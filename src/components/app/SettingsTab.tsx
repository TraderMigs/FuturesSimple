"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = { role: string };

export function SettingsTab({ role }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function deleteAccount() {
    alert("Account deletion will be wired in Admin phase (needs server key).");
  }

  async function resetPassword() {
    setBusy(true);
    setMsg(null);
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) {
      setMsg("No user email found.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) setMsg(error.message);
    else setMsg("Password reset email sent.");
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-sm font-semibold">Settings</div>
        <div className="mt-1 text-xs text-white/60">
          Account actions + (later) tier management.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button small variant="ghost" onClick={resetPassword} disabled={busy}>
            {busy ? "Working..." : "Reset Password"}
          </Button>
          <Button small variant="danger" onClick={deleteAccount}>Delete Account</Button>
        </div>

        {msg ? <div className="mt-3 text-xs text-white/60">{msg}</div> : null}
      </Card>

      {role === "admin" ? (
        <Card className="p-4">
          <div className="text-sm font-semibold">Admin</div>
          <div className="mt-1 text-xs text-white/60">
            Admin dashboard (promote users + bypass timers) is next phase.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
