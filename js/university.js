/*
 * University profile page.
 * Renders every section from data/universities.json; each value is shown with
 * the VerifiedFact it comes from, and calculated values are labelled as such.
 */
(function () {
  'use strict';

  const C = window.UniCore;
  const t = C.t;
  const el = C.el;
  const pick = C.pick;

  const params = new URLSearchParams(location.search);
  const id = (params.get('id') || '').toUpperCase();

  const statusEl = document.getElementById('status');
  const profileEl = document.getElementById('profile');

  let uni = null;
  let rates = null;
  let map = null;
  let markers = [];
  let live = { climate: null, route: null };

  function setStatus(text) {
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  /* ------------------------------------------------------------------ glance */

  const ICONS = {
    location: '📍', campus: '🏫', housing: '🏠', budget: '💰', tuition: '🎓', transport: '🚌', founded: '📅'
  };

  function tile(kind, label, value, sub, fact, calculated) {
    const box = el('div', 'tile');
    box.appendChild(el('span', 'tile__icon', ICONS[kind]));
    box.appendChild(el('span', 'tile__label', label));
    box.appendChild(el('strong', 'tile__value', value));
    if (sub) box.appendChild(el('span', 'tile__sub', sub));
    const badge = el('span', 'tile__badge');
    if (calculated) {
      badge.classList.add('badge', 'badge--estimate');
      badge.textContent = t('conf_estimate');
    } else if (fact) {
      badge.classList.add('badge', 'badge--' + fact.confidence);
      badge.textContent = t('conf_' + fact.confidence).split(' · ')[0];
    } else {
      badge.classList.add('badge', 'badge--low');
      badge.textContent = t('notVerified');
    }
    box.appendChild(badge);
    return box;
  }

  function centerKm() {
    return C.haversineKm(uni.location, uni.cityCenter);
  }

  function cheapestHousing() {
    const monthly = C.bestConfident(uni, uni.housing, function (h) {
      const m = C.monthlyEquivalent(h.value, h.period);
      return m ? m.value : null;
    });
    // No monthly-convertible price (e.g. only a daily rate): fall back to any priced entry.
    return monthly || C.bestConfident(uni, uni.housing, function (h) { return h.value; });
  }

  /* Several sources may publish a monthly total; prefer the official one, then KZT. */
  function bestTotal(items) {
    const totals = items.filter(function (i) { return i.category === 'total' && i.period === 'month'; });
    if (!totals.length) return null;
    totals.sort(function (x, y) {
      const fx = C.factOf(uni, x.factId) || {}, fy = C.factOf(uni, y.factId) || {};
      const rx = (fx.sourceKind === 'official' ? 0 : 1) * 10 + (C.CONF_RANK[fx.confidence] == null ? 3 : C.CONF_RANK[fx.confidence]) + (x.currency === 'KZT' ? 0 : 0.5);
      const ry = (fy.sourceKind === 'official' ? 0 : 1) * 10 + (C.CONF_RANK[fy.confidence] == null ? 3 : C.CONF_RANK[fy.confidence]) + (y.currency === 'KZT' ? 0 : 0.5);
      return rx - ry;
    });
    return totals[0];
  }

  function budgetTotal() {
    const items = uni.costOfLiving || [];
    const sourced = bestTotal(items);
    if (sourced) return { value: sourced.value, currency: sourced.currency, fact: C.factOf(uni, sourced.factId), note: sourced.note, calculated: false };

    const monthly = items.filter(function (i) { return i.period === 'month' && i.category !== 'total'; });
    if (!monthly.length) return null;
    const currency = monthly[0].currency;
    if (monthly.some(function (i) { return i.currency !== currency; })) return null;

    const housing = monthly.find(function (i) { return i.category === 'dormitory'; }) ||
      monthly.find(function (i) { return i.category === 'accommodation'; });
    const parts = monthly.filter(function (i) {
      return i.category !== 'dormitory' && i.category !== 'accommodation';
    });
    if (housing) parts.push(housing);
    const sum = parts.reduce(function (s, i) { return s + (i.value || 0); }, 0);
    return { value: sum, currency: currency, parts: parts, calculated: true };
  }

  /* "From …/year" means degree tuition: undergraduate first, then any yearly fee. */
  function cheapestTuition() {
    const yearly = function (x) { return x.period === 'year' ? x.value : null; };
    const ug = (uni.tuition || []).filter(function (x) { return x.level === 'undergraduate'; });
    return C.bestConfident(uni, ug, yearly) || C.bestConfident(uni, uni.tuition, yearly);
  }

  function foundedFact() {
    const f = (uni.facts || []).find(function (x) { return x.type === 'founded'; });
    if (f) return f;
    const h = (uni.history || []).slice().sort(function (a, b) { return a.year - b.year; })[0];
    return h ? C.factOf(uni, h.factId) : null;
  }

  function renderGlance() {
    const box = document.getElementById('glance');
    box.innerHTML = '';

    box.appendChild(tile('location', t('glLocation'),
      pick(uni.city) + ', ' + pick(uni.country), pick(uni.location.address), C.factOf(uni, uni.location.factId)));

    const km = centerKm();
    box.appendChild(tile('campus', t('glCampus'),
      km == null ? t('noData') : t('kmFromCenter', { km: C.fmtNumber(km, 1) }),
      pick(uni.campus && uni.campus.name), null, km != null));

    const h = cheapestHousing();
    if (h) {
      const m = C.monthlyEquivalent(h.item.value, h.item.period);
      const sub = (h.item.period === 'month' || !m) ? pick(h.item.name)
        : '≈ ' + C.fmtMoney(m.value, h.item.currency) + ' ' + t('perMonth') + ' (' + t('calculated') + ')';
      box.appendChild(tile('housing', t('glHousing'),
        t('fromPrice', { price: C.fmtMoney(h.item.value, h.item.currency) + ' ' + C.periodLabel(h.item.period) }),
        sub, C.factOf(uni, h.item.factId)));
    } else {
      box.appendChild(tile('housing', t('glHousing'), t('notVerified'), null, null));
    }

    const b = budgetTotal();
    if (b) {
      const conv = C.convert(b.value, b.currency, rates);
      box.appendChild(tile('budget', t('glBudget'),
        '~' + C.fmtMoney(b.value, b.currency) + ' ' + t('perMonth'),
        conv ? '≈ ' + C.fmtMoney(conv.value, conv.currency) + ' ' + t('perMonth') : null,
        b.fact, b.calculated));
    } else {
      box.appendChild(tile('budget', t('glBudget'), t('notVerified'), null, null));
    }

    const tu = cheapestTuition();
    if (tu) {
      const many = (uni.tuition || []).length > 1;
      box.appendChild(tile('tuition', t('glTuition'),
        t('fromPrice', { price: C.fmtMoney(tu.item.value, tu.item.currency) + ' ' + t('perYear') }),
        [t('lvl_' + tu.item.level), many ? t('programSpecific') : '', tu.item.academicYear || ''].filter(Boolean).join(' · '),
        C.factOf(uni, tu.item.factId)));
    } else if ((uni.tuition || []).length) {
      const any = uni.tuition[0];
      box.appendChild(tile('tuition', t('glTuition'),
        C.fmtMoney(any.value, any.currency) + ' ' + C.periodLabel(any.period),
        t('programSpecific'), C.factOf(uni, any.factId)));
    } else {
      box.appendChild(tile('tuition', t('glTuition'), t('notVerified'), null, null));
    }

    const est = C.travelEstimates(km);
    box.appendChild(tile('transport', t('glTransport'),
      est ? t('minToCenter', { min: live.route ? live.route.minutes : est.carMin }) : t('noData'),
      est ? t('byCar') : null, null, true));

    const ff = foundedFact();
    box.appendChild(tile('founded', t('glFounded'), uni.founded ? String(uni.founded) : t('notVerified'), null, ff));
  }

  /* ------------------------------------------------------------------ gallery */

  function renderGallery() {
    const sec = document.getElementById('gallerySec');
    const box = document.getElementById('gallery');
    box.innerHTML = '';
    const images = Array.isArray(uni.images) ? uni.images.filter(function (i) { return i.url && i.sourceUrl; }) : [];
    sec.hidden = !images.length;
    images.forEach(function (img) {
      const fig = el('figure', 'gallery__item');
      const im = el('img');
      im.src = img.url;
      im.alt = pick(img.caption) || pick(uni.name);
      im.loading = 'lazy';
      fig.appendChild(im);
      const cap = el('figcaption');
      cap.appendChild(el('span', null, pick(img.caption) || ''));
      const a = el('a', 'prov__link', img.sourceDomain || img.sourceUrl);
      a.href = img.sourceUrl; a.target = '_blank'; a.rel = 'noopener nofollow';
      cap.appendChild(a);
      fig.appendChild(cap);
      box.appendChild(fig);
    });
  }

  /* ------------------------------------------------------------------ map */

  const KIND_LEGEND = {
    university: 'legUniversity', city_center: 'legCityCenter', dormitory: 'legDormitory', library: 'legLibrary',
    building: 'legBuilding', sports: 'legSports', transit: 'legTransit', airport: 'legAirport', rail: 'legRail', bus_station: 'legBusStation'
  };
  const KIND_GLYPH = {
    university: '🎓', city_center: '📍', dormitory: '🏠', library: '📚', building: '🏛', sports: '🏟', transit: '🚌', airport: '✈', rail: '🚆', bus_station: '🚍'
  };

  function points() {
    const list = [
      { kind: 'university', name: uni.name, lat: uni.location.lat, lng: uni.location.lng, factId: uni.location.factId },
      { kind: 'city_center', name: uni.cityCenter.label, lat: uni.cityCenter.lat, lng: uni.cityCenter.lng, factId: uni.cityCenter.factId }
    ];
    (uni.places || []).forEach(function (p) {
      if (C.hasCoords(p)) list.push(p);
    });
    return list;
  }

  function ensureMap() {
    if (map || typeof maplibregl === 'undefined') return;
    map = new maplibregl.Map({
      container: 'umap',
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [uni.location.lng, uni.location.lat],
      zoom: 12,
      attributionControl: { compact: true },
      cooperativeGestures: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', function () {
      map.addSource('center-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[uni.location.lng, uni.location.lat], [uni.cityCenter.lng, uni.cityCenter.lat]]
          }
        }
      });
      map.addLayer({
        id: 'center-line',
        type: 'line',
        source: 'center-line',
        paint: { 'line-color': '#35B6BE', 'line-width': 2, 'line-dasharray': [2, 2] }
      });
      renderMarkers();
      fitMap();
    });
  }

  function fitMap() {
    const pts = points().filter(function (p) { return p.kind !== 'airport' && p.kind !== 'rail' && p.kind !== 'bus_station'; });
    const b = new maplibregl.LngLatBounds();
    pts.forEach(function (p) { b.extend([p.lng, p.lat]); });
    map.fitBounds(b, { padding: 56, maxZoom: 14, duration: 0 });
  }

  function renderMarkers() {
    markers.forEach(function (m) { m.remove(); });
    markers = [];
    if (!map) return;
    points().forEach(function (p) {
      const node = el('button', 'mk mk--' + p.kind);
      node.type = 'button';
      node.textContent = KIND_GLYPH[p.kind] || '•';
      node.setAttribute('aria-label', pick(p.name));
      const fact = C.factOf(uni, p.factId);
      const html = '<strong>' + escapeHtml(pick(p.name)) + '</strong><br><span>' + escapeHtml(t(KIND_LEGEND[p.kind] || 'legBuilding')) + '</span>' +
        (p.kind !== 'university' ? '<br><span class="mk__dist">' + escapeHtml(C.fmtNumber(C.haversineKm(uni.location, p), 1) + ' km') + '</span>' : '') +
        (fact && fact.sourceDomain ? '<br><a href="' + escapeHtml(fact.sourceUrl) + '" target="_blank" rel="noopener nofollow">' + escapeHtml(fact.sourceDomain) + '</a>' : '');
      const marker = new maplibregl.Marker({ element: node, anchor: 'center' })
        .setLngLat([p.lng, p.lat])
        .setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(html))
        .addTo(map);
      markers.push(marker);
    });
    renderLegend();
  }

  function renderLegend() {
    const box = document.getElementById('legend');
    box.innerHTML = '';
    const kinds = [];
    points().forEach(function (p) { if (kinds.indexOf(p.kind) === -1) kinds.push(p.kind); });
    kinds.forEach(function (k) {
      const li = el('li', 'legend__item');
      li.appendChild(el('span', 'mk mk--mini mk--' + k, KIND_GLYPH[k]));
      li.appendChild(el('span', null, t(KIND_LEGEND[k] || 'legBuilding')));
      box.appendChild(li);
    });
    const attr = el('li', 'legend__item legend__item--attr', t('mapAttribution'));
    box.appendChild(attr);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------ distance */

  function renderDistance() {
    const box = document.getElementById('distance');
    box.innerHTML = '';
    const km = centerKm();
    if (km == null) { box.appendChild(el('p', 'empty', t('noData'))); return; }
    const est = C.travelEstimates(km);

    const card = el('div', 'dist');
    const head = el('div', 'dist__head');
    head.appendChild(el('span', 'dist__icon', '📍'));
    const hb = el('div');
    hb.appendChild(el('span', 'dist__label', t('distToCenter')));
    hb.appendChild(el('strong', 'dist__value', C.fmtNumber(km, 1) + ' km'));
    hb.appendChild(el('span', 'dist__sub', t('straightLine') +
      (live.route ? ' · ' + C.fmtNumber(live.route.km, 1) + ' km ' + t('roadDistance') : '')));
    head.appendChild(hb);
    card.appendChild(head);

    const rows = el('div', 'dist__rows');
    rows.appendChild(distRow('🚗', t('byCar'), '~' + (live.route ? live.route.minutes : est.carMin) + ' ' + minLabel()));
    rows.appendChild(distRow('🚌', t('byTransit'), '~' + est.transitMin[0] + '–' + est.transitMin[1] + ' ' + minLabel()));
    rows.appendChild(distRow('🚶', t('walking'), '~' + (live.walk ? live.walk.minutes : est.walkMin) + ' ' + minLabel()));
    card.appendChild(rows);

    card.appendChild(el('p', 'dist__note', (live.route ? t('travelRouted') : t('travelNote'))));

    const ref = el('div', 'dist__ref');
    ref.appendChild(el('span', null, t('cityCenterRef') + ': ' + pick(uni.cityCenter.label)));
    ref.appendChild(C.sourceLine(C.factOf(uni, uni.cityCenter.factId)));
    card.appendChild(ref);
    box.appendChild(card);
  }

  function minLabel() { return { kk: 'мин', ru: 'мин', en: 'min' }[C.lang]; }

  function distRow(icon, label, value) {
    const r = el('div', 'dist__row');
    r.appendChild(el('span', 'dist__ricon', icon));
    r.appendChild(el('span', 'dist__rlabel', label));
    r.appendChild(el('strong', 'dist__rvalue', value));
    return r;
  }

  function fetchRoutes() {
    if (!uni.location || !uni.cityCenter) return;
    C.osrmRoute(uni.location, uni.cityCenter, 'driving').then(function (r) {
      if (r) { live.route = r; renderDistance(); renderGlance(); }
    });
    C.osrmRoute(uni.location, uni.cityCenter, 'foot').then(function (r) {
      if (r) { live.walk = r; renderDistance(); }
    });
  }

  /* ------------------------------------------------------------------ housing */

  function renderHousing() {
    const box = document.getElementById('housing');
    box.innerHTML = '';
    const list = uni.housing || [];
    if (!list.length) { box.appendChild(el('p', 'empty', t('noHousing'))); return; }

    list.forEach(function (h) {
      const card = el('article', 'card');
      card.appendChild(el('h3', 'card__title', pick(h.name)));
      if (h.value != null) card.appendChild(C.priceNode(h.value, h.currency, h.period, rates, { monthly: true }));
      const meta = el('p', 'card__meta');
      const bits = [];
      if (h.roomType && pick(h.roomType)) bits.push(t('roomType') + ': ' + pick(h.roomType));
      const km = housingDistance(h);
      if (km != null) bits.push(t('distFromCampus', { km: C.fmtNumber(km, 1) }));
      meta.textContent = bits.join(' · ');
      if (bits.length) card.appendChild(meta);
      if (Array.isArray(h.facilities) && h.facilities.length) {
        const chips = el('ul', 'chips');
        h.facilities.forEach(function (f) {
          const key = 'fac_' + f;
          chips.appendChild(el('li', 'chips__item', C.I18N[C.lang][key] ? t(key) : f));
        });
        card.appendChild(chips);
      }
      if (h.note && pick(h.note)) card.appendChild(el('p', 'card__note', pick(h.note)));
      card.appendChild(C.sourceLine(C.factOf(uni, h.factId), { evidence: true }));
      box.appendChild(card);
    });
  }

  function housingDistance(h) {
    if (h.distanceKm != null) return h.distanceKm;
    const place = (uni.places || []).find(function (p) { return p.id === h.placeId && C.hasCoords(p); });
    return place ? C.haversineKm(uni.location, place) : null;
  }

  /* ------------------------------------------------------------------ cost of living */

  function renderCost() {
    const box = document.getElementById('cost');
    box.innerHTML = '';
    const all = uni.costOfLiving || [];
    const items = all.filter(function (i) { return i.category !== 'total'; });
    const totals = all.filter(function (i) { return i.category === 'total'; });
    const total = totals.length ? null : budgetTotal();
    if (!items.length && !totals.length && !total) { box.appendChild(el('p', 'empty', t('noCost'))); return; }

    const table = el('div', 'budget');
    table.appendChild(el('h3', 'budget__title', t('budgetTitle')));
    items.forEach(function (i) {
      const row = el('div', 'budget__row');
      row.appendChild(el('div', 'budget__cat', t('cat_' + i.category)));
      row.appendChild(C.priceNode(i.value, i.currency, i.period, rates));
      if (i.note && pick(i.note)) row.appendChild(el('p', 'row__note', pick(i.note)));
      row.appendChild(C.sourceLine(C.factOf(uni, i.factId)));
      table.appendChild(row);
    });
    totals.forEach(function (i) {
      const row = el('div', 'budget__row budget__row--total');
      row.appendChild(el('div', 'budget__cat', t('cat_total')));
      row.appendChild(C.priceNode(i.value, i.currency, i.period, rates));
      if (i.note && pick(i.note)) row.appendChild(el('p', 'row__note', pick(i.note)));
      row.appendChild(C.sourceLine(C.factOf(uni, i.factId), { evidence: true }));
      table.appendChild(row);
    });
    if (total) {
      const row = el('div', 'budget__row budget__row--total');
      row.appendChild(el('div', 'budget__cat', t('cat_total')));
      row.appendChild(C.priceNode(total.value, total.currency, 'month', rates));
      if (total.calculated) {
        const n = el('div', 'prov');
        n.appendChild(el('span', 'badge badge--estimate', t('conf_estimate')));
        n.appendChild(el('span', 'prov__dates', t('sumNote') + ' (' + total.parts.map(function (p) { return t('cat_' + p.category); }).join(' + ') + ')'));
        row.appendChild(n);
      } else {
        const n = C.sourceLine(total.fact);
        n.appendChild(el('span', 'prov__dates', t('totalSourced')));
        row.appendChild(n);
      }
      table.appendChild(row);
    }
    box.appendChild(table);
  }

  /* ------------------------------------------------------------------ tuition */

  function renderTuition() {
    const box = document.getElementById('tuition');
    box.innerHTML = '';
    const list = uni.tuition || [];
    if (!list.length) { box.appendChild(el('p', 'empty empty--strong', t('noTuition'))); return; }
    if (list.length > 1) box.appendChild(el('p', 'sec__note', t('tuitionNote')));

    const table = el('div', 'tuition');
    list.forEach(function (x) {
      const row = el('div', 'tuition__row');
      row.appendChild(el('strong', 'tuition__what', t('lvl_' + x.level)));
      const bits = [];
      if (x.program && pick(x.program)) bits.push(pick(x.program));
      if (x.audience) bits.push(t('aud_' + x.audience));
      if (x.academicYear) bits.push(t('academicYear') + ' ' + x.academicYear);
      const price = C.priceNode(x.value, x.currency, x.period, rates);
      if (x.alt) price.appendChild(el('span', 'price__equiv', '= ' + C.fmtMoney(x.alt.value, x.alt.currency) + ' ' + C.periodLabel(x.period) + ' (' + t('viewSource').toLowerCase() + ')'));
      row.appendChild(price);
      if (bits.length) row.appendChild(el('p', 'row__note', bits.join(' · ')));
      row.appendChild(C.sourceLine(C.factOf(uni, x.factId), { evidence: true }));
      table.appendChild(row);
    });
    box.appendChild(table);
  }

  /* ------------------------------------------------------------------ student life */

  function renderLife() {
    const box = document.getElementById('life');
    box.innerHTML = '';
    const list = uni.studentLife || [];
    if (!list.length) { box.appendChild(el('p', 'empty', t('noLife'))); return; }
    list.forEach(function (item) {
      const card = el('article', 'card card--life');
      card.appendChild(el('h3', 'card__title', t('life_' + item.category)));
      card.appendChild(el('p', 'card__text', pick(item.text)));
      card.appendChild(C.sourceLine(C.factOf(uni, item.factId), { evidence: true }));
      box.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------ history */

  function renderHistory() {
    const box = document.getElementById('history');
    box.innerHTML = '';
    const list = (uni.history || []).slice().sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
    if (!list.length) { box.appendChild(el('li', 'empty', t('noHistory'))); return; }
    list.forEach(function (h, i) {
      const li = el('li', 'timeline__item' + (i === list.length - 1 ? ' timeline__item--last' : ''));
      li.appendChild(el('span', 'timeline__year', h.year ? String(h.year) : t('today')));
      const body = el('div', 'timeline__body');
      body.appendChild(el('strong', null, pick(h.title)));
      if (h.text && pick(h.text)) body.appendChild(el('p', null, pick(h.text)));
      body.appendChild(C.sourceLine(C.factOf(uni, h.factId), { evidence: true }));
      li.appendChild(body);
      box.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ transport */

  function renderTransport() {
    const box = document.getElementById('transport');
    box.innerHTML = '';
    const list = uni.transport || [];
    const hubs = (uni.places || []).filter(function (p) {
      return ['airport', 'rail', 'bus_station', 'transit'].indexOf(p.kind) >= 0 && C.hasCoords(p);
    });
    if (!list.length && !hubs.length) { box.appendChild(el('p', 'empty', t('noTransport'))); return; }

    if (hubs.length) {
      const ul = el('ul', 'hubs');
      hubs.forEach(function (p) {
        const km = C.haversineKm(uni.location, p);
        const est = C.travelEstimates(km);
        const li = el('li', 'hubs__item');
        li.appendChild(el('span', 'mk mk--mini mk--' + p.kind, KIND_GLYPH[p.kind]));
        const body = el('div');
        body.appendChild(el('strong', null, t('distanceTo', { name: pick(p.name), km: C.fmtNumber(km, 1), min: est.carMin })));
        body.appendChild(C.sourceLine(C.factOf(uni, p.factId)));
        li.appendChild(body);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      box.appendChild(el('p', 'sec__note', t('transportApprox')));
    }

    list.forEach(function (item) {
      const card = el('article', 'card card--row');
      card.appendChild(el('span', 'card__kind', (KIND_GLYPH[item.kind] || '🚌') + ' ' + t('tr_' + item.kind)));
      card.appendChild(el('p', 'card__text', pick(item.text)));
      card.appendChild(C.sourceLine(C.factOf(uni, item.factId), { evidence: true }));
      box.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------ climate */

  function renderClimate() {
    const box = document.getElementById('climate');
    box.innerHTML = '';
    const list = uni.climate || [];
    if (!list.length && !live.climate) { box.appendChild(el('p', 'empty', t('noClimate'))); }

    if (list.length) {
      const grid = el('div', 'climate');
      list.forEach(function (c) {
        const item = el('div', 'climate__item');
        item.appendChild(el('span', 'climate__label', t('cl_' + c.metric)));
        const val = c.unit === 'text' ? pick(c.text) : (C.fmtNumber(c.value, 1) + ' ' + c.unit);
        item.appendChild(el('strong', 'climate__value', val));
        if (c.unit !== 'text' && c.text && pick(c.text)) item.appendChild(el('span', 'climate__sub', pick(c.text)));
        item.appendChild(C.sourceLine(C.factOf(uni, c.factId)));
        grid.appendChild(item);
      });
      box.appendChild(grid);
    }

    const liveBox = el('div', 'climate climate--live');
    if (live.climate) {
      const L = live.climate;
      [['liveYear', L.annual, '°C'], ['liveJan', L.jan, '°C'], ['liveJul', L.jul, '°C'], ['livePrecip', L.precip, 'mm']].forEach(function (r) {
        const item = el('div', 'climate__item');
        item.appendChild(el('span', 'climate__label', t(r[0])));
        item.appendChild(el('strong', 'climate__value', C.fmtNumber(r[1], r[2] === 'mm' ? 0 : 1) + ' ' + r[2]));
        liveBox.appendChild(item);
      });
      const note = el('p', 'sec__note', t('liveClimate', { year: L.year }) + ' · ');
      const a = el('a', 'prov__link', 'open-meteo.com');
      a.href = 'https://open-meteo.com/en/docs/historical-weather-api'; a.target = '_blank'; a.rel = 'noopener';
      note.appendChild(a);
      box.appendChild(liveBox);
      box.appendChild(note);
    } else if (live.climate === false) {
      box.appendChild(el('p', 'sec__note', t('climateUnavailable')));
    }
  }

  function fetchClimate() {
    const year = new Date().getFullYear() - 1;
    const url = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + uni.location.lat + '&longitude=' + uni.location.lng +
      '&start_date=' + year + '-01-01&end_date=' + year + '-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=auto';
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 8000);
    fetch(url, { signal: ctrl.signal })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        const days = d && d.daily && d.daily.time;
        if (!days || !days.length) throw new Error('no data');
        const temps = d.daily.temperature_2m_mean;
        const prec = d.daily.precipitation_sum;
        const acc = { all: [], jan: [], jul: [], precip: 0 };
        days.forEach(function (day, i) {
          const tv = temps[i];
          if (tv != null) {
            acc.all.push(tv);
            const m = day.slice(5, 7);
            if (m === '01') acc.jan.push(tv);
            if (m === '07') acc.jul.push(tv);
          }
          if (prec[i] != null) acc.precip += prec[i];
        });
        const mean = function (a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; };
        live.climate = { year: year, annual: mean(acc.all), jan: mean(acc.jan), jul: mean(acc.jul), precip: acc.precip };
      })
      .catch(function () { live.climate = false; })
      .finally(function () { clearTimeout(timer); renderClimate(); });
  }

  /* ------------------------------------------------------------------ sources */

  function renderSources() {
    const box = document.getElementById('sources');
    box.innerHTML = '';
    const byUrl = {};
    (uni.facts || []).forEach(function (f) {
      if (!f.sourceUrl) return;
      const key = f.sourceUrl;
      if (!byUrl[key]) byUrl[key] = { fact: f, count: 0, types: [] };
      byUrl[key].count++;
      if (byUrl[key].types.indexOf(f.type) === -1) byUrl[key].types.push(f.type);
      const rank = { high: 0, medium: 1, low: 2 };
      if (rank[f.confidence] < rank[byUrl[key].fact.confidence]) byUrl[key].fact = f;
    });
    Object.keys(byUrl).sort(function (a, b) {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[byUrl[a].fact.confidence] - rank[byUrl[b].fact.confidence] || byUrl[b].count - byUrl[a].count;
    }).forEach(function (url) {
      const s = byUrl[url];
      const li = el('li', 'sources__item');
      const a = el('a', 'sources__link', s.fact.sourceTitle || s.fact.sourceDomain || url);
      a.href = url; a.target = '_blank'; a.rel = 'noopener nofollow';
      li.appendChild(a);
      li.appendChild(el('span', 'sources__meta', (s.fact.sourceDomain || '') + ' · ' + s.types.join(', ') + ' · ×' + s.count));
      li.appendChild(C.sourceLine(s.fact));
      box.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ hero + all */

  function renderHero() {
    document.title = 'MuraMap — ' + pick(uni.shortName || uni.name);
    document.getElementById('heroCity').textContent = pick(uni.city) + ' · ' + pick(uni.country);
    document.getElementById('heroTitle').textContent = pick(uni.name);
    const campus = document.getElementById('heroCampus');
    const parts = [];
    if (uni.campus && pick(uni.campus.name)) parts.push(t('campusNote') + ': ' + pick(uni.campus.name));
    if (uni.campus && uni.campus.multiCampus) parts.push(t('multiCampus'));
    if (uni.campus && uni.campus.note && pick(uni.campus.note)) parts.push(pick(uni.campus.note));
    campus.textContent = parts.join(' ');
    const site = document.getElementById('heroSite');
    site.href = uni.website || '#';
    site.hidden = !uni.website;
    document.getElementById('heroGuide').href = 'guide.html?university=' + encodeURIComponent(uni.id) + '&lang=' + C.lang;
  }

  function renderAll() {
    renderHero();
    renderGlance();
    renderGallery();
    ensureMap();
    if (map && map.loaded()) renderMarkers();
    renderDistance();
    renderHousing();
    renderCost();
    renderTuition();
    renderLife();
    renderHistory();
    renderTransport();
    renderClimate();
    renderSources();
  }

  function applyLang(next) {
    C.setLang(next);
    if (uni) renderAll();
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
  });

  C.setLang(C.lang);
  setStatus(t('loading'));

  Promise.all([C.loadData(), C.loadRates()]).then(function (res) {
    rates = res[1];
    uni = (res[0].universities || []).find(function (u) { return u.id === id; });
    if (!uni) { setStatus(t('notFound')); return; }
    setStatus(null);
    profileEl.hidden = false;
    renderAll();
    fetchRoutes();
    fetchClimate();
  }).catch(function (err) {
    console.error(err);
    setStatus(t('failed'));
  });
})();
