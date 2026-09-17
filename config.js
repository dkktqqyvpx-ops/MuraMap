/* ==========================================================================
   MuraMap — настройки сайта

   siteUrl — адрес сайта на GitHub Pages (со слешем в конце).
   Из него строятся ссылки внутри QR-кодов, и по нему сканер проверяет,
   что код «наш». Проверь, что здесь именно твой адрес.

   chatUrl — адрес сервера чат-бота (Cloudflare Worker, server/worker.js).
   ========================================================================== */

window.MURA_CONFIG = {
  siteUrl: 'https://nurdaulet-malikov.github.io/MuraMap/',
  chatUrl: 'https://muramap-guide.nurdaulet-malikov.workers.dev/'
};
