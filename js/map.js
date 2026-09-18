(function () {
  'use strict';

  const I18N = {
    kk: {
      fAll: 'Барлығы', fMausoleum: 'Кесене', fMosque: 'Жер асты мешіті', fNecropolis: 'Қорым',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR',
      route: 'Бағыт салу', askGuide: 'Гидтен сұрау',
      loading: 'Нысандар жүктелуде…',
      failed: 'Деректер жүктелмеді. Файлды тексеріңіз: data/objects.geojson',
      empty: 'Бұл сүзгі бойынша нысан жоқ'
    },
    ru: {
      fAll: 'Все', fMausoleum: 'Мавзолеи', fMosque: 'Подземные мечети', fNecropolis: 'Некрополи',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR',
      route: 'Построить маршрут', askGuide: 'Спросить гида',
      loading: 'Загружаем объекты…',
      failed: 'Данные не загрузились. Проверьте файл data/objects.geojson',
      empty: 'По этому фильтру объектов нет'
    }
  };

  let lang = new URLSearchParams(location.search).get('lang') || 'kk';
  let objects = [];       // полные записи из objects.json
  let activeId = null;
  let activeType = 'all';

  const statusEl = document.getElementById('mapStatus');
  const sheet = document.getElementById('sheet');

  function t(key) { return (I18N[lang] || I18N.kk)[key] || key; }

  function setStatus(text) {
    if (!text) { statusEl.hidden = true; return; }
    statusEl.textContent = text;
    statusEl.hidden = false;
  }



  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© OpenStreetMap'
        }
      },
      layers: [
        { id: 'osm', type: 'raster', source: 'osm' }
      ]
    },
    center: [63.0, 47.5],   // центр Казахстана
    zoom: 4.1,
    attributionControl: { compact: true }
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true
  }), 'top-right');

  const COLORS = {
    mausoleum: '#D9A441',
    underground_mosque: '#35B6BE',
    necropolis: '#C9705A',
    other: '#A9B6B8'
  };

  map.on('load', function () {
    setStatus(t('loading'));

    Promise.all([
      fetch('data/objects.geojson').then(function (r) { return r.json(); }),
      fetch('data/objects.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      const geo = res[0];
      objects = res[1].objects || [];

      map.addSource('mura', {
        type: 'geojson',
        data: geo,
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 9
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'mura',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 20, 30],
          'circle-color': '#0B2A31',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#D9A441'
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'mura',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13
        },
        paint: { 'text-color': '#EDE3D1' }
      });

      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'mura',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 12, 8],
          'circle-color': [
            'match', ['get', 'type'],
            'mausoleum', COLORS.mausoleum,
            'underground_mosque', COLORS.underground_mosque,
            'necropolis', COLORS.necropolis,
            COLORS.other
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#0B2A31'
        }
      });

      map.addLayer({
        id: 'labels',
        type: 'symbol',
        source: 'mura',
        filter: ['!', ['has', 'point_count']],
        minzoom: 6,
        layout: {
          'text-field': ['get', lang === 'ru' ? 'name_ru' : 'name_kk'],
          'text-size': 12,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-max-width': 9
        },
        paint: {
          'text-color': '#EDE3D1',
          'text-halo-color': '#0B2A31',
          'text-halo-width': 1.6
        }
      });

      setStatus(null);
      applyFilter(activeType);

      const deepLink = new URLSearchParams(location.search).get('id');
      if (deepLink) openObject(deepLink.toUpperCase(), true);
    }).catch(function (err) {
      console.error(err);
      setStatus(t('failed'));
    });
  });

  map.on('click', 'points', function (e) {
    openObject(e.features[0].properties.id);
  });

  map.on('click', 'clusters', function (e) {
    const feature = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
    map.getSource('mura').getClusterExpansionZoom(feature.properties.cluster_id)
      .then(function (zoom) {
        map.easeTo({ center: feature.geometry.coordinates, zoom: zoom });
      });
  });

  ['points', 'clusters'].forEach(function (layer) {
    map.on('mouseenter', layer, function () { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, function () { map.getCanvas().style.cursor = ''; });
  });

  function openObject(id, fly) {
    const obj = objects.find(function (o) { return o.id === id; });
    if (!obj) return;

    activeId = id;

    document.getElementById('sheetPhoto').src = obj.photo;
    document.getElementById('sheetPhoto').alt = obj.name[lang] || obj.name.ru;
    document.getElementById('sheetMeta').textContent =
      [obj.typeLabel[lang], obj.period[lang]].filter(Boolean).join(' · ');
    document.getElementById('sheetTitle').textContent = obj.name[lang] || obj.name.ru;
    document.getElementById('sheetRegion').textContent = obj.region[lang] || '';

    const text = document.getElementById('sheetText');
    text.innerHTML = '';
    (obj.description[lang] || obj.description.ru || []).forEach(function (para) {
      const p = document.createElement('p');
      p.textContent = para;
      text.appendChild(p);
    });

    document.getElementById('sheetCredit').textContent = 'Фото: ' + (obj.photoCredit || '');

    const c = obj.coordinates;
    document.getElementById('sheetRoute').href =
      'https://2gis.kz/directions/points/|' + c.lng + ',' + c.lat;

    sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });

    if (fly !== false) {
      map.flyTo({ center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 11), duration: 900 });
    }
  }

  function closeSheet() {
    sheet.classList.remove('is-open');
    activeId = null;
    setTimeout(function () { sheet.hidden = true; }, 320);
  }

  document.getElementById('sheetClose').addEventListener('click', closeSheet);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
  });

  document.getElementById('sheetGuide').addEventListener('click', function () {
    if (activeId) location.href = 'guide.html?object=' + activeId + '&lang=' + lang;
  });
   
  function applyFilter(type) {
    activeType = type;
    const base = ['!', ['has', 'point_count']];
    const filter = type === 'all' ? base : ['all', base, ['==', ['get', 'type'], type]];

    if (map.getLayer('points')) map.setFilter('points', filter);
    if (map.getLayer('labels')) map.setFilter('labels', filter);
  }

  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      applyFilter(chip.dataset.type);
    });
  });

  function applyLang(next) {
    if (!I18N[next]) return;
    lang = next;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const value = I18N[lang][el.dataset.i18n];
      if (value) el.textContent = value;
    });

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    if (map.getLayer('labels')) {
      map.setLayoutProperty('labels', 'text-field', ['get', lang === 'ru' ? 'name_ru' : 'name_kk']);
    }

    if (activeId) openObject(activeId, false);
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
  });

  applyLang(lang);
})();
