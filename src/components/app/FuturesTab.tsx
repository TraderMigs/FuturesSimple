"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { fetchYahooOHLC } from "@/lib/yahooOhlc";
import { generateTradeIdeas, type TradeIdea } from "@/lib/tradeIdeas";

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

const TIMEFRAMES = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

function formatDir(d: "long" | "short") {
  return d === "long" ? "Long" : "Short";
}

export function FuturesTab({ tier }: Props) {
  const supabase = createClient();

  // Symbol specs (either from DB or fallback)
  const [specs, setSpecs] = useState<SymbolSpec[]>(DEFAULT_SPECS);
  const [symbol, setSymbol] = useState(DEFAULT_SPECS[0].symbol);

  // Trade idea generator
  const [timeframe, setTimeframe] = useState("1h");
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [ideasBusy, setIdeasBusy] = useState(false);
  const [ideasMsg, setIdeasMsg] = useState<string>("");
  const selectedIdea = useMemo(
    () => ideas.find((i) => i.id === selectedIdeaId) || null,
    [ideas, selectedIdeaId]
  );

  // Calculator inputs
  const [account, setAccount] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [contracts, setContracts] = useState("1");

  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [tp1, setTp1] = useState("");
  const [tp2, setTp2] = useState("");
  const [tp3, setTp3] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [copyBusy, setCopyBusy] = useState(false);

  const spec = useMemo(() => specs.find((s) => s.symbol === symbol) || specs[0], [specs, symbol]);
  const tickSize = spec?.tickSize || 0.25;
  const tickValue = spec?.tickValue || 12.5;

  useEffect(() => {
    let alive = true;

    (async () => {
      // Try to load specs from DB (if table exists + not blocked). If not, keep fallback.
      try {
        const { data, error } = await supabase
          .from("symbol_specs")
          .select("symbol,name,tick_size,tick_value")
          .order("symbol", { ascending: true });

        if (!alive) return;

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const mapped: SymbolSpec[] = data.map((r: any) => ({
            symbol: r.symbol,
            name: r.name,
            tickSize: Number(r.tick_size),
            tickValue: Number(r.tick_value),
          }));
          setSpecs(mapped);
          if (!mapped.find((m) => m.symbol === symbol)) setSymbol(mapped[0].symbol);
        }
      } catch {
        // keep fallback
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync calculator when a trade idea is selected
  useEffect(() => {
    if (!selectedIdea) return;
    setEntry(selectedIdea.entry.toFixed(2));
    setStop(selectedIdea.stop.toFixed(2));
    setTp1(selectedIdea.tp1.toFixed(2));
    setTp2(selectedIdea.tp2.toFixed(2));
    setTp3(selectedIdea.tp3.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdeaId]);

  const accountNum = Number(account) || 0;
  const riskNum = Number(riskPct) || 0;
  const contractsNum = Number(contracts) || 0;

  const riskDollars = (accountNum * riskNum) / 100;

  const entryNum = Number(entry);
  const stopNum = Number(stop);

  const ticksToSL = useMemo(() => {
    if (!isFinite(entryNum) || !isFinite(stopNum)) return 0;
    const diff = Math.abs(entryNum - stopNum);
    if (!tickSize) return 0;
    return Math.round(diff / tickSize);
  }, [entryNum, stopNum, tickSize]);

  const riskPerContract = ticksToSL * tickValue;
  const estRiskTotal = riskPerContract * contractsNum;

  const tp1Num = Number(tp1);
  const tp2Num = Number(tp2);
  const tp3Num = Number(tp3);

  const estP1 = useMemo(() => {
    if (!isFinite(entryNum) || !isFinite(tp1Num) || !tickSize) return 0;
    const ticks = Math.round(Math.abs(tp1Num - entryNum) / tickSize);
    return ticks * tickValue * contractsNum;
  }, [contractsNum, entryNum, tickSize, tickValue, tp1Num]);

  const estP2 = useMemo(() => {
    if (!isFinite(entryNum) || !isFinite(tp2Num) || !tickSize) return 0;
    const ticks = Math.round(Math.abs(tp2Num - entryNum) / tickSize);
    return ticks * tickValue * contractsNum;
  }, [contractsNum, entryNum, tickSize, tickValue, tp2Num]);

  const estP3 = useMemo(() => {
    if (!isFinite(entryNum) || !isFinite(tp3Num) || !tickSize) return 0;
    const ticks = Math.round(Math.abs(tp3Num - entryNum) / tickSize);
    return ticks * tickValue * contractsNum;
  }, [contractsNum, entryNum, tickSize, tickValue, tp3Num]);

  async function copyAndSave(label: string, value: string) {
    try {
      setCopyBusy(true);
      await navigator.clipboard.writeText(value);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Save a row for History. This is your current "copy logging" wiring.
        // When you select a trade idea, we also store its metadata in the notes.
        const notes =
          selectedIdea
            ? `Idea: ${selectedIdea.setupName} (${selectedIdea.timeframe} ${formatDir(
                selectedIdea.direction
              )}, ${selectedIdea.confidence}% confidence)`
            : null;

        await supabase.from("trades").insert({
          user_id: user.id,
          symbol,
          contract_qty: contractsNum,
          risk_pct: riskNum,
          entry_price: entryNum || null,
          stop_loss: stopNum || null,
          tp1: tp1Num || null,
          tp2: tp2Num || null,
          tp3: tp3Num || null,
          notes,
          status: "planned",
        });
      }

      setMsg(`Copied ${label}. Saved to History.`);
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) {
      setMsg(e?.message ? `Copy failed: ${e.message}` : "Copy failed");
      setTimeout(() => setMsg(""), 2500);
    } finally {
      setCopyBusy(false);
    }
  }

  async function onGetTrades() {
    try {
      setIdeasBusy(true);
      setIdeasMsg("");
      setSelectedIdeaId(null);

      const ohlc = await fetchYahooOHLC(symbol, timeframe);

      // Generate 5 structured trade ideas (rule-based v1)
      const nextIdeas = generateTradeIdeas({
        symbol,
        timeframe,
        candles: ohlc.candles,
        tickSize,
      });

      setIdeas(nextIdeas);
      setIdeasMsg(`Generated ${nextIdeas.length} trades from live data (${ohlc.candlesCount} candles).`);
    } catch (e: any) {
      setIdeas([]);
      setIdeasMsg(e?.message ? `Failed: ${e.message}` : "Failed to generate trades");
    } finally {
      setIdeasBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div className="md:col-span-5">
        <Card className="p-4">
          <div className="text-sm font-semibold">Calculator</div>
          <div className="mt-1 text-xs text-white/60">
            Select symbol, enter plan, or click a Trade Idea to auto-fill. Copy buttons save into History automatically.
          </div>

          <div className="mt-4">
            <div className="mb-1 text-xs text-white/60">Futures Symbol</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={copyBusy || ideasBusy}
            >
              {specs.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[10px] text-white/45">
              Tick size {tickSize} • Tick value ${tickValue}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs text-white/60">Account Size ($)</div>
              <Input value={account} onChange={(e) => setAccount(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <div className="mb-1 text-xs text-white/60">Risk (%)</div>
              <Input value={riskPct} onChange={(e) => setRiskPct(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-xs text-white/60">Contracts</div>
            <Input value={contracts} onChange={(e) => setContracts(e.target.value)} inputMode="numeric" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
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
            <Button small variant="ghost" onClick={() => entry && copyAndSave("Entry", entry)} disabled={!entry || copyBusy}>
              Copy Entry
            </Button>
            <Button small variant="ghost" onClick={() => stop && copyAndSave("Stop Loss", stop)} disabled={!stop || copyBusy}>
              Copy SL
            </Button>
            <Button small variant="ghost" onClick={() => tp1 && copyAndSave("TP1", tp1)} disabled={!tp1 || copyBusy}>
              Copy TP1
            </Button>
            <Button small variant="ghost" onClick={() => tp2 && copyAndSave("TP2", tp2)} disabled={!tp2 || copyBusy}>
              Copy TP2
            </Button>
            <Button small variant="ghost" onClick={() => tp3 && copyAndSave("TP3", tp3)} disabled={!tp3 || copyBusy}>
              Copy TP3
            </Button>
            <Button small variant="ghost" onClick={() => copyAndSave("Symbol", symbol)} disabled={copyBusy}>
              Copy Symbol
            </Button>
          </div>

          {msg ? <div className="mt-3 text-xs text-white/60">{msg}</div> : null}

          <div className="mt-4 text-[10px] text-white/45">
            Tier: {tier.toUpperCase()} • Phase 3 v1 is rule-based (no AI yet). Next we import your SMC logic and upgrade the generator.
          </div>
        </Card>
      </div>

      <div className="md:col-span-7">
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Trade Ideas</div>
              <div className="text-xs text-white/60">
                Click <span className="text-white/80">Get Trades</span> to generate 5 setups from live OHLC data. Click a card to auto-fill the calculator.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={ideasBusy || copyBusy}
                title="Timeframe"
              >
                {TIMEFRAMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <Button small onClick={onGetTrades} disabled={ideasBusy || copyBusy}>
                {ideasBusy ? "Loading…" : "Get Trades"}
              </Button>
            </div>
          </div>

          {ideasMsg ? (
            <div className="mt-3 text-xs text-white/60">{ideasMsg}</div>
          ) : (
            <div className="mt-3 text-xs text-white/45">
              No trades generated yet. Hit <span className="text-white/70">Get Trades</span>.
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3">
            {ideas.map((idea) => {
              const isSel = idea.id === selectedIdeaId;
              return (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdeaId(idea.id)}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition",
                    isSel ? "border-white/30 bg-white/5" : "border-white/10 bg-black/30 hover:border-white/20",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-white/60">{idea.setupName}</div>
                      <div className="mt-1 text-sm font-semibold">
                        {idea.symbol} • {idea.timeframe} • {formatDir(idea.direction)}
                      </div>
                      <div className="mt-1 text-xs text-white/60">Confidence: {idea.confidence}%</div>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      <div>Entry: {idea.entry.toFixed(2)}</div>
                      <div>SL: {idea.stop.toFixed(2)}</div>
                      <div>TP1/2/3: {idea.tp1.toFixed(2)} / {idea.tp2.toFixed(2)} / {idea.tp3.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="text-[10px] text-white/45">Elite Details</div>
                      <div className="mt-1 text-xs text-white/70">{idea.eliteDetails}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="text-[10px] text-white/45">Newbie Details</div>
                      <div className="mt-1 text-xs text-white/70">{idea.newbieDetails}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {ideas.length > 0 ? (
            <div className="mt-4 text-[10px] text-white/45">
              Note: these are generated from live data (rule-based v1). Your History only logs when you press a Copy button.
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
