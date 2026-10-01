const VERSION = 'mura-v2';
const SHELL = VERSION + '-shell';
const DATA = VERSION + '-data';
const TILES = VERSION + '-tiles';
const VENDOR = VERSION + '-vendor';

const TILE_LIMIT = 400;

const SHELL_FILES = [
  './',
  'index.html',
  'map.html',
  'scan.html',
  'guide.html',
  'routes.html',
  'offline.html',
  'manifest.webmanifest',
  'css/style.css',
  'css/map.css',
  'css/scan.css',
  'css/guide.css',
  'css/routes.css',
  'js/config.js',
  'js/main.js',
  'js/map.js',
  'js/scan.js',
  'js/guide.js',
  'js/routes.js',
  'js/mura-qr.js',
  'js/pwa.js',
  'assets/favicon.svg',
  'assets/logo.svg',
  'assets/hero.jpg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-maskable-512.png',
  'assets/apple-touch-icon.png',
  'assets/objects/mura-001.jpg',
  'assets/objects/mura-002.jpg',
  'assets/objects/mura-003.jpg',
  'assets/objects/mura-004.jpg',
  'assets/objects/mura-005.jpg',
  'assets/objects/mura-006.jpg',
  'assets/objects/mura-007.jpg',
  'assets/objects/mura-008.jpg'
];

const VENDOR_FILES = [
  'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&family=Noto+Serif:wght@500;700&display=swap&subset=cyrillic,cyrillic-ext,latin'
];

const DATA_FILES = [
  'data/objects.json',
  'data/objects.geojson',
  'data/routes.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    const shell = await caches.open(SHELL);
    await Promise.all(SHELL_FILES.map(function (url) {
      return shell.add(new Request(url, { cache: 'reload' })).catch(function () {});
    }));

    const data = await caches.open(DATA);
    await Promise.all(DATA_FILES.map(function (url) {
      return data.add(new Request(url, { cache: 'reload' })).catch(function () {});
    }));

    const vendor = await caches.open(VENDOR);
    await Promise.all(VENDOR_FILES.map(async function (url) {
      try {
        const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (response && response.ok) await vendor.put(url, response.clone());
      } catch (err) {
        try {
          const fallback = await fetch(new Request(url, { mode: 'no-cors' }));
          if (fallback) await vendor.put(url, fallback.clone());
        } catch (err2) {}
      }
    }));

    self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map(function (key) {
      return key.indexOf(VERSION) === 0 ? null : caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('message', function (event) {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map(function (key) {
    return cache.delete(key);
  }));
}

function emptyResponse() {
  return new Response('', { status: 504, statusText: 'Offline' });
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return emptyResponse();
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
      if (limit) trim(cacheName, limit);
    }
    return response;
  } catch (err) {
    return emptyResponse();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request) || await cache.match(request.url);

  const network = fetch(request).then(function (response) {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
    return response;
  }).catch(function () { return null; });

  if (cached) return cached;
  const response = await network;
  return response || emptyResponse();
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const shell = await caches.open(SHELL);
    const name = new URL(request.url).pathname.split('/').pop() || 'index.html';
    const page = await shell.match(name, { ignoreSearch: true });
    if (page) return page;

    const offline = await shell.match('offline.html');
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (sameOrigin && /\/data\/.+\.(json|geojson)$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, DATA));
    return;
  }

  if (sameOrigin) {
    event.respondWith(staleWhileRevalidate(request, SHELL));
    return;
  }

  if (url.hostname.indexOf('tile.openstreetmap.org') !== -1) {
    event.respondWith(cacheFirst(request, TILES, TILE_LIMIT));
    return;
  }

  if (url.hostname.indexOf('cdn.jsdelivr.net') !== -1 ||
      url.hostname.indexOf('fonts.googleapis.com') !== -1 ||
      url.hostname.indexOf('fonts.gstatic.com') !== -1) {
    event.respondWith(cacheFirst(request, VENDOR));
  }
});
