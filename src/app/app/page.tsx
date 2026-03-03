"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FuturesTab } from "@/components/app/FuturesTab";
import { HistoryTab } from "@/components/app/HistoryTab";
import { SettingsTab } from "@/components/app/SettingsTab";

type TabKey = "futures" | "history" | "settings";

export default function AppHome() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<TabKey>("futures");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("user");
  const [tier, setTier] = useState<string>("free");
  const [eliteExpiresAt, setEliteExpiresAt] = useState<string | null>(null);
  const [lifetime, setLifetime] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,email")
        .eq("id", user.id)
        .single();

      if (profile?.role) setRole(profile.role);

      const { data: ent } = await supabase
        .from("entitlements")
        .select("tier,elite_expires_at,is_lifetime")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ent?.tier) setTier(ent.tier);
      setEliteExpiresAt(ent?.elite_expires_at ?? null);
      setLifetime(!!ent?.is_lifetime);
    })();
  }, [supabase]);

  const isElite = tier === "elite" && (lifetime || !eliteExpiresAt || new Date(eliteExpiresAt) > new Date());

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 md:px-6 md:py-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold tracking-wide">FuturesSimple</div>
          <div className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
            {isElite ? "Elite" : "Free"} • {role === "admin" ? "Admin" : "User"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-xs text-white/60 md:block">{email}</div>
          <Button variant="ghost" small onClick={signOut}>Log Out</Button>
        </div>
      </header>

      <Card className="mb-4 p-2">
        <div className="flex gap-2">
          <Button small variant={tab === "futures" ? "primary" : "ghost"} onClick={() => setTab("futures")}>Futures</Button>
          <Button small variant={tab === "history" ? "primary" : "ghost"} onClick={() => setTab("history")}>History</Button>
          <Button small variant={tab === "settings" ? "primary" : "ghost"} onClick={() => setTab("settings")}>Settings</Button>
        </div>
      </Card>

      {tab === "futures" ? <FuturesTab tier={isElite ? "elite" : "free"} /> : null}
      {tab === "history" ? <HistoryTab /> : null}
      {tab === "settings" ? <SettingsTab role={role} /> : null}
    </main>
  );
}
