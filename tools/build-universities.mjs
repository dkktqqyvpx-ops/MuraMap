#!/usr/bin/env node
/*
 * Merge the per-university research files (data/research/UNI-*.json — the
 * "store structured fact" output of the fact pipeline) into the single file
 * the frontend reads (data/universities.json) and validate them on the way.
 *
 *   node tools/build-universities.mjs          # build + validate
 *   node tools/build-universities.mjs --check  # validate only, exit 1 on errors
 *
 * Validation is deliberately strict about provenance: every displayed item
 * must reference a fact, every fact must carry a source URL, a domain, a
 * collection date and a confidence level, and every price needs value,
 * currency and period.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const researchDir = join(root, 'data', 'research');
const outFile = join(root, 'data', 'universities.json');
const logFile = join(root, 'data', 'research-log.json');
const checkOnly = process.argv.includes('--check');

const LANGS = ['en', 'ru', 'kk'];
const CONFIDENCE = ['high', 'medium', 'low'];
const PERIODS = ['month', 'year', 'semester', 'day', 'credit', 'program', 'level'];
const KINDS = ['dormitory', 'library', 'building', 'sports', 'transit', 'airport', 'rail', 'bus_station'];
const CATEGORIES = ['accommodation', 'dormitory', 'food', 'transport', 'mobile_internet', 'personal', 'utilities', 'total'];
const LIFE = ['organizations', 'sports', 'laboratories', 'events', 'clubs', 'facilities', 'study_spaces', 'dining', 'recreation'];
const TRANSPORT = ['bus', 'metro', 'lrt', 'tram', 'taxi', 'airport', 'rail', 'bus_station', 'bike'];
const CLIMATE = ['avg_annual_temp', 'avg_jan_temp', 'avg_jul_temp', 'annual_precipitation_mm', 'summary'];

/*
 * Small, explicit corrections applied on top of the research output.
 * Each entry names the fact it touches so the change is auditable.
 */
const OVERRIDES = {
  // Wise "basic utilities for an 85 m² apartment" was filed under accommodation.
  'UNI-SATBAYEV:F-17': { costCategory: 'utilities' }
};

const errors = [];
const warnings = [];

function err(u, msg) { errors.push(`${u}: ${msg}`); }
function warn(u, msg) { warnings.push(`${u}: ${msg}`); }

function isText(x) { return x && typeof x === 'object' && LANGS.every((l) => typeof x[l] === 'string' && x[l].trim()); }
function isCoord(lat, lng) { return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0); }

function checkFact(u, f) {
  const id = `${u}/${f.id}`;
  if (!f.id) err(u, 'fact without id');
  if (!CONFIDENCE.includes(f.confidence)) err(id, `bad confidence "${f.confidence}"`);
  if (!/^https?:\/\//.test(f.sourceUrl || '')) err(id, `bad sourceUrl "${f.sourceUrl}"`);
  if (!f.sourceDomain) err(id, 'missing sourceDomain');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.collectedAt || '')) err(id, `bad collectedAt "${f.collectedAt}"`);
  if (!Array.isArray(f.evidence) || !f.evidence.length) err(id, 'missing evidence');
  if (!['official', 'external'].includes(f.sourceKind)) warn(id, `sourceKind "${f.sourceKind}"`);
  if (f.sourceKind === 'official' && f.confidence === 'low') warn(id, 'official source but low confidence');
  try {
    const host = new URL(f.sourceUrl).host.replace(/^www\./, '');
    if (!host.endsWith(f.sourceDomain.replace(/^www\./, ''))) warn(id, `sourceDomain "${f.sourceDomain}" differs from URL host "${host}"`);
  } catch (e) { /* already reported */ }
  if (f.sourceDate === undefined) warn(id, 'sourceDate missing (use null when unknown)');
}

function checkPrice(u, where, x) {
  if (!Number.isFinite(x.value) || x.value <= 0) err(`${u}/${where}`, `bad value ${x.value}`);
  if (!/^[A-Z]{3}$/.test(x.currency || '')) err(`${u}/${where}`, `bad currency "${x.currency}"`);
  if (!PERIODS.includes(x.period)) err(`${u}/${where}`, `bad period "${x.period}"`);
}

function dedupeTuition(u, list) {
  // Same fee published in two currencies (e.g. "$15,000 (7,665,000 KZT)") →
  // keep the local-currency entry and attach the other as `alt`.
  const out = [];
  list.forEach((x) => {
    const twin = out.find((y) => y.factId === x.factId && y.level === x.level && y.period === x.period &&
      y.academicYear === x.academicYear && y.currency !== x.currency && !y.alt);
    if (twin) {
      const keepTwin = twin.currency !== 'USD' || x.currency === 'USD';
      if (keepTwin) twin.alt = { value: x.value, currency: x.currency };
      else { x.alt = { value: twin.value, currency: twin.currency }; out[out.indexOf(twin)] = x; }
      warn(`${u}/tuition`, `merged two-currency entry ${x.factId} (${twin.currency} + ${x.currency})`);
    } else out.push(x);
  });
  return out;
}

