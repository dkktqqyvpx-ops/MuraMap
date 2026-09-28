/* ==========================================================================
   MuraMap — логика интерфейса
   1) меню (шторка): открытие, закрытие, Esc, клик по фону, ловушка фокуса
   2) переключение языка kk / ru
   3) нижние табы
   4) фолбэк для картинки героя
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Словарь ---------- */

  const I18N = {
    kk: {
      skip:        'Негізгі мазмұнға өту',
      menuOpen:    'Мәзірді ашу',
      menuClose:   'Мәзірді жабу',
      drawerTitle: 'Аккаунт және тіл',
      signIn:      'Кіру',
      signUp:      'Тіркелу',
      routes:      'Бағыттар',
      langLabel:   'Тіл',
      heroLead:    'Қазақстанның киелі орындары бір картада',
      heroAlt:     'Қожа Ахмет Яссауи кесенесі, Түркістан',
      heroFallback:'Киелі мұра',
      openMap:     'Картаны ашу',
      navGuide:    'Гид',
      navMap:      'Карта',
      navQr:       'QR'
    },
    ru: {
      skip:        'Перейти к содержимому',
      menuOpen:    'Открыть меню',
      menuClose:   'Закрыть меню',
      drawerTitle: 'Аккаунт и язык',
      signIn:      'Войти',
      signUp:      'Регистрация',
      routes:      'Подборки',
      langLabel:   'Язык',
      heroLead:    'Сакральные места Казахстана на одной карте',
      heroAlt:     'Мавзолей Ходжи Ахмеда Ясави, Туркестан',
      heroFallback:'Наследие',
      openMap:     'Открыть карту',
      navGuide:    'Гид',
      navMap:      'Карта',
      navQr:       'QR'
    }
  };

  let lang = 'kk';

  function applyLang(next) {
    if (!I18N[next]) return;
    lang = next;
    const dict = I18N[lang];

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const value = dict[el.dataset.i18n];
      if (value) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      const value = dict[el.dataset.i18nAria];
      if (value) el.setAttribute('aria-label', value);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      const value = dict[el.dataset.i18nAlt];
      if (value) el.alt = value;
    });

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    // Кнопка «Мәзірді ашу / жабу» зависит от состояния меню
    syncBurgerLabel();
  }

  /* ---------- Меню ---------- */

  const burger = document.getElementById('menuButton');
  const drawer = document.getElementById('menu');
  const scrim  = document.getElementById('scrim');
  const closeBtn = document.getElementById('menuClose');

  const FOCUSABLE = 'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  function isOpen() {
    return drawer.classList.contains('is-open');
  }

  function syncBurgerLabel() {
    const dict = I18N[lang];
    burger.setAttribute('aria-label', isOpen() ? dict.menuClose : dict.menuOpen);
  }

  function openMenu() {
    lastFocused = document.activeElement;

    drawer.hidden = false;
    scrim.hidden = false;
    // Перерисовка кадра нужна, чтобы сработал transition после снятия hidden
    requestAnimationFrame(function () {
      drawer.classList.add('is-open');
      scrim.classList.add('is-open');
    });

    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    syncBurgerLabel();

    const first = drawer.querySelector(FOCUSABLE);
    if (first) first.focus();
  }

  function closeMenu() {
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    syncBurgerLabel();

    const hide = function () {
      drawer.hidden = true;
      scrim.hidden = true;
      drawer.removeEventListener('transitionend', hide);
    };
    drawer.addEventListener('transitionend', hide);
    setTimeout(hide, 400); // страховка, если transitionend не придёт

    if (lastFocused) lastFocused.focus();
  }

  burger.addEventListener('click', function () {
    isOpen() ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);
  scrim.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      closeMenu();
      return;
    }

    if (e.key === 'Tab') {
      const items = Array.prototype.slice.call(drawer.querySelectorAll(FOCUSABLE));
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- Язык ---------- */

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLang(btn.dataset.lang);
    });
  });

  /* ---------- Кнопки аккаунта ---------- */

  drawer.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Здесь позже подключается экран авторизации
      console.log('action:', btn.dataset.action);
      closeMenu();
    });
  });

  /* ---------- Табы ---------- */

  const ROUTES = {
    guide: 'guide.html',
    map: 'map.html',
    qr: 'scan.html'
  };

  const tabs = document.querySelectorAll('.tab');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = ROUTES[tab.dataset.tab];
      if (target) location.href = target + '?lang=' + lang;
    });
  });

  document.getElementById('openMap').addEventListener('click', function () {
    location.href = ROUTES.map + '?lang=' + lang;
  });

  /* ---------- Картинка героя ---------- */

  const heroImage = document.getElementById('heroImage');
  const heroFallback = document.getElementById('heroFallback');

  function showFallback() {
    heroImage.hidden = true;
    heroFallback.hidden = false;
  }

  if (!heroImage.getAttribute('src')) {
    showFallback();
  } else {
    heroImage.addEventListener('error', showFallback);
    if (heroImage.complete && heroImage.naturalWidth === 0) showFallback();
  }

  /* ---------- Старт ---------- */

  applyLang(lang);
})();
