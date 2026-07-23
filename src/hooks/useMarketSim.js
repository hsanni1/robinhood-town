import { useEffect, useRef, useState } from "react";
import { TOKENS } from "../data/assets.js";

const SYMBOLS = Object.keys(TOKENS);
const TICK_MS = 1400;
const CANDLE_EVERY = 3; // one candle every N ticks
const MAX_CANDLES = 24;
const EVENT_MIN_MS = 25000;
const EVENT_MAX_MS = 45000;
const EVENT_DURATION_MS = 12000;

// Rough $M 24h-volume seeds - memecoins run hot on hype, stock tokens trade thin.
const VOLUME_SEED = {
  BTC: 1800,
  ETH: 950,
  SOL: 420,
  DOGE: 210,
  CASHCAT: 640,
  ANSEM: 95,
  TENDIES: 60,
  ARROW: 130,
  NVDA: 40,
  AAPL: 35,
  TSLA: 55,
};

function seedSeries(base) {
  const history = [];
  let last = base;
  for (let i = 0; i < MAX_CANDLES; i++) {
    const o = last;
    const drift = (Math.random() - 0.5) * base * 0.01;
    const c = Math.max(o + drift, base * 0.2);
    const h = Math.max(o, c) + Math.random() * base * 0.004;
    const l = Math.min(o, c) - Math.random() * base * 0.004;
    history.push({ o, h, l, c });
    last = c;
  }
  return history;
}

function seedPrices() {
  const out = {};
  for (const sym of SYMBOLS) {
    const base = TOKENS[sym].base;
    const history = seedSeries(base);
    const price = history[history.length - 1].c;
    out[sym] = {
      price,
      history,
      change24h: ((price - base) / base) * 100,
      volume: VOLUME_SEED[sym] * (0.8 + Math.random() * 0.4),
    };
  }
  return out;
}

/**
 * Simulated live market: random-walk prices per token, periodic
 * "bull run" / "flash crash" world events that bias drift + rewards.
 */
export function useMarketSim() {
  const [prices, setPrices] = useState(seedPrices);
  const [event, setEvent] = useState(null); // { type: 'bull' | 'crash', endsAt }
  const tickCount = useRef(0);
  const nextEventAt = useRef(Date.now() + EVENT_MIN_MS + Math.random() * (EVENT_MAX_MS - EVENT_MIN_MS));

  useEffect(() => {
    const id = setInterval(() => {
      tickCount.current += 1;
      const now = Date.now();

      setEvent((cur) => {
        if (cur && now > cur.endsAt) return null;
        if (!cur && now > nextEventAt.current) {
          nextEventAt.current = now + EVENT_MIN_MS + Math.random() * (EVENT_MAX_MS - EVENT_MIN_MS);
          return {
            type: Math.random() < 0.5 ? "bull" : "crash",
            endsAt: now + EVENT_DURATION_MS,
          };
        }
        return cur;
      });

      setPrices((prev) => {
        const next = {};
        const bias = event ? (event.type === "bull" ? 1 : -1) : 0;
        for (const sym of SYMBOLS) {
          const cur = prev[sym];
          const base = TOKENS[sym].base;
          const vol = TOKENS[sym].kind === "meme" ? 0.02 : TOKENS[sym].kind === "stock" ? 0.006 : 0.012;
          const drift = (Math.random() - 0.5 + bias * 0.35) * vol * cur.price;
          const price = Math.max(cur.price + drift, base * 0.05);

          let history = cur.history;
          if (tickCount.current % CANDLE_EVERY === 0) {
            const last = history[history.length - 1];
            const o = last.c;
            const c = price;
            const h = Math.max(o, c) + Math.random() * base * vol * 0.4;
            const l = Math.min(o, c) - Math.random() * base * vol * 0.4;
            history = [...history.slice(-(MAX_CANDLES - 1)), { o, h, l, c }];
          }

          // Volatility (from drift or a live event) pulls more volume in.
          const volumeBias = event ? 1.6 : 1;
          const volatilityKick = 1 + (Math.abs(drift) / cur.price) * 8;
          const targetVolume = VOLUME_SEED[sym] * volumeBias * volatilityKick;
          const volume = cur.volume + (targetVolume - cur.volume) * 0.15;

          next[sym] = {
            price,
            history,
            change24h: ((price - base) / base) * 100,
            volume,
          };
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.type]);

  return { prices, event, tokens: TOKENS };
}
