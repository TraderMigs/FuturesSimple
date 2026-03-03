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
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "40px",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Futures Test Page
      </h1>

      <button
        onClick={getTrades}
        style={{
          padding: "10px 16px",
          background: "#111",
          border: "1px solid #444",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {loading ? "Loading..." : "Get Trades"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "20px" }}>
          Error: {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <p>Symbol: {result.symbol}</p>
          <p>Timeframe: {result.timeframe}</p>
          <p>Candles Returned: {result.candlesCount}</p>
        </div>
      )}
    </div>
  );
}
