"use client";

import { useState } from "react";

export default function FuturesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function getTrades() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        "https://mofqdragpqnkqknsxouw.functions.supabase.co/fetch-yahoo-ohlc?symbol=ES%3DF&timeframe=1h"
      );

      if (!res.ok) throw new Error("Failed to fetch market data");

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">

        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight">
            Market Engine
          </h1>
          <p className="text-zinc-400 mt-3 text-lg">
            Live ES 1H structure feed
          </p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-10 shadow-2xl">

          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-semibold">Data Control</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Pull latest market candles
              </p>
            </div>

            <button
              onClick={getTrades}
              className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              {loading ? "Loading..." : "Fetch Data"}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-600 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-500 text-sm">Symbol</p>
                <p className="text-3xl mt-2 font-semibold">{result.symbol}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-500 text-sm">Timeframe</p>
                <p className="text-3xl mt-2 font-semibold">{result.timeframe}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-500 text-sm">Candles Returned</p>
                <p className="text-3xl mt-2 font-semibold">
                  {result.candlesCount}
                </p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
