(function () {
  'use strict';

  const I18N = {
    kk: {
      listTitle: 'Бағыттар',
      listLead: 'Бірнеше киелі орынды бір жолға жинақтаған дайын бағыттар',
      back: '← Бағыттар',
      tipsTitle: 'Жолға дайындық',
      open: 'Бағытты ашу',
      onMap: 'Картадан көру',
      stops: 'нүкте',
      loading: 'Жүктелуде…',
      failed: 'Бағыттар жүктелмеді. data/routes.json файлын тексеріңіз.',
      notFound: 'Мұндай бағыт табылмады',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR'
    },
    ru: {
      listTitle: 'Подборки',
      listLead: 'Готовые маршруты, которые связывают несколько сакральных мест',
      back: '← Подборки',
      tipsTitle: 'Подготовка к поездке',
      open: 'Открыть маршрут',
      onMap: 'Показать на карте',
      stops: 'точек',
      loading: 'Загружаем…',
      failed: 'Маршруты не загрузились. Проверьте файл data/routes.json.',
      notFound: 'Такой маршрут не найден',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR'
    }
  };

  const LANG_KEY = 'mura-lang';
  const COLORS = { line: '#D9A441', object: '#35B6BE', stay: '#D9A441', city: '#A9B6B8' };

  let lang = readLang();
  let routes = [];
  let objects = [];
  let map = null;

  const listEl = document.getElementById('routesList');
  const detailEl = document.getElementById('routeDetail');
  const statusEl = document.getElementById('routesStatus');

  function readLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (I18N[fromUrl]) return fromUrl;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (I18N[saved]) return saved;
    } catch (e) {}
    return 'kk';
  }

  function t(key) { return (I18N[lang] || I18N.kk)[key] || key; }
  function pick(field) { return field ? (field[lang] || field.ru || field.kk || '') : ''; }
  function routeId() { return new URLSearchParams(location.search).get('route'); }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function objectById(id) {
    return objects.find(function (o) { return o.id === id; }) || null;
  }

  function stopPoint(stop) {
    if (stop.kind === 'object') {
      const obj = objectById(stop.id);
      if (!obj) return null;
      return {
        kind: 'object',
        id: obj.id,
        name: pick(obj.name),
        type: pick(obj.typeLabel),
        photo: obj.photo,
        lat: obj.coordinates.lat,
        lng: obj.coordinates.lng,
        text: pick(stop.text),
        leg: pick(stop.leg)
      };
    }
    return {
      kind: stop.kind,
      name: pick(stop.name),
      lat: stop.lat,
      lng: stop.lng,
      text: pick(stop.text),
      leg: pick(stop.leg)
    };
  }

  function routePoints(route) {
    const points = [];
    route.days.forEach(function (day) {
      day.stops.forEach(function (stop) {
        const point = stopPoint(stop);
        if (point) points.push(point);
      });
    });
    return points;
  }

  /* ---------- Список ---------- */

  function renderList() {
    listEl.hidden = false;
    detailEl.hidden = true;

    const wrap = document.getElementById('routeCards');
    wrap.innerHTML = '';

    routes.forEach(function (route) {
      const card = el('a', 'card');
      card.href = 'routes.html?route=' + encodeURIComponent(route.slug) + '&lang=' + lang;

      if (route.cover) {
        const img = el('img', 'card__photo');
        img.src = route.cover;
        img.alt = '';
        img.loading = 'lazy';
        card.appendChild(img);
      }

      const body = el('div', 'card__body');
      body.append(
        el('h2', 'card__name', pick(route.name)),
        el('p', 'card__text', pick(route.summary)),
        el('span', 'card__meta', routePoints(route).length + ' ' + t('stops')),
        el('span', 'card__cta', t('open'))
      );

      card.appendChild(body);
      wrap.appendChild(card);
    });
  }

  /* ---------- Маршрут ---------- */

  function renderDetail(route) {
    listEl.hidden = true;
    detailEl.hidden = false;

    document.getElementById('backLink').href = 'routes.html?lang=' + lang;
    document.getElementById('routeTitle').textContent = pick(route.name);
    document.getElementById('routeSummary').textContent = pick(route.summary);
    document.getElementById('routeNote').textContent = pick(route.note);

    const facts = document.getElementById('routeFacts');
    facts.innerHTML = '';
    pick(route.facts).forEach(function (line) {
      facts.appendChild(el('li', 'facts__item', line));
    });

    const intro = document.getElementById('routeIntro');
    intro.innerHTML = '';
    pick(route.intro).forEach(function (para) {
      intro.appendChild(el('p', 'route__para', para));
    });

    const days = document.getElementById('routeDays');
    days.innerHTML = '';
    let number = 0;

    route.days.forEach(function (day) {
      const section = el('section', 'day');
      section.appendChild(el('h2', 'day__title', pick(day.title)));

      day.stops.forEach(function (stop) {
        const point = stopPoint(stop);
        if (!point) return;
        number++;
        section.appendChild(renderStop(point, number));
      });

      days.appendChild(section);
    });

    const tips = document.getElementById('routeTips');
    tips.innerHTML = '';
    pick(route.tips).forEach(function (line) {
      tips.appendChild(el('li', 'tips__item', line));
    });

    drawMap(routePoints(route));
  }

  function renderStop(point, number) {
    const item = el('article', 'stop stop--' + point.kind);

    const badge = el('span', 'stop__number', String(number));
    const body = el('div', 'stop__body');

    if (point.leg) body.appendChild(el('span', 'stop__leg', point.leg));
    body.appendChild(el('h3', 'stop__name', point.name));
    if (point.type) body.appendChild(el('span', 'stop__type', point.type));
    if (point.text) body.appendChild(el('p', 'stop__text', point.text));

    if (point.kind === 'object') {
      const link = el('a', 'stop__link', t('onMap'));
      link.href = 'map.html?id=' + encodeURIComponent(point.id) + '&lang=' + lang;
      body.appendChild(link);
    }

    if (point.photo) {
      const img = el('img', 'stop__photo');
      img.src = point.photo;
      img.alt = '';
      img.loading = 'lazy';
      item.appendChild(img);
    }

    item.append(badge, body);
    return item;
  }

  /* ---------- Карта маршрута ---------- */

  function drawMap(points) {
    if (!window.maplibregl || !points.length) return;
    if (map) { map.remove(); map = null; }

    const coords = points.map(function (p) { return [p.lng, p.lat]; });

    map = new maplibregl.Map({
      container: 'routeMap',
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: coords[0],
      zoom: 6,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.scrollZoom.disable();

    map.on('load', function () {
      map.addSource('route-line', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLORS.line, 'line-width': 3, 'line-dasharray': [2, 1.6] }
      });

      points.forEach(function (point, index) {
        const pin = el('div', 'pin pin--' + point.kind, String(index + 1));
        new maplibregl.Marker({ element: pin })
          .setLngLat([point.lng, point.lat])
          .setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setText(point.name))
          .addTo(map);
      });

      const bounds = coords.reduce(function (acc, c) {
        return acc.extend(c);
      }, new maplibregl.LngLatBounds(coords[0], coords[0]));

      map.fitBounds(bounds, { padding: 50, duration: 0 });
    });
  }

  /* ---------- Язык ---------- */

  function applyLang(next) {
    if (!I18N[next]) return;
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('[data-page]').forEach(function (link) {
      link.href = link.dataset.page + '?lang=' + lang;
    });

    render();
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
  });

  /* ---------- Старт ---------- */

  function render() {
    if (!routes.length) return;
    const slug = routeId();

    if (!slug) {
      statusEl.textContent = '';
      renderList();
      return;
    }

    const route = routes.find(function (r) { return r.slug === slug || r.id === slug; });
    if (!route) {
      statusEl.textContent = t('notFound');
      renderList();
      return;
    }

    statusEl.textContent = '';
    renderDetail(route);
  }

  statusEl.textContent = t('loading');

  Promise.all([
    fetch('data/routes.json').then(function (r) { return r.json(); }),
    fetch('data/objects.json').then(function (r) { return r.json(); })
  ]).then(function (result) {
    routes = result[0].routes || [];
    objects = result[1].objects || [];
    applyLang(lang);
  }).catch(function (err) {
    console.error(err);
    statusEl.textContent = t('failed');
  });
})();