function processUniversity(u) {
  const id = u.id;
  const factIds = new Set();
  (u.facts || []).forEach((f) => { if (factIds.has(f.id)) err(id, `duplicate fact id ${f.id}`); factIds.add(f.id); checkFact(id, f); });
  const ref = (where, factId) => { if (!factId) err(`${id}/${where}`, 'missing factId'); else if (!factIds.has(factId)) err(`${id}/${where}`, `unknown factId ${factId}`); };

  ['name', 'shortName', 'city', 'country'].forEach((k) => { if (!isText(u[k])) err(id, `${k} must have en/ru/kk`); });
  if (!/^https?:\/\//.test(u.website || '')) err(id, 'bad website');
  if (!Number.isInteger(u.founded)) warn(id, 'founded missing');
  if (!u.location || !isCoord(u.location.lat, u.location.lng)) err(id, 'location coordinates missing');
  else ref('location', u.location.factId);
  if (!u.cityCenter || !isCoord(u.cityCenter.lat, u.cityCenter.lng)) err(id, 'cityCenter coordinates missing');
  else ref('cityCenter', u.cityCenter.factId);
  if (u.location && u.cityCenter && isCoord(u.location.lat, u.location.lng) && isCoord(u.cityCenter.lat, u.cityCenter.lng)) {
    const d = Math.hypot(u.location.lat - u.cityCenter.lat, (u.location.lng - u.cityCenter.lng) * Math.cos(u.location.lat * Math.PI / 180)) * 111;
    if (d > 60) err(id, `university is ${d.toFixed(0)} km from the city centre point — check coordinates`);
  }

  (u.places || []).forEach((p, i) => {
    if (!KINDS.includes(p.kind)) err(`${id}/places[${i}]`, `bad kind ${p.kind}`);
    if (!isText(p.name)) err(`${id}/places[${i}]`, 'name must have en/ru/kk');
    if (p.lat != null && !isCoord(p.lat, p.lng)) err(`${id}/places[${i}]`, 'bad coordinates');
    if (p.lat != null && u.location && isCoord(u.location.lat, u.location.lng)) {
      const d = Math.hypot(p.lat - u.location.lat, (p.lng - u.location.lng) * Math.cos(u.location.lat * Math.PI / 180)) * 111;
      if (d > 80) err(`${id}/places[${i}]`, `${p.kind} is ${d.toFixed(0)} km from campus — check coordinates`);
    }
    ref(`places[${i}]`, p.factId);
  });
  (u.housing || []).forEach((h, i) => { checkPrice(id, `housing[${i}]`, h); if (!isText(h.name)) err(`${id}/housing[${i}]`, 'name'); ref(`housing[${i}]`, h.factId); });
  (u.costOfLiving || []).forEach((c, i) => {
    const o = OVERRIDES[`${id}:${c.factId}`];
    if (o && o.costCategory) c.category = o.costCategory;
    if (!CATEGORIES.includes(c.category)) err(`${id}/costOfLiving[${i}]`, `bad category ${c.category}`);
    checkPrice(id, `costOfLiving[${i}]`, c); ref(`costOfLiving[${i}]`, c.factId);
  });
  u.tuition = dedupeTuition(id, u.tuition || []);
  u.tuition.forEach((x, i) => {
    if (!['undergraduate', 'graduate', 'foundation', 'phd'].includes(x.level)) err(`${id}/tuition[${i}]`, `bad level ${x.level}`);
    if (!['domestic', 'international', 'all'].includes(x.audience)) err(`${id}/tuition[${i}]`, `bad audience ${x.audience}`);
    checkPrice(id, `tuition[${i}]`, x); ref(`tuition[${i}]`, x.factId);
    if (!x.academicYear) warn(`${id}/tuition[${i}]`, 'academicYear unknown');
  });
  (u.history || []).forEach((h, i) => { if (!Number.isInteger(h.year)) err(`${id}/history[${i}]`, 'year'); if (!isText(h.title)) err(`${id}/history[${i}]`, 'title'); ref(`history[${i}]`, h.factId); });
  (u.studentLife || []).forEach((s, i) => { if (!LIFE.includes(s.category)) err(`${id}/studentLife[${i}]`, `bad category ${s.category}`); if (!isText(s.text)) err(`${id}/studentLife[${i}]`, 'text'); ref(`studentLife[${i}]`, s.factId); });
  (u.transport || []).forEach((s, i) => { if (!TRANSPORT.includes(s.kind)) err(`${id}/transport[${i}]`, `bad kind ${s.kind}`); if (!isText(s.text)) err(`${id}/transport[${i}]`, 'text'); ref(`transport[${i}]`, s.factId); });
  (u.climate || []).forEach((c, i) => { if (!CLIMATE.includes(c.metric)) err(`${id}/climate[${i}]`, `bad metric ${c.metric}`); if (c.unit !== 'text' && !Number.isFinite(c.value)) err(`${id}/climate[${i}]`, 'value'); ref(`climate[${i}]`, c.factId); });
  if (!(u.tuition || []).length) warn(id, 'no tuition — UI will say it could not be verified');
  if (!(u.housing || []).length) warn(id, 'no housing');

  const { queryLog, gaps, ...rest } = u;
  return { entry: rest, log: { id, gaps: gaps || [], queryLog: queryLog || [] } };
}

const files = readdirSync(researchDir).filter((f) => /^UNI-.*\.json$/.test(f)).sort();
const entries = [];
const logs = [];
for (const f of files) {
  const raw = JSON.parse(readFileSync(join(researchDir, f), 'utf8'));
  const { entry, log } = processUniversity(raw);
  entries.push(entry);
  logs.push(log);
}

const out = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  collectionMethod: 'Search → retrieve source → extract evidence → validate (tools/build-universities.mjs) → store. Every fact carries sourceUrl, sourceDomain, sourceDate, collectedAt, confidence and evidence quotes.',
  universities: entries
};

warnings.forEach((w) => console.warn('warn ', w));
errors.forEach((e) => console.error('ERROR', e));
console.log(`${entries.length} universities, ${entries.reduce((n, u) => n + u.facts.length, 0)} facts, ${warnings.length} warnings, ${errors.length} errors`);

if (errors.length) process.exit(1);
if (!checkOnly) {
  writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n');
  writeFileSync(logFile, JSON.stringify({ generatedAt: out.generatedAt, universities: logs }, null, 1) + '\n');
  console.log(`wrote ${outFile}\nwrote ${logFile}`);
}
