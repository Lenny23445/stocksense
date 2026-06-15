// StockSense — Kursdaten-Fetcher (Node 20+, keine Abhängigkeiten)
// Holt 1 Jahr Tageskerzen je Ticker von Yahoo Finance und schreibt data/universe.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// sec = Sektor (für Diversitäts-Regel der Tipps), type: stock | etf | index | fx
const UNIVERSE = [
  // US-Tech
  { s: 'AAPL', n: 'Apple', sec: 'Tech', type: 'stock' },
  { s: 'MSFT', n: 'Microsoft', sec: 'Tech', type: 'stock' },
  { s: 'NVDA', n: 'NVIDIA', sec: 'Halbleiter', type: 'stock' },
  { s: 'GOOGL', n: 'Alphabet', sec: 'Tech', type: 'stock' },
  { s: 'AMZN', n: 'Amazon', sec: 'Internet', type: 'stock' },
  { s: 'META', n: 'Meta', sec: 'Internet', type: 'stock' },
  { s: 'TSLA', n: 'Tesla', sec: 'Auto', type: 'stock' },
  { s: 'AMD', n: 'AMD', sec: 'Halbleiter', type: 'stock' },
  { s: 'AVGO', n: 'Broadcom', sec: 'Halbleiter', type: 'stock' },
  { s: 'NFLX', n: 'Netflix', sec: 'Medien', type: 'stock' },
  { s: 'CRM', n: 'Salesforce', sec: 'Tech', type: 'stock' },
  { s: 'ORCL', n: 'Oracle', sec: 'Tech', type: 'stock' },
  { s: 'ADBE', n: 'Adobe', sec: 'Tech', type: 'stock' },
  { s: 'INTC', n: 'Intel', sec: 'Halbleiter', type: 'stock' },
  { s: 'QCOM', n: 'Qualcomm', sec: 'Halbleiter', type: 'stock' },
  { s: 'PLTR', n: 'Palantir', sec: 'Tech', type: 'stock' },
  { s: 'UBER', n: 'Uber', sec: 'Internet', type: 'stock' },
  { s: 'ABNB', n: 'Airbnb', sec: 'Internet', type: 'stock' },
  // US-Blue-Chips
  { s: 'BRK-B', n: 'Berkshire Hathaway', sec: 'Finanzen', type: 'stock' },
  { s: 'JPM', n: 'JPMorgan Chase', sec: 'Finanzen', type: 'stock' },
  { s: 'BAC', n: 'Bank of America', sec: 'Finanzen', type: 'stock' },
  { s: 'V', n: 'Visa', sec: 'Zahlungsverkehr', type: 'stock' },
  { s: 'MA', n: 'Mastercard', sec: 'Zahlungsverkehr', type: 'stock' },
  { s: 'JNJ', n: 'Johnson & Johnson', sec: 'Gesundheit', type: 'stock' },
  { s: 'LLY', n: 'Eli Lilly', sec: 'Gesundheit', type: 'stock' },
  { s: 'UNH', n: 'UnitedHealth', sec: 'Gesundheit', type: 'stock' },
  { s: 'PFE', n: 'Pfizer', sec: 'Gesundheit', type: 'stock' },
  { s: 'KO', n: 'Coca-Cola', sec: 'Konsum', type: 'stock' },
  { s: 'PEP', n: 'PepsiCo', sec: 'Konsum', type: 'stock' },
  { s: 'MCD', n: "McDonald's", sec: 'Konsum', type: 'stock' },
  { s: 'PG', n: 'Procter & Gamble', sec: 'Konsum', type: 'stock' },
  { s: 'NKE', n: 'Nike', sec: 'Konsum', type: 'stock' },
  { s: 'WMT', n: 'Walmart', sec: 'Handel', type: 'stock' },
  { s: 'COST', n: 'Costco', sec: 'Handel', type: 'stock' },
  { s: 'HD', n: 'Home Depot', sec: 'Handel', type: 'stock' },
  { s: 'DIS', n: 'Disney', sec: 'Medien', type: 'stock' },
  { s: 'XOM', n: 'ExxonMobil', sec: 'Energie', type: 'stock' },
  { s: 'CVX', n: 'Chevron', sec: 'Energie', type: 'stock' },
  // Deutschland
  { s: 'SAP.DE', n: 'SAP', sec: 'Tech', type: 'stock' },
  { s: 'SIE.DE', n: 'Siemens', sec: 'Industrie', type: 'stock' },
  { s: 'ALV.DE', n: 'Allianz', sec: 'Versicherung', type: 'stock' },
  { s: 'DTE.DE', n: 'Deutsche Telekom', sec: 'Telekom', type: 'stock' },
  { s: 'AIR.DE', n: 'Airbus', sec: 'Industrie', type: 'stock' },
  { s: 'MBG.DE', n: 'Mercedes-Benz', sec: 'Auto', type: 'stock' },
  { s: 'BMW.DE', n: 'BMW', sec: 'Auto', type: 'stock' },
  { s: 'VOW3.DE', n: 'Volkswagen', sec: 'Auto', type: 'stock' },
  { s: 'DTG.DE', n: 'Daimler Truck', sec: 'Auto', type: 'stock' },
  { s: 'BAS.DE', n: 'BASF', sec: 'Chemie', type: 'stock' },
  { s: 'BAYN.DE', n: 'Bayer', sec: 'Chemie', type: 'stock' },
  { s: 'IFX.DE', n: 'Infineon', sec: 'Halbleiter', type: 'stock' },
  { s: 'RHM.DE', n: 'Rheinmetall', sec: 'Rüstung', type: 'stock' },
  { s: 'ADS.DE', n: 'Adidas', sec: 'Konsum', type: 'stock' },
  { s: 'MUV2.DE', n: 'Münchener Rück', sec: 'Versicherung', type: 'stock' },
  { s: 'DBK.DE', n: 'Deutsche Bank', sec: 'Finanzen', type: 'stock' },
  { s: 'DHL.DE', n: 'DHL Group', sec: 'Logistik', type: 'stock' },
  { s: 'EOAN.DE', n: 'E.ON', sec: 'Versorger', type: 'stock' },
  { s: 'RWE.DE', n: 'RWE', sec: 'Versorger', type: 'stock' },
  { s: 'HEI.DE', n: 'Heidelberg Materials', sec: 'Industrie', type: 'stock' },
  { s: 'ZAL.DE', n: 'Zalando', sec: 'Internet', type: 'stock' },
  { s: 'SHL.DE', n: 'Siemens Healthineers', sec: 'Gesundheit', type: 'stock' },
  // International
  { s: 'ASML', n: 'ASML', sec: 'Halbleiter', type: 'stock' },
  { s: 'NVO', n: 'Novo Nordisk', sec: 'Gesundheit', type: 'stock' },
  { s: 'TSM', n: 'TSMC', sec: 'Halbleiter', type: 'stock' },
  { s: 'MC.PA', n: 'LVMH', sec: 'Luxus', type: 'stock' },
  // ETFs (Xetra, EUR)
  { s: 'EUNL.DE', n: 'iShares Core MSCI World', sec: 'ETF Welt', type: 'etf' },
  { s: 'VWCE.DE', n: 'Vanguard FTSE All-World', sec: 'ETF Welt', type: 'etf' },
  { s: 'SXR8.DE', n: 'iShares Core S&P 500', sec: 'ETF USA', type: 'etf' },
  { s: 'EQQQ.DE', n: 'Invesco Nasdaq-100', sec: 'ETF USA', type: 'etf' },
  { s: 'XDWT.DE', n: 'Xtrackers MSCI World IT', sec: 'ETF Tech', type: 'etf' },
  { s: 'IS3N.DE', n: 'iShares MSCI EM IMI', sec: 'ETF Schwellenländer', type: 'etf' },
  { s: 'EXS1.DE', n: 'iShares Core DAX', sec: 'ETF Europa', type: 'etf' },
  { s: 'EXSA.DE', n: 'iShares STOXX Europe 600', sec: 'ETF Europa', type: 'etf' },
  { s: '4GLD.DE', n: 'Xetra-Gold', sec: 'Gold', type: 'etf' },
  // Krypto (EUR)
  { s: 'BTC-EUR', n: 'Bitcoin', sec: 'Krypto', type: 'crypto' },
  { s: 'ETH-EUR', n: 'Ethereum', sec: 'Krypto', type: 'crypto' },
  // Indizes (nur Markt-Überblick, keine Tipps)
  { s: '^GSPC', n: 'S&P 500', sec: 'Index', type: 'index' },
  { s: '^NDX', n: 'Nasdaq 100', sec: 'Index', type: 'index' },
  { s: '^GDAXI', n: 'DAX', sec: 'Index', type: 'index' },
  { s: '^STOXX50E', n: 'Euro Stoxx 50', sec: 'Index', type: 'index' },
  // FX für Portfolio-Umrechnung USD→EUR
  { s: 'EURUSD=X', n: 'EUR/USD', sec: 'FX', type: 'fx' },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function roundPrice(x) {
  if (x == null || !isFinite(x)) return null;
  if (x >= 1000) return Math.round(x * 10) / 10;
  if (x >= 10) return Math.round(x * 100) / 100;
  return Math.round(x * 10000) / 10000;
}

async function fetchTicker(def, attempt = 1) {
  // 2 Jahre Historie: nötig für Walk-Forward-Backtest (Trefferquote) bei langen Horizonten
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(def.s)}?range=2y&interval=1d`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const r = json?.chart?.result?.[0];
    if (!r?.timestamp?.length) throw new Error('keine Daten');
    const q = r.indicators.quote[0];
    const t = [], c = [], v = [];
    for (let i = 0; i < r.timestamp.length; i++) {
      if (q.close[i] == null) continue;
      t.push(r.timestamp[i]);
      c.push(roundPrice(q.close[i]));
      v.push(q.volume?.[i] != null ? Math.round(q.volume[i]) : 0);
    }
    if (c.length < 30) throw new Error(`nur ${c.length} Datenpunkte`);
    return {
      s: def.s, n: def.n, sec: def.sec, type: def.type,
      cur: r.meta.currency || 'USD',
      price: roundPrice(r.meta.regularMarketPrice ?? c[c.length - 1]),
      // Vortagesschluss = vorletzter Punkt der Serie (chartPreviousClose wäre der Schluss VOR Range-Beginn)
      prev: roundPrice(c[c.length - 2]),
      t, c, v,
    };
  } catch (err) {
    if (attempt < 3) {
      await sleep(1500 * attempt);
      return fetchTicker(def, attempt + 1);
    }
    console.error(`FEHLER ${def.s}: ${err.message}`);
    return null;
  }
}

// Yahoo-Crumb (Cookie + Token) — nötig für quoteSummary (Earnings-Termine)
async function getYahooAuth() {
  try {
    const r1 = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA } });
    const sc = typeof r1.headers.getSetCookie === 'function'
      ? r1.headers.getSetCookie()
      : [r1.headers.get('set-cookie')].filter(Boolean);
    const cookie = sc.map(c => c.split(';')[0]).join('; ');
    if (!cookie) return null;
    const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, cookie } });
    const crumb = (await r2.text()).trim();
    if (!crumb || crumb.includes('<') || crumb.length > 40) return null;
    return { cookie, crumb };
  } catch { return null; }
}

// Nächster künftiger Quartalstermin (Unix-Sekunden) oder null
async function fetchEarnings(sym, auth) {
  if (!auth) return null;
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=calendarEvents&crumb=${encodeURIComponent(auth.crumb)}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, cookie: auth.cookie, Accept: 'application/json' } });
    if (!res.ok) return null;
    const j = await res.json();
    const ed = j?.quoteSummary?.result?.[0]?.calendarEvents?.earnings?.earningsDate;
    if (!ed?.length) return null;
    const now = Math.floor(Date.now() / 1000);
    const future = ed.map(x => x?.raw).filter(x => x && x > now).sort((a, b) => a - b);
    return future[0] || null;
  } catch { return null; }
}

const auth = await getYahooAuth();
if (!auth) console.error('Hinweis: kein Yahoo-Crumb — Quartalstermine werden übersprungen.');

const out = { updated: Math.floor(Date.now() / 1000), tickers: [] };
let ok = 0, fail = 0, earn = 0;
for (const def of UNIVERSE) {
  const data = await fetchTicker(def);
  if (data) {
    if (def.type === 'stock' && auth) {
      const e = await fetchEarnings(def.s, auth);
      if (e) { data.e = e; earn++; }
      await sleep(200);
    }
    out.tickers.push(data); ok++;
  } else { fail++; }
  await sleep(250);
}

if (ok < UNIVERSE.length * 0.6) {
  console.error(`Abbruch: nur ${ok}/${UNIVERSE.length} erfolgreich — bestehende Daten bleiben unverändert.`);
  process.exit(1);
}

mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'universe.json'), JSON.stringify(out));
console.log(`Fertig: ${ok} OK, ${fail} Fehler, ${earn} Quartalstermine → data/universe.json`);
