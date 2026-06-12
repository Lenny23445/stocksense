// StockSense — Tägliche Tipp-Benachrichtigung via ntfy.sh (Node 20+, keine Abhängigkeiten)
// Sendet nur beim Morgen-Lauf (05:xx UTC) oder wenn NTFY_ALWAYS=1 gesetzt ist.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOPIC = 'stocksense-tipps-kx84qv2n';
const APP_URL = 'https://lenny23445.github.io/stocksense/';

const hour = new Date().getUTCHours();
if (hour !== 5 && process.env.NTFY_ALWAYS !== '1') {
  console.log(`Kein Morgen-Lauf (UTC-Stunde ${hour}) — keine Benachrichtigung.`);
  process.exit(0);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const universe = JSON.parse(readFileSync(join(ROOT, 'data', 'universe.json'), 'utf8'));

/* Vereinfachte Version der Client-Analyse (gleiche Gewichte wie 1-Monats-Horizont) */
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const stddev = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1)); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function smaAt(c, n) { if (c.length < n) return null; return mean(c.slice(-n)); }
function rsi14(c) {
  const n = 14;
  if (c.length < n + 1) return null;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; }
  let ag = g / n, al = l / n;
  for (let i = n + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    ag = (ag * (n - 1) + Math.max(d, 0)) / n;
    al = (al * (n - 1) + Math.max(-d, 0)) / n;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}
function scoreOf(tk) {
  const c = tk.c, last = c.length - 1, price = c[last];
  if (c.length < 70) return null;
  const r = [];
  for (let i = 1; i < c.length; i++) r.push(Math.log(c[i] / c[i - 1]));
  const sma20 = smaAt(c, 20), sma50 = smaAt(c, 50), sma200 = smaAt(c, 200);
  let trend = 0;
  if (sma20 != null && price > sma20) trend += 9;
  if (sma20 != null && sma50 != null && sma20 > sma50) trend += 9;
  if (sma50 != null && sma200 != null && sma50 > sma200) trend += 9;
  if (sma200 != null) trend += clamp((price / sma200 - 1 + 0.1) / 0.2, 0, 1) * 8;
  else trend = trend / 27 * 35;
  const mom = d => last >= d ? price / c[last - d] - 1 : null;
  let momentum = 0;
  for (const m of [mom(21), mom(63), mom(126)])
    momentum += m == null ? 4.17 : clamp((m + 0.15) / 0.3, 0, 1) * 8.33;
  const rsi = rsi14(c);
  const rsiScore = rsi == null ? 7.5 : rsi <= 55 ? clamp((rsi - 25) / 30, 0, 1) * 15 : clamp(1 - (rsi - 55) / 30, 0, 1) * 15;
  const annVol = stddev(r.slice(-60)) * Math.sqrt(252);
  const volScore = clamp(1 - (annVol - 0.15) / 0.45, 0, 1) * 15;
  const v20 = mean(tk.v.slice(-20)), v60 = mean(tk.v.slice(-60));
  const volTrend = v60 > 0 ? v20 / v60 - 1 : 0;
  const volumeScore = clamp((volTrend + 0.3) / 0.6, 0, 1) * 10;
  // Erwartung 30 T ≈ GBM-Median: exp((μ−σ²/2)·21 Handelstage)
  let wsum = 0, msum = 0, w = 1;
  for (let i = r.length - 1; i >= Math.max(0, r.length - 180); i--) { msum += r[i] * w; wsum += w; w *= 0.97; }
  const ewma = msum / wsum;
  const m3 = mom(63);
  const momDrift = m3 != null ? Math.log(1 + m3) / 63 : ewma;
  const mu = clamp(0.6 * ewma + 0.4 * momDrift, -0.002, 0.002);
  const sigma = stddev(r.slice(-60));
  const exp30 = Math.exp((mu - sigma * sigma / 2) * 21) - 1;
  return { score: Math.round(clamp(trend + momentum + rsiScore + volScore + volumeScore, 0, 100)), exp30 };
}

const candidates = [];
for (const tk of universe.tickers) {
  if (tk.type !== 'stock' && tk.type !== 'etf') continue;
  const s = scoreOf(tk);
  if (s) candidates.push({ tk, ...s });
}
candidates.sort((a, b) => b.score - a.score);
const tips = [], used = new Set();
for (const cand of candidates) {
  if (used.has(cand.tk.sec)) continue;
  tips.push(cand); used.add(cand.tk.sec);
  if (tips.length === 3) break;
}

const pct = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(1).replace('.', ',') + ' %';
const body = tips.map((t, i) => `${i + 1}. ${t.tk.n} (Score ${t.score}, 30 T ${pct(t.exp30)})`).join('\n')
  + '\nKeine Anlageberatung - Details in der App.';

const res = await fetch('https://ntfy.sh/' + TOPIC, {
  method: 'POST',
  headers: {
    'Title': 'StockSense - Tipps des Tages',
    'Click': APP_URL,
    'Tags': 'chart_with_upwards_trend',
  },
  body,
});
console.log(res.ok ? `Benachrichtigung gesendet (${tips.map(t => t.tk.s).join(', ')})` : `ntfy-Fehler: HTTP ${res.status}`);
process.exit(res.ok ? 0 : 1);
