/* ==========================================================================
   MuraMap — правила QR-кодов
   Общий файл для сканера (scan.html) и страницы печати (tools/qr-print.html).

   В QR зашита ссылка:  https://сайт/map.html?id=MURA-001
   Такую ссылку откроет и обычная камера телефона, и наш сканер.
   ========================================================================== */

(function (global) {
  'use strict';

  // Код объекта: MURA- и минимум три цифры (MURA-001, MURA-015, MURA-1200)
  const ID_RE = /^MURA-\d{3,}$/;

  function config() {
    return global.MURA_CONFIG || {};
  }

  // Адрес сайта указан по-настоящему, а не оставлен шаблон с USERNAME
  function isConfigured() {
    const url = config().siteUrl || '';
    return /^https?:\/\//.test(url) && url.indexOf('USERNAME') === -1;
  }

  function siteBase() {
    if (!isConfigured()) return null;
    const url = config().siteUrl;
    return url.endsWith('/') ? url : url + '/';
  }

  // Ручной ввод: «1», «001», «mura1», «MURA-001» → «MURA-001»
  function normalizeId(value) {
    let v = String(value == null ? '' : value).trim().toUpperCase().replace(/\s+/g, '');
    if (/^\d+$/.test(v)) {
      v = 'MURA-' + v.padStart(3, '0');
    } else if (/^MURA-?\d+$/.test(v)) {
      v = 'MURA-' + v.replace(/^MURA-?/, '').padStart(3, '0');
    }
    return ID_RE.test(v) ? v : null;
  }

  // Ссылка, которая будет зашита в QR
  function buildUrl(id, base) {
    const root = base || siteBase();
    if (!root) throw new Error('В js/config.js не указан siteUrl');
    const url = new URL('map.html', root);
    url.searchParams.set('id', id);
    return url.href;
  }

  // Домены, ссылкам с которых сканер доверяет
  function allowedHosts() {
    const hosts = [];
    if (isConfigured()) hosts.push(new URL(siteBase()).host);
    if (global.location && global.location.host) hosts.push(global.location.host);
    return hosts;
  }

  /* Разбор того, что прочитала камера.
     Возвращает { ok: true, id } или { ok: false }.
     Чужие ссылки не принимаем: на табличку могут наклеить поддельный код. */
  function parse(raw) {
    const text = String(raw == null ? '' : raw).trim();

    // Вариант 1: в коде только идентификатор
    if (ID_RE.test(text.toUpperCase())) {
      return { ok: true, id: text.toUpperCase() };
    }

    // Вариант 2: в коде ссылка на наш сайт
    let url;
    try {
      url = new URL(text);
    } catch (e) {
      return { ok: false };
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false };
    if (allowedHosts().indexOf(url.host) === -1) return { ok: false };
    if (!/\/map(\.html)?$/.test(url.pathname)) return { ok: false };

    const id = (url.searchParams.get('id') || '').toUpperCase();
    return ID_RE.test(id) ? { ok: true, id: id } : { ok: false };
  }

  global.MuraQR = {
    ID_RE: ID_RE,
    isConfigured: isConfigured,
    siteBase: siteBase,
    normalizeId: normalizeId,
    buildUrl: buildUrl,
    parse: parse
  };
})(typeof window !== 'undefined' ? window : globalThis);
