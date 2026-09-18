/* Side-by-side comparison of two universities. Facts only, no ranking. */
(function () {
  'use strict';

  const C = window.UniCore;
  const t = C.t;
  const el = C.el;
  const pick = C.pick;

  const params = new URLSearchParams(location.search);
  const selA = document.getElementById('pickA');
  const selB = document.getElementById('pickB');
  const box = document.getElementById('cmp');
  const statusEl = document.getElementById('status');

  let universities = [];
  let rates = null;
  let a = (params.get('a') || '').toUpperCase();
  let b = (params.get('b') || '').toUpperCase();

  function setStatus(text) {
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  function fillSelects() {
    [selA, selB].forEach(function (sel) {
      sel.innerHTML = '';
      universities.forEach(function (u) {
        const o = el('option', null, pick(u.shortName || u.name) + ' — ' + pick(u.city));
        o.value = u.id;
        sel.appendChild(o);
      });
    });
    if (!universities.some(function (u) { return u.id === a; })) a = universities[0] ? universities[0].id : '';
    if (!universities.some(function (u) { return u.id === b; }) || b === a) {
      const other = universities.find(function (u) { return u.id !== a; });
      b = other ? other.id : '';
    }
    selA.value = a;
    selB.value = b;
  }

  function get(id) { return universities.find(function (u) { return u.id === id; }); }

  function confBadge(fact, calculated) {
    const badge = el('span', 'badge');
    if (calculated) { badge.classList.add('badge--estimate'); badge.textContent = t('conf_estimate'); }
    else if (fact) { badge.classList.add('badge--' + fact.confidence); badge.textContent = t('conf_' + fact.confidence).split(' · ')[0]; }
    else { badge.classList.add('badge--low'); badge.textContent = t('notVerified'); }
    return badge;
  }

  function cell(nodes) {
    const c = el('div', 'cmp__cell');
    (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (n) { if (n) c.appendChild(n); });
    return c;
  }

  function row(label, cellA, cellB) {
    const r = el('div', 'cmp__row');
    r.appendChild(el('div', 'cmp__label', label));
    r.appendChild(cellA);
    r.appendChild(cellB);
    return r;
  }

  function none() { return cell(el('small', null, t('noData'))); }

  /* ---- per-row builders (each returns a cell for one university) */

  function locationCell(u) {
    return cell([el('strong', null, pick(u.city) + ', ' + pick(u.country)), el('small', null, pick(u.location.address)), confBadge(C.factOf(u, u.location.factId))]);
  }

  function distanceCell(u) {
    const km = C.haversineKm(u.location, u.cityCenter);
    if (km == null) return none();
    const est = C.travelEstimates(km);
    return cell([el('strong', null, C.fmtNumber(km, 1) + ' km'), el('small', null, '🚗 ~' + est.carMin + ' · 🚌 ~' + est.transitMin[0] + '–' + est.transitMin[1] + ' · 🚶 ~' + est.walkMin), confBadge(null, true)]);
  }

  function housingCell(u) {
    const h = C.bestConfident(u, u.housing, function (x) { const m = C.monthlyEquivalent(x.value, x.period); return m ? m.value : null; }) ||
      C.bestConfident(u, u.housing, function (x) { return x.value; });
    if (!h) return none();
    const nodes = [el('strong', null, t('fromPrice', { price: C.fmtMoney(h.item.value, h.item.currency) + ' ' + C.periodLabel(h.item.period) })), el('small', null, pick(h.item.name))];
    const conv = C.convert(h.item.value, h.item.currency, rates);
    if (conv) nodes.push(el('small', null, '≈ ' + C.fmtMoney(conv.value, conv.currency) + ' ' + C.periodLabel(h.item.period)));
    nodes.push(confBadge(C.factOf(u, h.item.factId)));
    return cell(nodes);
  }

  function tuitionCell(u) {
    const list = u.tuition || [];
    if (!list.length) return cell([el('small', null, t('noTuition')), confBadge(null)]);
    const yearly = function (x) { return x.period === 'year' ? x.value : null; };
    const tu = C.bestConfident(u, list.filter(function (x) { return x.level === 'undergraduate'; }), yearly) || C.bestConfident(u, list, yearly) || { item: list[0] };
    const nodes = [el('strong', null, t('fromPrice', { price: C.fmtMoney(tu.item.value, tu.item.currency) + ' ' + C.periodLabel(tu.item.period) }))];
    nodes.push(el('small', null, [t('lvl_' + tu.item.level), tu.item.academicYear, list.length > 1 ? t('programSpecific') : ''].filter(Boolean).join(' · ')));
    const conv = C.convert(tu.item.value, tu.item.currency, rates);
    if (conv) nodes.push(el('small', null, '≈ ' + C.fmtMoney(conv.value, conv.currency) + ' ' + C.periodLabel(tu.item.period)));
    nodes.push(confBadge(C.factOf(u, tu.item.factId)));
    return cell(nodes);
  }

  function budgetCell(u) {
    const items = u.costOfLiving || [];
    const totals = items.filter(function (i) { return i.category === 'total'; }).sort(function (x, y) {
      const fx = C.factOf(u, x.factId) || {}, fy = C.factOf(u, y.factId) || {};
      return ((fx.sourceKind === 'official' ? 0 : 10) + (C.CONF_RANK[fx.confidence] == null ? 3 : C.CONF_RANK[fx.confidence])) -
        ((fy.sourceKind === 'official' ? 0 : 10) + (C.CONF_RANK[fy.confidence] == null ? 3 : C.CONF_RANK[fy.confidence]));
    });
    const total = totals[0];
    if (total) {
      const nodes = [el('strong', null, '~' + C.fmtMoney(total.value, total.currency) + ' ' + t('perMonth'))];
      if (total.note && pick(total.note)) nodes.push(el('small', null, pick(total.note)));
      nodes.push(confBadge(C.factOf(u, total.factId)));
      return cell(nodes);
    }
    const monthly = items.filter(function (i) { return i.period === 'month'; });
    if (!monthly.length) return none();
    const list = el('small');
    list.textContent = monthly.map(function (i) { return t('cat_' + i.category) + ' ' + C.fmtMoney(i.value, i.currency); }).join(' · ');
    return cell([list, confBadge(C.factOf(u, monthly[0].factId))]);
  }

  function lifeCell(u) {
    const cats = [];
    (u.studentLife || []).forEach(function (s) { if (cats.indexOf(s.category) === -1) cats.push(s.category); });
    if (!cats.length) return none();
    const ul = el('ul', 'chips');
    cats.forEach(function (c) { ul.appendChild(el('li', 'chips__item', t('life_' + c))); });
    return cell(ul);
  }

  function climateCell(u) {
    const list = u.climate || [];
    const get = function (m) { return list.find(function (c) { return c.metric === m; }); };
    const jan = get('avg_jan_temp'), jul = get('avg_jul_temp'), pr = get('annual_precipitation_mm');
    if (!jan && !jul && !pr) return none();
    const nodes = [];
    if (jan) nodes.push(el('small', null, t('cl_avg_jan_temp') + ': ' + C.fmtNumber(jan.value, 1) + ' °C'));
    if (jul) nodes.push(el('small', null, t('cl_avg_jul_temp') + ': ' + C.fmtNumber(jul.value, 1) + ' °C'));
    if (pr) nodes.push(el('small', null, t('cl_annual_precipitation_mm') + ': ' + C.fmtNumber(pr.value, 0) + ' mm'));
    nodes.push(confBadge(C.factOf(u, (jan || jul || pr).factId)));
    return cell(nodes);
  }

  function airportCell(u) {
    const ap = (u.places || []).find(function (p) { return p.kind === 'airport' && C.hasCoords(p); });
    if (!ap) return none();
    const km = C.haversineKm(u.location, ap);
    const est = C.travelEstimates(km);
    return cell([el('strong', null, C.fmtNumber(km, 1) + ' km'), el('small', null, pick(ap.name) + ' · 🚗 ~' + est.carMin), confBadge(null, true)]);
  }

  function foundedCell(u) {
    if (!u.founded) return none();
    const f = (u.facts || []).find(function (x) { return x.type === 'founded'; });
    return cell([el('strong', null, String(u.founded)), confBadge(f || null)]);
  }

  function imagesCell(u) {
    const imgs = (u.images || []).filter(function (i) { return i.url; }).slice(0, 2);
    if (!imgs.length) return null;
    const wrap = el('div', 'cmp__images');
    imgs.forEach(function (i) { const im = el('img'); im.src = i.url; im.alt = pick(i.caption) || pick(u.name); im.loading = 'lazy'; wrap.appendChild(im); });
    return cell(wrap);
  }

  function render() {
    const A = get(a), B = get(b);
    box.innerHTML = '';
    if (!A || !B) { box.hidden = true; return; }
    box.hidden = false;

    const head = el('div', 'cmp__head');
    head.appendChild(el('div'));
    [A, B].forEach(function (u) {
      const h = el('div');
      const link = el('a', null, pick(u.name));
      link.href = 'university.html?id=' + encodeURIComponent(u.id) + '&lang=' + C.lang;
      link.style.color = 'inherit';
      h.appendChild(link);
      head.appendChild(h);
    });
    box.appendChild(head);

    const rows = [
      ['cmp_location', locationCell],
      ['cmp_distance', distanceCell],
      ['cmp_housing', housingCell],
      ['cmp_tuition', tuitionCell],
      ['cmp_budget', budgetCell],
      ['cmp_life', lifeCell],
      ['cmp_climate', climateCell],
      ['cmp_transport', airportCell],
      ['cmp_founded', foundedCell]
    ];
    rows.forEach(function (r) { box.appendChild(row(t(r[0]), r[1](A), r[1](B))); });

    const ia = imagesCell(A), ib = imagesCell(B);
    if (ia || ib) box.appendChild(row(t('secGallery'), ia || none(), ib || none()));

    const u = new URL(location.href);
    u.searchParams.set('a', a); u.searchParams.set('b', b); u.searchParams.set('lang', C.lang);
    history.replaceState(null, '', u.pathname.split('/').pop() + u.search);
  }

  selA.addEventListener('change', function () { a = selA.value; if (b === a) { b = (universities.find(function (u) { return u.id !== a; }) || {}).id; selB.value = b; } render(); });
  selB.addEventListener('change', function () { b = selB.value; if (a === b) { a = (universities.find(function (u) { return u.id !== b; }) || {}).id; selA.value = a; } render(); });

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      C.setLang(btn.dataset.lang);
      fillSelects();
      render();
    });
  });

  C.setLang(C.lang);
  setStatus(t('loading'));

  Promise.all([C.loadData(), C.loadRates()]).then(function (res) {
    universities = res[0].universities || [];
    rates = res[1];
    setStatus(null);
    fillSelects();
    render();
  }).catch(function (err) {
    console.error(err);
    setStatus(t('failed'));
  });
})();
