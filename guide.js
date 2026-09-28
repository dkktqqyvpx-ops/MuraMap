/* ==========================================================================
   MuraMap — чат-бот «Гид»
   1) диалог: отправка вопроса на сервер (server/worker.js), вывод ответа
   2) контекст: объект, о котором идёт речь (?object=MURA-001 или из ответа)
   3) подсказки-вопросы, язык kk / ru, сохранение диалога на время сессии
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Словарь ---------- */

  const I18N = {
    kk: {
      title: 'Гид',
      clear: 'Жаңа сөйлесу',
      about: 'Әңгіме нысаны:',
      contextClear: 'Нысанды алып тастау',
      inputLabel: 'Сұрағыңыз',
      placeholder: 'Мысалы: Жұмағазы хазірет кім?',
      send: 'Жіберу',
      note: 'Гид MuraMap деректері бойынша жауап береді және қателесуі мүмкін.',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR',

      hello: 'Сәлеметсіз бе! Мен MuraMap гидімін. Қазақстанның киелі орындары туралы сұраңыз.',
      helloObject: 'Сәлеметсіз бе! Мен MuraMap гидімін. «{name}» туралы не білгіңіз келеді?',
      showOnMap: 'Картадан көру: {name}',
      typing: 'Гид жауап жазып жатыр',
      you: 'Сіз',
      guide: 'Гид',

      q1: 'Жұмағазы хазірет кім?',
      q2: 'Картада қандай кесенелер бар?',
      q3: 'Киелі жерге барғанда өзін қалай ұстау керек?',
      qo1: '{name} туралы айтып беріңіз',
      qo2: 'Бұл қай ғасырға жатады?',
      qo3: 'Бұл жер қай өңірде орналасқан?',

      notConfigured: 'Чат-бот әлі қосылмаған: js/config.js файлында chatUrl көрсетілмеген.',
      offline: 'Интернет жоқ. Байланысты тексеріп, қайталаңыз.',
      timeout: 'Жауап тым ұзақ күттірді. Қайталап көріңіз.',
      rateLimited: 'Сұрақтар тым көп. Бірнеше минуттан кейін қайталаңыз.',
      failed: 'Гид қазір жауап бере алмады. Сәлден соң қайталаңыз.'
    },
    ru: {
      title: 'Гид',
      clear: 'Новый диалог',
      about: 'Говорим об объекте:',
      contextClear: 'Убрать объект',
      inputLabel: 'Ваш вопрос',
      placeholder: 'Например: кто такой Жумагазы-хазрет?',
      send: 'Отправить',
      note: 'Гид отвечает по данным MuraMap и может ошибаться.',
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR',

      hello: 'Здравствуйте! Я гид MuraMap. Спрашивайте о сакральных местах Казахстана.',
      helloObject: 'Здравствуйте! Я гид MuraMap. Что вы хотите узнать об объекте «{name}»?',
      showOnMap: 'Показать на карте: {name}',
      typing: 'Гид пишет ответ',
      you: 'Вы',
      guide: 'Гид',

      q1: 'Кто такой Жумагазы-хазрет?',
      q2: 'Какие мавзолеи есть на карте?',
      q3: 'Как вести себя в святом месте?',
      qo1: 'Расскажите про {name}',
      qo2: 'К какому веку относится этот объект?',
      qo3: 'В каком регионе он находится?',

      notConfigured: 'Чат-бот ещё не подключён: в js/config.js не указан chatUrl.',
      offline: 'Нет интернета. Проверьте соединение и повторите.',
      timeout: 'Ответ идёт слишком долго. Попробуйте ещё раз.',
      rateLimited: 'Слишком много вопросов. Повторите через несколько минут.',
      failed: 'Гид сейчас не смог ответить. Попробуйте чуть позже.'
    }
  };

  const LANG_KEY = 'mura-lang';
  const CHAT_KEY = 'mura-chat';
  const ID_RE = /^MURA-\d{3,}$/;
  const TIMEOUT = 30000;

  /* ---------- Состояние ---------- */

  const params = new URLSearchParams(location.search);
  let lang = readLang();
  let objects = [];               // из data/objects.json — для названий
  let busy = false;

  const saved = readChat();
  let messages = saved.messages;  // [{ role: 'user'|'assistant', content, objects? }]
  let contextId = saved.contextId;

  const fromUrl = (params.get('object') || '').toUpperCase();
  if (ID_RE.test(fromUrl) && fromUrl !== contextId) {
    // Пришли с карточки другого объекта — начинаем разговор о нём
    contextId = fromUrl;
    messages = [];
  }

  const chat = document.getElementById('chat');
  const suggest = document.getElementById('suggest');
  const form = document.getElementById('composer');
  const input = document.getElementById('question');
  const sendBtn = document.getElementById('sendBtn');
  const contextBox = document.getElementById('context');
  const contextName = document.getElementById('contextName');

  /* ---------- Утилиты ---------- */

  function readLang() {
    const p = new URLSearchParams(location.search).get('lang');
    if (I18N[p]) return p;
    try {
      const s = localStorage.getItem(LANG_KEY);
      if (I18N[s]) return s;
    } catch (e) { /* ничего */ }
    return 'kk';
  }

  function t(key, vars) {
    let text = (I18N[lang] || I18N.kk)[key] || key;
    Object.keys(vars || {}).forEach(function (k) {
      text = text.replace('{' + k + '}', vars[k]);
    });
    return text;
  }

  function readChat() {
    try {
      const data = JSON.parse(sessionStorage.getItem(CHAT_KEY) || 'null');
      if (data && Array.isArray(data.messages)) {
        return { messages: data.messages, contextId: data.contextId || null };
      }
    } catch (e) { /* ничего */ }
    return { messages: [], contextId: null };
  }

  function saveChat() {
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify({
        messages: messages.slice(-30),
        contextId: contextId
      }));
    } catch (e) { /* ничего */ }
  }

  function objectName(id, names) {
    const obj = objects.find(function (o) { return o.id === id; });
    const n = names || (obj && obj.name);
    return (n && (n[lang] || n.ru || n.kk)) || id;
  }

  function mapLink(id) {
    return 'map.html?id=' + encodeURIComponent(id) + '&lang=' + lang;
  }

  // ИИ иногда добавляет разметку Markdown — убираем, показываем простой текст
  function plain(text) {
    return String(text || '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .trim();
  }

  function chatUrl() {
    const url = (window.MURA_CONFIG || {}).chatUrl || '';
    return /^https?:\/\//.test(url) && url.indexOf('USERNAME') === -1 ? url : null;
  }

  /* ---------- Отрисовка ---------- */

  function bubble(role, text, extraClass) {
    const item = document.createElement('div');
    item.className = 'msg msg--' + role + (extraClass ? ' ' + extraClass : '');

    const who = document.createElement('span');
    who.className = 'visually-hidden';
    who.textContent = (role === 'user' ? t('you') : t('guide')) + ': ';

    const body = document.createElement('p');
    body.className = 'msg__text';
    body.textContent = role === 'user' ? text : plain(text);

    item.append(who, body);
    return item;
  }

  function renderMessage(m) {
    const item = bubble(m.role, m.content);
    if (m.role === 'assistant' && Array.isArray(m.objects)) {
      m.objects.forEach(function (o) {
        const link = document.createElement('a');
        link.className = 'msg__link';
        link.href = mapLink(o.id);
        link.textContent = t('showOnMap', { name: objectName(o.id, o.name) });
        item.appendChild(link);
      });
    }
    chat.appendChild(item);
  }

  function renderAll() {
    chat.innerHTML = '';
    const hello = contextId
      ? t('helloObject', { name: objectName(contextId) })
      : t('hello');
    chat.appendChild(bubble('assistant', hello));
    messages.forEach(renderMessage);
    if (typingEl) chat.appendChild(typingEl);   // ответ ещё идёт
    renderSuggestions();
    renderContext();
    scrollDown();
  }

  function renderContext() {
    if (!contextId) {
      contextBox.hidden = true;
      return;
    }
    contextBox.hidden = false;
    contextName.textContent = objectName(contextId);
    contextName.href = mapLink(contextId);
  }

  function renderSuggestions() {
    suggest.innerHTML = '';
    if (messages.length) {
      suggest.hidden = true;
      return;
    }
    suggest.hidden = false;

    const list = contextId
      ? [t('qo1', { name: objectName(contextId) }), t('qo2'), t('qo3')]
      : [t('q1'), t('q2'), t('q3')];

    list.forEach(function (text) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'suggest__btn';
      btn.textContent = text;
      btn.addEventListener('click', function () { ask(text); });
      suggest.appendChild(btn);
    });
  }

  function showNotice(text) {
    chat.appendChild(bubble('assistant', text, 'msg--error'));
    scrollDown();
  }

  let typingEl = null;

  function setTyping(on) {
    if (on && !typingEl) {
      typingEl = document.createElement('div');
      typingEl.className = 'msg msg--assistant msg--typing';
      typingEl.setAttribute('aria-label', t('typing'));
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      chat.appendChild(typingEl);
      scrollDown();
    } else if (!on && typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  function scrollDown() {
    chat.scrollTop = chat.scrollHeight;
  }

  function setBusy(on) {
    busy = on;
    sendBtn.disabled = on;
    suggest.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
  }

  /* ---------- Отправка вопроса ---------- */

  async function ask(text) {
    const question = String(text || '').trim().slice(0, 500);
    if (!question || busy) return;

    const url = chatUrl();
    if (!url) {
      showNotice(t('notConfigured'));
      return;
    }

    const history = messages.map(function (m) {
      return { role: m.role, content: m.content };
    });

    const userMsg = { role: 'user', content: question };
    messages.push(userMsg);
    renderMessage(userMsg);
    renderSuggestions();
    input.value = '';
    autoSize();
    saveChat();

    setBusy(true);
    setTyping(true);

    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, TIMEOUT);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          lang: lang,
          objectId: contextId,
          history: history
        }),
        signal: controller.signal
      });

      if (res.status === 429) throw new Error('rateLimited');
      if (!res.ok) throw new Error('failed');

      const data = await res.json();
      const found = Array.isArray(data.objects) ? data.objects : [];
      const answer = { role: 'assistant', content: String(data.answer || ''), objects: found };

      messages.push(answer);
      setTyping(false);
      renderMessage(answer);

      // Следующие вопросы («а когда его построили?») будут про этот объект
      if (found.length) {
        contextId = found[0].id;
        renderContext();
      }
      saveChat();
    } catch (err) {
      console.error('Гид:', err);
      setTyping(false);
      // Убираем вопрос без ответа, чтобы диалог для ИИ не сломался
      messages.pop();
      saveChat();

      let key = 'failed';
      if (err.name === 'AbortError') key = 'timeout';
      else if (!navigator.onLine) key = 'offline';
      else if (err.message === 'rateLimited') key = 'rateLimited';
      showNotice(t(key));
      input.value = question;
      autoSize();
    } finally {
      clearTimeout(timer);
      setBusy(false);
      scrollDown();
    }
  }

  /* ---------- Поле ввода ---------- */

  function autoSize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  }

  input.addEventListener('input', autoSize);

  // Enter — отправить, Shift+Enter — новая строка
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ask(input.value);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
  });

  /* ---------- Кнопки ---------- */

  document.getElementById('clearChat').addEventListener('click', function () {
    messages = [];
    saveChat();
    renderAll();
    input.focus();
  });

  document.getElementById('contextClose').addEventListener('click', function () {
    contextId = null;
    saveChat();
    renderContext();
    renderSuggestions();
  });

  /* ---------- Язык ---------- */

  function applyLang(next) {
    if (!I18N[next]) return;
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ничего */ }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('[data-page]').forEach(function (link) {
      link.href = link.dataset.page + '?lang=' + lang;
    });

    input.placeholder = t('placeholder');
    renderAll();
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
  });

  /* ---------- Старт ---------- */

  saveChat();
  applyLang(lang);

  fetch('data/objects.json')
    .then(function (r) { return r.ok ? r.json() : { objects: [] }; })
    .then(function (data) {
      objects = data.objects || [];
      renderAll();  // теперь названия объектов известны
    })
    .catch(function (err) { console.warn('objects.json:', err); });
})();
