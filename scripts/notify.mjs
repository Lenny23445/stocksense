// StockSense — Tägliche Tipp-Benachrichtigung via ntfy.sh (Node 20+, keine Abhängigkeiten)
// Sendet nur beim Morgen-Lauf (05:xx UTC) oder wenn NTFY_ALWAYS=1 gesetzt ist.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickTips } from './engine.mjs';

const TOPIC = 'stocksense-tipps-kx84qv2n';
const APP_URL = 'https://lenny23445.github.io/stocksense/';

const hour = new Date().getUTCHours();
if (hour !== 5 && process.env.NTFY_ALWAYS !== '1') {
  console.log(`Kein Morgen-Lauf (UTC-Stunde ${hour}) — keine Benachrichtigung.`);
  process.exit(0);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const universe = JSON.parse(readFileSync(join(ROOT, 'data', 'universe.json'), 'utf8'));
const tips = pickTips(universe);

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
