# Study module — data model and fact pipeline

The Study module (`study.html`, `university.html`, `compare.html`) shows, for
each university, its location on a map, distance to the city centre, student
housing, cost of living, tuition, student life, history, transport and climate,
in Kazakh, Russian and English. Every value is displayed with the source it
came from; calculated values are labelled as estimates.

## Files

| Path | Role |
| --- | --- |
| `data/research/UNI-*.json` | One file per university: the stored output of the fact pipeline (structured sections + the `facts` provenance store + `gaps` + `queryLog`). |
| `data/universities.json` | What the frontend reads. Built and validated from the research files. |
| `data/research-log.json` | `gaps` and `queryLog` per university (what was searched, what was not found). |
| `data/rates.json` | Dated fallback exchange rate; the app first tries the live `open.er-api.com` feed. |
| `js/uni-core.js` | Shared i18n (kk/ru/en), Haversine, travel-time estimates, currency conversion, provenance rendering. |
| `js/university.js`, `js/study.js`, `js/compare.js` | Profile page, list/search page, side-by-side compare. |
| `tools/build-universities.mjs` | Merge + validate research files → `data/universities.json`. |
| `tools/fact-pipeline.mjs` | Search → retrieve → extract → validate → store, using the Anthropic SDK. |
| `server/worker.js` | The AI guide; it now also answers university questions grounded only in `data/universities.json`. |

## VerifiedFact

```json
{
  "id": "F-13",
  "type": "tuition",
  "value": "Undergraduate: $15,000 (7,665,000 KZT) per academic year 2025/2026",
  "sourceUrl": "https://nu.edu.kz/admissions/fees-and-funding/",
  "sourceDomain": "nu.edu.kz",
  "sourceTitle": "Fees and financial support - Nazarbayev University",
  "sourceKind": "official",
  "sourceDate": "2025/2026",
  "collectedAt": "2026-09-18",
  "confidence": "high",
  "evidence": ["The tuition fee for the undergraduate programs is $15,000 (7,665,000 KZT) …"]
}
```

Every displayed item (housing entry, cost line, tuition line, history milestone,
student-life item, transport note, climate metric, place, coordinates) carries a
`factId` pointing into `facts`. Prices keep the original `value`, `currency` and
`period`; the UI adds an approximate conversion and, for semester/year prices,
a monthly equivalent, both labelled as calculated.

Confidence: `high` = official university source, `medium` = reliable external
source (Wikipedia, Wikidata, Numbeo, major outlets), `low` = limited evidence.
`sourceDate: null` is rendered as "Source date unavailable".

## Pipeline

```
Search → Retrieve source → Extract evidence → Validate → Store → (build) → UI
```

`tools/fact-pipeline.mjs` never lets the model answer from memory:

1. **Search** — Claude with the `web_search` server tool; candidate URLs are
   harvested from the tool result blocks, not from prose.
2. **Retrieve** — the page is fetched by Node and reduced to text.
3. **Extract** — Claude returns JSON (structured output) with 1–3 *verbatim*
   quotes per fact, prices in the original currency/period.
4. **Validate** — each quote must occur verbatim in the fetched text, the
   number must appear in a matched quote, prices need currency + period;
   confidence is capped by the source (external domains never get `high`,
   undated prices are demoted).
5. **Store** — accepted facts are appended to `data/research/<id>.json`, then
   `node tools/build-universities.mjs` validates and publishes.

```
cd tools && npm install
ANTHROPIC_API_KEY=… node fact-pipeline.mjs --id UNI-NU --name "Nazarbayev University" \
    --city Astana --domain nu.edu.kz --topic housing
node fact-pipeline.mjs --self-test      # offline test of retrieve → validate
node build-universities.mjs             # merge + validate
```

The current research files were collected on 2026-09-18 with the same
rules (official domain first, evidence quotes, original currency/period,
gaps recorded instead of guesses).

## Runtime data (no API keys in the frontend)

* Map: MapLibre GL + OpenStreetMap raster tiles.
* Distance: Haversine between campus and the city's reference point.
* Travel time: estimate (straight line × 1.3 at typical urban speeds) and,
  when reachable, an OSRM route for car/walking — both labelled approximate.
* Climate: stored Wikipedia values plus, when reachable, last year's
  Open-Meteo archive for the campus coordinates.
* Currency: live `open.er-api.com`, fallback `data/rates.json` (dated).
