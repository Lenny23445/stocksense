// StockSense — Tipp-Protokoll für die Bilanz (Node 20+, keine Abhängigkeiten)
// Hält je Kalendertag die 3 Tages-Tipps mit Kurs zum Zeitpunkt der Empfehlung fest.
// Die App vergleicht später mit dem aktuellen Kurs → echte Trefferbilanz.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickTips } from './engine.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = join(ROOT, 'data', 'tips-log.json');

const universe = JSON.parse(readFileSync(join(ROOT, 'data', 'universe.json'), 'utf8'));
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : { entries: [] };

const today = new Date().toISOString().slice(0, 10);
if (log.entries.some(e => e.d === today)) {
  console.log(`Eintrag für ${today} existiert bereits — nichts zu tun.`);
  process.exit(0);
}

const tips = pickTips(universe);
log.entries.push({
  d: today,
  tips: tips.map(t => ({ s: t.tk.s, n: t.tk.n, price: t.tk.price, cur: t.tk.cur, exp30: Math.round(t.exp30 * 10000) / 10000 })),
});
// Maximal 1 Jahr Protokoll behalten
if (log.entries.length > 370) log.entries = log.entries.slice(-370);

writeFileSync(LOG, JSON.stringify(log));
console.log(`Tipps für ${today} protokolliert: ${tips.map(t => t.tk.s).join(', ')}`);
