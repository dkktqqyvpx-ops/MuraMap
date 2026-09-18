

(function () {
  'use strict';

  const I18N = {
    kk: {
      skip: 'Негізгі мазмұнға өту',
      title: 'QR сканер',
      lead: 'Камераны нысан жанындағы QR кодқа бағыттаңыз',
      start: 'Камераны қосу',
      stop: 'Камераны өшіру',
      retry: 'Қайта сканерлеу',
      fromPhoto: 'Суреттен оқу',
      manualLabel: 'Немесе нысан кодын енгізіңіз',
      manualHint: 'Код табличкадағы QR астында жазылған',
      open: 'Ашу',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR', navStudy: 'Оқу',

      idle: 'Камера өшірулі',
      starting: 'Камера қосылуда…',
      scanning: 'QR кодты жақтаудың ішіне орналастырыңыз',
      paused: 'Камера тоқтатылды',
      reading: 'Сурет оқылуда…',
      checking: 'Код тексерілуде…',
      found: 'Табылды: {name}. Картаға өтеміз…',
      foreign: 'Бұл MuraMap коды емес. Нысан жанындағы табличканы сканерлеңіз.',
      unknown: '{id} коды бар нысан базада жоқ',
      badManual: 'Кодты 001 немесе MURA-001 түрінде енгізіңіз',
      photoFail: 'Суреттен QR код табылмады. Кодтың анық түскенін тексеріңіз.',
      denied: 'Камераға рұқсат жоқ. Браузер баптауларынан рұқсат беріңіз немесе суреттен оқыңыз.',
      noCamera: 'Камера табылмады. Суреттен оқып көріңіз.',
      busyCamera: 'Камераны басқа қолданба пайдаланып тұр. Оны жауып, қайталаңыз.',
      needHttps: 'Камера тек https арқылы ашылған сайтта жұмыс істейді.',
      libFailed: 'Сканер жүктелмеді. Интернетті тексеріп, бетті жаңартыңыз.',
      cameraError: 'Камераны қосу мүмкін болмады. Суреттен оқып көріңіз.'
    },
    ru: {
      skip: 'Перейти к содержимому',
      title: 'QR-сканер',
      lead: 'Наведите камеру на QR-код у объекта',
      start: 'Включить камеру',
      stop: 'Выключить камеру',
      retry: 'Сканировать снова',
      fromPhoto: 'Прочитать с фото',
      manualLabel: 'Или введите код объекта',
      manualHint: 'Код написан под QR на табличке',
      open: 'Открыть',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR', navStudy: 'Учёба',

      idle: 'Камера выключена',
      starting: 'Включаем камеру…',
      scanning: 'Поместите QR-код в рамку',
      paused: 'Камера остановлена',
      reading: 'Читаем фото…',
      checking: 'Проверяем код…',
      found: 'Найдено: {name}. Открываем карту…',
      foreign: 'Это не код MuraMap. Отсканируйте табличку у объекта.',
      unknown: 'Объекта с кодом {id} нет в базе',
      badManual: 'Введите код в виде 001 или MURA-001',
      photoFail: 'На фото не найден QR-код. Проверьте, что код чёткий.',
      denied: 'Нет доступа к камере. Разрешите его в настройках браузера или прочитайте код с фото.',
      noCamera: 'Камера не найдена. Попробуйте прочитать код с фото.',
      busyCamera: 'Камеру использует другое приложение. Закройте его и повторите.',
      needHttps: 'Камера работает только на сайте, открытом через https.',
      libFailed: 'Сканер не загрузился. Проверьте интернет и обновите страницу.',
      cameraError: 'Не удалось включить камеру. Попробуйте прочитать код с фото.'
    },
    en: {
      skip: 'Skip to content',
      title: 'QR scanner',
      lead: 'Point the camera at the QR code next to the site',
      start: 'Turn on camera',
      stop: 'Turn off camera',
      retry: 'Scan again',
      fromPhoto: 'Read from photo',
      manualLabel: 'Or enter the site code',
      manualHint: 'The code is printed under the QR on the plaque',
      open: 'Open',
      navGuide: 'Guide', navMap: 'Map', navQr: 'QR', navStudy: 'Study',

      idle: 'Camera is off',
      starting: 'Starting camera…',
      scanning: 'Place the QR code inside the frame',
      paused: 'Camera stopped',
      reading: 'Reading photo…',
      checking: 'Checking code…',
      found: 'Found: {name}. Opening the map…',
      foreign: 'This is not a MuraMap code. Scan the plaque next to the site.',
      unknown: 'No site with code {id} in the database',
      badManual: 'Enter the code as 001 or MURA-001',
      photoFail: 'No QR code found in the photo. Make sure the code is sharp.',
      denied: 'No camera access. Allow it in the browser settings or read the code from a photo.',
      noCamera: 'No camera found. Try reading the code from a photo.',
      busyCamera: 'Another app is using the camera. Close it and try again.',
      needHttps: 'The camera only works on a site opened over https.',
      libFailed: 'The scanner failed to load. Check your connection and reload the page.',
      cameraError: 'Could not start the camera. Try reading the code from a photo.'
    }
  };

  const LANG_KEY = 'mura-lang';
  const REDIRECT_DELAY = 900; 

  let lang = readLang();
  let scanner = null;      
  let state = 'idle';        
  let status = { key: 'idle', vars: {}, tone: '' };
  let objectsPromise = null;

  const frame = document.getElementById('frame');
  const statusEl = document.getElementById('scanStatus');
  const toggleBtn = document.getElementById('scanToggle');
  const photoInput = document.getElementById('photoInput');
  const manualForm = document.getElementById('manualForm');
  const manualInput = document.getElementById('manualInput');

  

  function readLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (I18N[fromUrl]) return fromUrl;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (I18N[saved]) return saved;
    } catch (e) { /* localStorage может быть недоступен */ }
    return 'kk';
  }

  function t(key, vars) {
    let text = (I18N[lang] || I18N.kk)[key] || key;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.replace('{' + name + '}', vars[name]);
    });
    return text;
  }

  function applyLang(next) {
    if (!I18N[next]) return;
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* не страшно */ }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    
    document.querySelectorAll('[data-page]').forEach(function (link) {
      link.href = link.dataset.page + '?lang=' + lang;
    });

    renderStatus();
    renderToggle();
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
  });

  function setStatus(key, vars, tone) {
    status = { key: key, vars: vars || {}, tone: tone || '' };
    renderStatus();
  }

  function renderStatus() {
    statusEl.textContent = t(status.key, status.vars);
    statusEl.dataset.tone = status.tone;
  }

  function setState(next) {
    state = next;
    frame.dataset.state = next;
    renderToggle();
  }

  function renderToggle() {
    const labels = {
      idle: 'start', starting: 'start', scanning: 'stop',
      busy: 'start', found: 'start', error: 'retry'
    };
    toggleBtn.textContent = t(labels[state] || 'start');
    toggleBtn.disabled = state === 'starting' || state === 'busy' || state === 'found';
    toggleBtn.classList.toggle('btn--map', state !== 'scanning');
    toggleBtn.classList.toggle('btn--ghost', state === 'scanning');
  }

  function showError(key, vars) {
    setState('error');
    setStatus(key, vars, 'error');
  }

  function loadObjects() {
    if (!objectsPromise) {
      objectsPromise = fetch('data/objects.json')
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) { return data.objects || []; })
        .catch(function (err) {
          console.warn('objects.json не загрузился:', err);
          objectsPromise = null;
          return null;
        });
    }
    return objectsPromise;
  }

  function getLibrary() {
    const lib = window.__Html5QrcodeLibrary__;
    if (lib && lib.Html5Qrcode) return lib;
    if (window.Html5Qrcode) return window;
    return null;
  }

  function ensureScanner() {
    if (scanner) return scanner;
    const lib = getLibrary();
    if (!lib) return null;

    const options = { verbose: false };
    if (lib.Html5QrcodeSupportedFormats) {
      
      options.formatsToSupport = [lib.Html5QrcodeSupportedFormats.QR_CODE];
    }
    scanner = new lib.Html5Qrcode('reader', options);
    return scanner;
  }

  function classifyError(err) {
    const text = typeof err === 'string'
      ? err
      : [err && err.name, err && err.message].join(' ');
    if (/NotAllowed|Permission|denied/i.test(text)) return 'denied';
    if (/NotFound|DevicesNotFound|Overconstrained|not found/i.test(text)) return 'noCamera';
    if (/NotReadable|TrackStart|Could not start/i.test(text)) return 'busyCamera';
    return 'cameraError';
  }

  async function startCamera() {
    if (state === 'starting' || state === 'scanning') return;

    if (!window.isSecureContext || !navigator.mediaDevices) {
      showError('needHttps');
      return;
    }

    const s = ensureScanner();
    if (!s) {
      showError('libFailed');
      return;
    }

    setState('starting');
    setStatus('starting');

    try {
      await s.start(
        { facingMode: 'environment' },   
        { fps: 10 },                     
        onDecoded,
        function () {  }
      );
      setState('scanning');
      setStatus('scanning');
    } catch (err) {
      console.error('Камера:', err);
      showError(classifyError(err));
    }
  }

  async function stopCamera() {
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        console.warn('Не удалось остановить камеру:', err);
      }
    }
  }

  function onDecoded(text) {
    
    if (state !== 'scanning') return;
    setState('busy');
    setStatus('checking');
    if (navigator.vibrate) navigator.vibrate(60);

    stopCamera().then(function () {
      handleCode(MuraQR.parse(text));
    });
  }

  async function handleCode(result) {
    if (!result.ok) {
      showError('foreign');
      return;
    }

    setState('busy');
    setStatus('checking');

    const objects = await loadObjects();
    let name = result.id;

    if (objects) {
      const obj = objects.find(function (o) { return o.id === result.id; });
      if (!obj) {
        showError('unknown', { id: result.id });
        return;
      }
      name = (obj.name && (obj.name[lang] || obj.name.ru)) || result.id;
    }

    setState('found');
    setStatus('found', { name: name }, 'ok');

    setTimeout(function () {
      location.href = 'map.html?id=' + encodeURIComponent(result.id) + '&lang=' + lang;
    }, REDIRECT_DELAY);
  }

  toggleBtn.addEventListener('click', async function () {
    if (state === 'scanning') {
      await stopCamera();
      setState('idle');
      setStatus('idle');
    } else {
      startCamera();
    }
  });

  photoInput.addEventListener('change', async function () {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;

    const s = ensureScanner();
    if (!s) {
      showError('libFailed');
      return;
    }

    await stopCamera();              
    setState('busy');
    setStatus('reading');

    try {
      const text = await s.scanFile(file, false);
      handleCode(MuraQR.parse(text));
    } catch (err) {
      console.warn('Фото:', err);
      showError('photoFail');
    } finally {
      photoInput.value = '';        
    }
  });

  manualForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = MuraQR.normalizeId(manualInput.value);

    if (!id) {
      showError('badManual');
      manualInput.focus();
      return;
    }

    manualInput.value = id;
    await stopCamera();
    handleCode({ ok: true, id: id });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state === 'scanning') {
      stopCamera();
      setState('idle');
      setStatus('paused');
    }
  });

  window.addEventListener('pagehide', stopCamera);

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      setState('idle');
      setStatus('idle');
    }
  });

  setState('idle');
  setStatus('idle');
  applyLang(lang);
  loadObjects(); 
})();
