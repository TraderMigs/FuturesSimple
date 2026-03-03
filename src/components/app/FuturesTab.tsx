"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type Props = { tier: "free" | "elite" };

type SymbolSpec = {
  symbol: string;
  name: string;
  tickSize: number;
  tickValue: number;
};

const DEFAULT_SPECS: SymbolSpec[] = [
  { symbol: "ES=F", name: "E-mini S&P 500", tickSize: 0.25, tickValue: 12.5 },
  { symbol: "NQ=F", name: "E-mini Nasdaq 100", tickSize: 0.25, tickValue: 5 },
  { symbol: "YM=F", name: "E-mini Dow", tickSize: 1, tickValue: 5 },
  { symbol: "RTY=F", name: "E-mini Russell 2000", tickSize: 0.1, tickValue: 5 },
  { symbol: "CL=F", name: "Crude Oil", tickSize: 0.01, tickValue: 10 },
  { symbol: "GC=F", name: "Gold", tickSize: 0.1, tickValue: 10 },
];

export function FuturesTab({ tier }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [specs] = useState<SymbolSpec[]>(DEFAULT_SPECS);

  const [symbol, setSymbol] = useState(specs[0].symbol);
  const spec = specs.find(s => s.symbol === symbol) || specs[0];

  const [accountSize, setAccountSize] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [contracts, setContracts] = useState("1");

  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [tp1, setTp1] = useState("");
  const [tp2, setTp2] = useState("");
  const [tp3, setTp3] = useState("");

  const [msg, setMsg] = useState<string | null>(null);

  const acct = Number(accountSize || 0);
  const rpct = Number(riskPct || 0);
  const ctr = Number(contracts || 0);

  function ticksBetween(a: number, b: number) {
    if (!spec.tickSize) return 0;
    return Math.round(Math.abs(a - b) / spec.tickSize);
  }

  const nEntry = Number(entry || 0);
  const nStop = Number(stop || 0);
  const nTp1 = Number(tp1 || 0);
  const nTp2 = Number(tp2 || 0);
  const nTp3 = Number(tp3 || 0);

  const riskDollars = (acct * rpct) / 100;
  const ticksToSL = entry && stop ? ticksBetween(nEntry, nStop) : 0;
  const riskPerContract = ticksToSL * spec.tickValue;
  const estRiskTotal = riskPerContract * ctr;

  const ticksToTP1 = entry && tp1 ? ticksBetween(nEntry, nTp1) : 0;
  const ticksToTP2 = entry && tp2 ? ticksBetween(nEntry, nTp2) : 0;
  const ticksToTP3 = entry && tp3 ? ticksBetween(nEntry, nTp3) : 0;

  const estP1 = ticksToTP1 * spec.tickValue * ctr;
  const estP2 = ticksToTP2 * spec.tickValue * ctr;
  const estP3 = ticksToTP3 * spec.tickValue * ctr;

  async function copyAndSave(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMsg(`${label} copied.`);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      // Save a snapshot row (minimal) so History works immediately.
      // This is NOT a fake trade idea; it logs the user-copied plan.
      const payload = {
        user_id: user.id,
        symbol,
        direction: null,
        timeframe: null,
        confidence: null,
        entry_price: entry ? nEntry : null,
        stop_loss: stop ? nStop : null,
        tp1: tp1 ? nTp1 : null,
        tp2: tp2 ? nTp2 : null,
        tp3: tp3 ? nTp3 : null,
        explanation: { source: "calculator_copy", copied: label, value },
        status: "pending",
      };

      await supabase.from("trades").insert(payload);
    } catch {
      setMsg("Copy failed (browser blocked).");
    } finally {
      setTimeout(() => setMsg(null), 1200);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-5">
        <Card className="p-4">
          <div className="text-sm font-semibold">Calculator</div>
          <div className="mt-1 text-xs text-white/60">
            Select symbol, enter your plan, copy fields. Copies get logged into History automatically.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="mb-1 text-xs text-white/60">Futures Symbol</div>
              <select
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              >
                {specs.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                ))}
              </select>
              <div className="mt-1 text-[10px] text-white/45">
                Tick size {spec.tickSize} • Tick value ${spec.tickValue}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-white/60">Account Size ($)</div>
              <Input value={accountSize} onChange={(e) => setAccountSize(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <div className="mb-1 text-xs text-white/60">Risk (%)</div>
              <Input value={riskPct} onChange={(e) => setRiskPct(e.target.value)} inputMode="decimal" />
            </div>
            <div className="col-span-2">
              <div className="mb-1 text-xs text-white/60">Contracts</div>
              <Input value={contracts} onChange={(e) => setContracts(e.target.value)} inputMode="numeric" />
            </div>

            <div>
              <div className="mb-1 text-xs text-white/60">Entry</div>
              <Input value={entry} onChange={(e) => setEntry(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <div className="mb-1 text-xs text-white/60">Stop Loss</div>
              <Input value={stop} onChange={(e) => setStop(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <div className="mb-1 text-xs text-white/60">TP1</div>
              <Input value={tp1} onChange={(e) => setTp1(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <div className="mb-1 text-xs text-white/60">TP2</div>
              <Input value={tp2} onChange={(e) => setTp2(e.target.value)} inputMode="decimal" />
            </div>
            <div className="col-span-2">
              <div className="mb-1 text-xs text-white/60">TP3</div>
              <Input value={tp3} onChange={(e) => setTp3(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <Card className="p-3">
              <div className="text-xs text-white/60">Risk Target ($)</div>
              <div className="text-sm">${isFinite(riskDollars) ? riskDollars.toFixed(2) : "0.00"}</div>
              <div className="mt-1 text-[10px] text-white/45">
                Est. risk at SL: ${isFinite(estRiskTotal) ? estRiskTotal.toFixed(2) : "0.00"} • ticks: {ticksToSL}
              </div>
            </Card>

            <Card className="p-3">
              <div className="text-xs text-white/60">Projected</div>
              <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/60">TP1</div>
                  <div>${isFinite(estP1) ? estP1.toFixed(2) : "0.00"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/60">TP2</div>
                  <div>${isFinite(estP2) ? estP2.toFixed(2) : "0.00"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="text-white/60">TP3</div>
                  <div>${isFinite(estP3) ? estP3.toFixed(2) : "0.00"}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button small variant="ghost" onClick={() => entry && copyAndSave("Entry", entry)} disabled={!entry}>Copy Entry</Button>
            <Button small variant="ghost" onClick={() => stop && copyAndSave("Stop Loss", stop)} disabled={!stop}>Copy SL</Button>
            <Button small variant="ghost" onClick={() => tp1 && copyAndSave("TP1", tp1)} disabled={!tp1}>Copy TP1</Button>
            <Button small variant="ghost" onClick={() => tp2 && copyAndSave("TP2", tp2)} disabled={!tp2}>Copy TP2</Button>
            <Button small variant="ghost" onClick={() => tp3 && copyAndSave("TP3", tp3)} disabled={!tp3}>Copy TP3</Button>
            <Button small variant="ghost" onClick={() => copyAndSave("Symbol", symbol)}>Copy Symbol</Button>
          </div>

          {msg ? <div className="mt-3 text-xs text-white/60">{msg}</div> : null}

          <div className="mt-4 text-[10px] text-white/45">
            Tier: {tier.toUpperCase()} • The AI trade generator is wired next (using your SMC algo zip).
          </div>
        </Card>
      </div>

      <div className="md:col-span-7">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Trade Ideas</div>
              <div className="text-xs text-white/60">
                This panel will show 5 ranked SMC setups. (Next step after we import your SMC logic.)
              </div>
            </div>
            <Button small disabled title="Next phase">Get Trades</Button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
            No AI trades yet. Your calculator is live, and your copied plans already save to History.
          </div>
        </Card>
      </div>
    </div>
  );
}
