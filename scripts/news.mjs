// StockSense — Schlagzeilen-Fetcher (Node 20+, keine Abhängigkeiten)
// Holt je Universum-Wert bis zu 5 Schlagzeilen von Yahoo Finance → data/news.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const universe = JSON.parse(readFileSync(join(ROOT, 'data', 'universe.json'), 'utf8'));
const targets = universe.tickers.filter(t => ['stock', 'etf', 'index', 'crypto'].includes(t.type));

async function fetchNews(query, tk) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=0&newsCount=8`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  // Nur relevante Treffer: Ticker verknüpft oder Firmenname im Titel —
  // Yahoo füllt sonst mit allgemeinen Weltnachrichten auf
  const baseSym = tk.s.split('.')[0].toUpperCase();
  const nameWords = tk.n.toLowerCase().split(/[^a-zäöüß0-9]+/).filter(w => w.length > 2);
  return (json.news || [])
    .filter(n => n.title && n.link)
    .filter(n => {
      const rel = (n.relatedTickers || []).some(rt => rt.toUpperCase() === tk.s.toUpperCase() || rt.split('.')[0].toUpperCase() === baseSym);
      const titleHit = nameWords.length && nameWords.some(w => n.title.toLowerCase().includes(w));
      return rel || titleHit;
    })
    .slice(0, 5)
    .map(n => ({ t: n.title, p: n.publisher || '', u: n.link, ts: n.providerPublishTime || 0 }));
}

const out = { updated: Math.floor(Date.now() / 1000), news: {} };
let ok = 0;
for (const tk of targets) {
  try {
    // Erst per Symbol, bei 0 relevanten Treffern per Name suchen
    let items = await fetchNews(tk.s, tk);
    if (!items.length) { await sleep(150); items = await fetchNews(tk.n, tk); }
    if (items.length) { out.news[tk.s] = items; ok++; }
  } catch (err) {
    console.error(`NEWS-FEHLER ${tk.s}: ${err.message}`);
  }
  await sleep(200);
}

writeFileSync(join(ROOT, 'data', 'news.json'), JSON.stringify(out));
console.log(`Fertig: Schlagzeilen für ${ok}/${targets.length} Werte → data/news.json`);
