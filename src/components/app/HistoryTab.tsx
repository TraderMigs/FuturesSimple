"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TradeRow = {
  id: string;
  created_at: string;
  symbol: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  status: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  win: "border-green-400/40",
  lose: "border-red-400/40",
  breakeven: "border-white/30",
  stoploss: "border-orange-400/40",
  didnttake: "border-purple-400/40",
  pending: "border-white/10",
};

export function HistoryTab() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data } = await supabase
      .from("trades")
      .select("id,created_at,symbol,entry_price,stop_loss,tp1,tp2,tp3,status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    setRows((data as any) || []);
    setBusy(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: string) {
    if (status === "didnttake") {
      const ok = window.confirm("Are you sure you didn't take this trade?");
      if (!ok) return;
      await supabase.from("trades").delete().eq("id", id);
      setRows(prev => prev.filter(r => r.id !== id));
      return;
    }

    await supabase.from("trades").update({ status }).eq("id", id);
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  }

  function downloadCSV() {
    const header = ["created_at", "symbol", "entry", "stop", "tp1", "tp2", "tp3", "status"];
    const lines = [header.join(",")];

    for (const r of rows) {
      lines.push([
        r.created_at,
        r.symbol ?? "",
        r.entry_price ?? "",
        r.stop_loss ?? "",
        r.tp1 ?? "",
        r.tp2 ?? "",
        r.tp3 ?? "",
        r.status ?? "pending",
      ].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "futuressimple-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("FuturesSimple - History Export", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Date", "Symbol", "Entry", "SL", "TP1", "TP2", "TP3", "Status"]],
      body: rows.map(r => [
        new Date(r.created_at).toLocaleString(),
        r.symbol ?? "",
        r.entry_price ?? "",
        r.stop_loss ?? "",
        r.tp1 ?? "",
        r.tp2 ?? "",
        r.tp3 ?? "",
        r.status ?? "pending",
      ]),
      styles: { fontSize: 8 },
    });

    doc.save("futuressimple-history.pdf");
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">History</div>
            <div className="text-xs text-white/60">
              Anything you copy in the calculator is saved here automatically.
            </div>
          </div>

          <div className="flex gap-2">
            <Button small variant="ghost" onClick={downloadCSV} disabled={!rows.length}>Download CSV</Button>
            <Button small variant="ghost" onClick={downloadPDF} disabled={!rows.length}>Download PDF</Button>
            <Button small variant="ghost" onClick={load}>{busy ? "Refreshing..." : "Refresh"}</Button>
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-4">
          <div className="text-xs text-white/60">No history yet. Copy an Entry/SL/TP in the Futures tab.</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {rows.map(r => {
          const s = (r.status || "pending").toLowerCase();
          const border = STATUS_STYLES[s] || STATUS_STYLES.pending;

          return (
            <Card key={r.id} className={`p-4 border ${border}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm">{r.symbol || "—"}</div>
                  <div className="text-[10px] text-white/60">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
                  {(r.status || "pending").toUpperCase()}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70 md:grid-cols-5">
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/50 text-[10px]">Entry</div>
                  <div>{r.entry_price ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/50 text-[10px]">SL</div>
                  <div>{r.stop_loss ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/50 text-[10px]">TP1</div>
                  <div>{r.tp1 ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/50 text-[10px]">TP2</div>
                  <div>{r.tp2 ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/50 text-[10px]">TP3</div>
                  <div>{r.tp3 ?? "—"}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button small variant="ghost" onClick={() => setStatus(r.id, "win")}>Win</Button>
                <Button small variant="ghost" onClick={() => setStatus(r.id, "lose")}>Lose</Button>
                <Button small variant="ghost" onClick={() => setStatus(r.id, "breakeven")}>Break Even</Button>
                <Button small variant="ghost" onClick={() => setStatus(r.id, "stoploss")}>Stop-loss</Button>
                <Button small variant="danger" onClick={() => setStatus(r.id, "didnttake")}>Didn't Take</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
