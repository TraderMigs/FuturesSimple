// src/lib/yahooOhlc.ts
export type YahooCandle = {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number | null;
};

export type YahooOhlcResponse = {
  symbol: string;
  timeframe: string;
  interval: string;
  range: string;
  candles: YahooCandle[];
  candlesCount: number;
};

export async function fetchYahooOHLC(symbol: string, timeframe: string): Promise<YahooOhlcResponse> {
  const base =
    "https://mofqdragpqnkqknsxouw.functions.supabase.co/fetch-yahoo-ohlc";

  const url = `${base}?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(
    timeframe
  )}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fetchYahooOHLC failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return (await res.json()) as YahooOhlcResponse;
}
