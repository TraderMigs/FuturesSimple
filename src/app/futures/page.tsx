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

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-4xl font-semibold mb-4">
          Futures Intelligence
        </h1>

        <p className="text-gray-400 mb-8">
          ES 1H data stream — SMC ready.
        </p>

        <button
          onClick={getTrades}
          className="bg-white text-black px-6 py-3 rounded-md font-medium hover:opacity-80 transition"
        >
          {loading ? "Loading Data..." : "Load Market Data"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-900/40 border border-red-600 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <p className="text-gray-400 text-sm">Symbol</p>
              <p className="text-2xl mt-1">{result.symbol}</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <p className="text-gray-400 text-sm">Timeframe</p>
              <p className="text-2xl mt-1">{result.timeframe}</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <p className="text-gray-400 text-sm">Candles Pulled</p>
              <p className="text-2xl mt-1">{result.candlesCount}</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
