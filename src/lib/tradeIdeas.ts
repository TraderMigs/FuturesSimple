// src/lib/tradeIdeas.ts
// Rule-based v1 trade idea generator (no AI yet). Uses recent OHLC to create 5 structured setups.
//
// Why this exists:
// - Makes the app feel real immediately (Phase 3)
// - Keeps logic transparent and deterministic
// - Later we can replace/upgrade this with your SMC algo + AI explanations

import type { YahooCandle } from "@/lib/yahooOhlc";

export type TradeIdea = {
  id: string;
  symbol: string;
  timeframe: string;
  setupName: string;
  direction: "long" | "short";
  confidence: number; // 0-100
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  tp3: number;
  eliteDetails: string;
  newbieDetails: string;
  meta: {
    lastClose: number;
    atr: number;
    sma20: number;
    sma50: number;
  };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundToTick(price: number, tickSize: number) {
  if (!isFinite(price) || !isFinite(tickSize) || tickSize <= 0) return price;
  return Math.round(price / tickSize) * tickSize;
}

function sma(values: number[], period: number) {
  if (values.length < period) return values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
  const slice = values.slice(values.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function atrFromCandles(candles: YahooCandle[], period = 14) {
  // Simplified ATR: average of (high-low) over last N candles.
  const slice = candles.slice(-period);
  const ranges = slice.map(c => Math.abs(c.h - c.l));
  const avg = ranges.reduce((a, b) => a + b, 0) / Math.max(ranges.length, 1);
  return avg || 0;
}

function trendScore(lastClose: number, sma20v: number, sma50v: number) {
  // Positive = bullish, Negative = bearish
  const a = lastClose - sma20v;
  const b = sma20v - sma50v;
  const raw = a + b;
  const denom = Math.max(Math.abs(sma50v), 1);
  return raw / denom;
}

function makeId(prefix: string, i: number) {
  return `${prefix}_${i}_${Math.random().toString(16).slice(2, 10)}`;
}

export function generateTradeIdeas(args: {
  symbol: string;
  timeframe: string;
  candles: YahooCandle[];
  tickSize: number;
}): TradeIdea[] {
  const { symbol, timeframe, candles, tickSize } = args;

  if (!candles || candles.length < 60) {
    // Not enough data: still return something coherent
    const fallbackPrice = candles?.[candles.length - 1]?.c ?? 0;
    const base = fallbackPrice || 100;
    const atr = Math.max(base * 0.002, tickSize * 10);
    return Array.from({ length: 5 }).map((_, i) => {
      const dir: "long" | "short" = i % 2 === 0 ? "long" : "short";
      const entry = dir === "long" ? base - atr * 0.25 : base + atr * 0.25;
      const stop = dir === "long" ? entry - atr : entry + atr;
      const tp1 = dir === "long" ? entry + atr : entry - atr;
      const tp2 = dir === "long" ? entry + atr * 2 : entry - atr * 2;
      const tp3 = dir === "long" ? entry + atr * 3 : entry - atr * 3;

      return {
        id: makeId("idea", i + 1),
        symbol,
        timeframe,
        setupName: `SMC Setup ${i + 1}`,
        direction: dir,
        confidence: 60,
        entry: roundToTick(entry, tickSize),
        stop: roundToTick(stop, tickSize),
        tp1: roundToTick(tp1, tickSize),
        tp2: roundToTick(tp2, tickSize),
        tp3: roundToTick(tp3, tickSize),
        eliteDetails:
          "Not enough candle data to score structure cleanly. This is a safe, rule-based fallback with ATR spacing.",
        newbieDetails:
          "Not enough chart data. These prices are spaced using recent volatility so you still have an Entry, Stop, and 3 targets.",
        meta: { lastClose: base, atr, sma20: base, sma50: base },
      };
    });
  }

  const closes = candles.map(c => c.c);
  const lastClose = closes[closes.length - 1] || 0;
  const sma20v = sma(closes, 20);
  const sma50v = sma(closes, 50);
  const atr = Math.max(atrFromCandles(candles, 14), tickSize * 8);

  const ts = trendScore(lastClose, sma20v, sma50v);
  const dir: "long" | "short" = ts >= 0 ? "long" : "short";

  // Confidence is just a transparent score (NOT a promise).
  const confidenceBase = 60 + clamp(Math.abs(ts) * 200, 0, 25); // 60-85
  const confidence = Math.round(clamp(confidenceBase, 55, 88));

  // Build 5 variations around the same “read”
  const setups = [
    { name: "Liquidity Sweep Reversal", entryMult: 0.30, slMult: 1.10, tps: [1.0, 2.0, 3.0] },
    { name: "Break of Structure Continuation", entryMult: 0.10, slMult: 0.90, tps: [0.9, 1.8, 2.7] },
    { name: "Order Block Retest", entryMult: 0.45, slMult: 1.25, tps: [1.1, 2.2, 3.3] },
    { name: "Range Expansion (Impulse)", entryMult: 0.00, slMult: 0.80, tps: [0.8, 1.6, 2.4] },
    { name: "Mean Reversion to SMA20", entryMult: 0.55, slMult: 1.35, tps: [0.7, 1.4, 2.1] },
  ];

  return setups.map((s, idx) => {
    const entry =
      dir === "long" ? lastClose - atr * s.entryMult : lastClose + atr * s.entryMult;

    const stop =
      dir === "long" ? entry - atr * s.slMult : entry + atr * s.slMult;

    const [t1, t2, t3] = s.tps;
    const tp1 = dir === "long" ? entry + atr * t1 : entry - atr * t1;
    const tp2 = dir === "long" ? entry + atr * t2 : entry - atr * t2;
    const tp3 = dir === "long" ? entry + atr * t3 : entry - atr * t3;

    const eliteDetails = [
      `Data: lastClose=${lastClose.toFixed(2)}, SMA20=${sma20v.toFixed(2)}, SMA50=${sma50v.toFixed(2)}, ATR≈${atr.toFixed(2)}.`,
      `Bias: ${dir.toUpperCase()} because price vs SMA20/50 trend score is ${ts >= 0 ? "positive" : "negative"}.`,
      `Setup: ${s.name}. Entry is volatility-spaced near the current price. Stop is ${s.slMult}×ATR. Targets are ${t1}/${t2}/${t3}×ATR.`,
      "This is rule-based v1 (transparent math). When your SMC logic is imported, these will be replaced by your real model.",
    ].join(" ");

    const newbieDetails = [
      `Direction: ${dir.toUpperCase()}.`,
      "Entry is near current price. Stop is placed far enough away so normal noise doesn’t instantly stop you out.",
      "Targets are 3 step-outs so you can take profit in pieces.",
      "Reminder: this is informational only and can lose.",
    ].join(" ");

    return {
      id: makeId("idea", idx + 1),
      symbol,
      timeframe,
      setupName: s.name,
      direction: dir,
      confidence,
      entry: roundToTick(entry, tickSize),
      stop: roundToTick(stop, tickSize),
      tp1: roundToTick(tp1, tickSize),
      tp2: roundToTick(tp2, tickSize),
      tp3: roundToTick(tp3, tickSize),
      eliteDetails,
      newbieDetails,
      meta: { lastClose, atr, sma20: sma20v, sma50: sma50v },
    };
  });
}
