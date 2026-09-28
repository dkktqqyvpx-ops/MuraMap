(function () {
  'use strict';

  const I18N = {
    kk: {
      install: 'Қолданбаны орнату',
      later: 'Кейін',
      update: 'Жаңа нұсқа дайын',
      refresh: 'Жаңарту',
      offline: 'Интернет жоқ — сақталған деректер көрсетілуде'
    },
    ru: {
      install: 'Установить приложение',
      later: 'Позже',
      update: 'Доступна новая версия',
      refresh: 'Обновить',
      offline: 'Нет интернета — показываем сохранённые данные'
    }
  };

  const LANG_KEY = 'mura-lang';
  const HIDE_KEY = 'mura-install-hidden';

  let installEvent = null;

  function lang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (I18N[fromUrl]) return fromUrl;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (I18N[saved]) return saved;
    } catch (e) {}
    return 'kk';
  }

  function t(key) { return (I18N[lang()] || I18N.kk)[key] || key; }

  function toast(text, actionLabel, onAction) {
    const box = document.createElement('div');
    box.className = 'toast';

    const message = document.createElement('span');
    message.className = 'toast__text';
    message.textContent = text;
    box.appendChild(message);

    if (actionLabel) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'toast__action';
      action.textContent = actionLabel;
      action.addEventListener('click', function () {
        box.remove();
        onAction();
      });
      box.appendChild(action);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast__close';
    close.setAttribute('aria-label', t('later'));
    close.textContent = '✕';
    close.addEventListener('click', function () { box.remove(); });
    box.appendChild(close);

    document.body.appendChild(box);
    return box;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (registration) {
        registration.addEventListener('updatefound', function () {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              toast(t('update'), t('refresh'), function () {
                worker.postMessage('skip-waiting');
              });
            }
          });
        });
      }).catch(function (err) {
        console.warn('Service worker:', err);
      });

      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvent = e;

    let hidden = false;
    try { hidden = localStorage.getItem(HIDE_KEY) === '1'; } catch (err) {}
    if (hidden) return;

    const box = toast(t('install'), t('install'), async function () {
      installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
    });

    box.querySelector('.toast__text').remove();
    box.querySelector('.toast__close').addEventListener('click', function () {
      try { localStorage.setItem(HIDE_KEY, '1'); } catch (err) {}
    });
  });

  window.addEventListener('offline', function () {
    toast(t('offline'));
  });
})();
