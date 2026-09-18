/* Universities list: search + pick two to compare. */
(function () {
  'use strict';

  const C = window.UniCore;
  const t = C.t;
  const el = C.el;
  const pick = C.pick;

  const listEl = document.getElementById('list');
  const statusEl = document.getElementById('status');
  const countEl = document.getElementById('count');
  const input = document.getElementById('q');
  const bar = document.getElementById('comparebar');
  const barText = document.getElementById('compareText');
  const compareBtn = document.getElementById('compareBtn');

  let universities = [];
  let selected = [];

  function setStatus(text) {
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').trim();
  }

  function haystack(u) {
    const parts = [];
    ['name', 'shortName', 'city', 'country'].forEach(function (k) {
      const f = u[k] || {};
      C.LANGS.forEach(function (l) { parts.push(f[l]); });
    });
    (u.aliases || []).forEach(function (a) { parts.push(a); });
    return norm(parts.join(' '));
  }

  function matches(u, q) {
    if (!q) return true;
    const h = haystack(u);
    return q.split(/\s+/).every(function (w) { return h.indexOf(w) >= 0; });
  }

  function cheapestHousing(u) {
    return C.bestConfident(u, u.housing, function (h) {
      const m = C.monthlyEquivalent(h.value, h.period);
      return m ? m.value : null;
    }) || C.bestConfident(u, u.housing, function (h) { return h.value; });
  }

  function render() {
    const q = norm(input.value);
    listEl.innerHTML = '';
    const shown = universities.filter(function (u) { return matches(u, q); });
    countEl.textContent = t('countUniversities', { n: shown.length });

    if (!shown.length) {
      listEl.appendChild(el('li', 'empty', t('noResults')));
    }

    shown.forEach(function (u) {
      const li = el('li');
      const card = el('article', 'ucard');

      const check = el('input', 'ucard__check');
      check.type = 'checkbox';
      check.dataset.id = u.id;
      check.checked = selected.indexOf(u.id) >= 0;
      check.setAttribute('aria-label', t('compareBtn') + ': ' + pick(u.name));
      check.addEventListener('change', function () { toggle(u.id, check.checked); });
      card.appendChild(check);

      const body = el('div', 'ucard__body');
      body.appendChild(el('p', 'ucard__city', pick(u.city) + ' · ' + pick(u.country)));
      const h3 = el('h2', 'ucard__title');
      const a = el('a', null, pick(u.name));
      a.href = 'university.html?id=' + encodeURIComponent(u.id) + '&lang=' + C.lang;
      h3.appendChild(a);
      body.appendChild(h3);

      const facts = el('ul', 'ucard__facts');
      const km = C.haversineKm(u.location, u.cityCenter);
      if (km != null) facts.appendChild(factItem('🏫', t('kmFromCenter', { km: C.fmtNumber(km, 1) })));
      if (u.founded) facts.appendChild(factItem('📅', String(u.founded)));
      const h = cheapestHousing(u);
      if (h) facts.appendChild(factItem('🏠', t('fromPrice', { price: C.fmtMoney(h.item.value, h.item.currency) + ' ' + C.periodLabel(h.item.period) })));
      const yearly = function (x) { return x.period === 'year' ? x.value : null; };
      const tu = C.bestConfident(u, (u.tuition || []).filter(function (x) { return x.level === 'undergraduate'; }), yearly) || C.bestConfident(u, u.tuition, yearly);
      if (tu) facts.appendChild(factItem('🎓', t('fromPrice', { price: C.fmtMoney(tu.item.value, tu.item.currency) + ' ' + t('perYear') })));
      else facts.appendChild(factItem('🎓', t('notVerified')));
      body.appendChild(facts);
      card.appendChild(body);

      const open = el('a', 'btn btn--ghost ucard__open', t('openProfile'));
      open.href = a.href;
      card.appendChild(open);

      li.appendChild(card);
      listEl.appendChild(li);
    });

    renderBar();
  }

  function factItem(icon, text) {
    const li = el('li');
    li.appendChild(el('span', null, icon + ' '));
    li.appendChild(el('strong', null, text));
    return li;
  }

  function toggle(id, on) {
    if (on) {
      if (selected.indexOf(id) === -1) selected.push(id);
      if (selected.length > 2) selected.shift();
    } else {
      selected = selected.filter(function (x) { return x !== id; });
    }
    // Sync without re-rendering so keyboard focus stays on the checkbox.
    listEl.querySelectorAll('.ucard__check').forEach(function (box) {
      box.checked = selected.indexOf(box.dataset.id) >= 0;
    });
    renderBar();
  }

  function renderBar() {
    bar.hidden = !universities.length;
    const names = selected.map(function (id) {
      const u = universities.find(function (x) { return x.id === id; });
      return u ? pick(u.shortName || u.name) : id;
    });
    barText.textContent = names.length ? names.join(' ↔ ') : t('compareHint');
    compareBtn.disabled = selected.length !== 2;
  }

  compareBtn.addEventListener('click', function () {
    if (selected.length !== 2) return;
    location.href = 'compare.html?a=' + encodeURIComponent(selected[0]) + '&b=' + encodeURIComponent(selected[1]) + '&lang=' + C.lang;
  });

  input.addEventListener('input', render);

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      C.setLang(btn.dataset.lang);
      render();
    });
  });

  C.setLang(C.lang);
  setStatus(t('loading'));

  C.loadData().then(function (data) {
    universities = data.universities || [];
    setStatus(null);
    render();
  }).catch(function (err) {
    console.error(err);
    setStatus(t('failed'));
  });
})();
