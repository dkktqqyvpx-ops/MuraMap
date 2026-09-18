(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const QUIET = 4;        
  const PNG_SCALE = 20;  

  const sheet = document.getElementById('sheet');
  const baseInfo = document.getElementById('baseInfo');
  const warn = document.getElementById('warn');

  document.getElementById('printBtn').addEventListener('click', function () {
    window.print();
  });

  const base = MuraQR.isConfigured()
    ? MuraQR.siteBase()
    : new URL('../', location.href).href;

  warn.hidden = MuraQR.isConfigured();
  baseInfo.innerHTML = '';
  baseInfo.append('Коды ведут на: ');
  const code = document.createElement('code');
  code.textContent = base + 'map.html?id=…';
  baseInfo.append(code);

  function showError(text) {
    const box = document.createElement('p');
    box.className = 'error';
    box.textContent = text;
    sheet.appendChild(box);
  }

  if (typeof window.qrcode !== 'function') {
    showError('Библиотека qrcode-generator не загрузилась. Проверьте интернет и обновите страницу.');
    return;
  }

 
  if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }

  function makeMatrix(text) {
   
    const qr = qrcode(0, 'H');
    qr.addData(text);
    qr.make();
    return {
      size: qr.getModuleCount(),
      isDark: function (row, col) { return qr.isDark(row, col); }
    };
  }

  function matrixToSvg(matrix, label) {
    const total = matrix.size + QUIET * 2;
    let path = '';

    for (let row = 0; row < matrix.size; row++) {
      for (let col = 0; col < matrix.size; col++) {
        if (matrix.isDark(row, col)) {
          path += 'M' + (col + QUIET) + ' ' + (row + QUIET) + 'h1v1h-1z';
        }
      }
    }

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + total + ' ' + total);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);

    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', total);
    bg.setAttribute('height', total);
    bg.setAttribute('fill', '#FFFFFF');

    const modules = document.createElementNS(SVG_NS, 'path');
    modules.setAttribute('d', path);
    modules.setAttribute('fill', '#000000');

    svg.append(bg, modules);
    return svg;
  }

  function downloadPng(matrix, id) {
    const qrPx = (matrix.size + QUIET * 2) * PNG_SCALE;
    const textArea = 70;

    const canvas = document.createElement('canvas');
    canvas.width = qrPx;
    canvas.height = qrPx + textArea;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    for (let row = 0; row < matrix.size; row++) {
      for (let col = 0; col < matrix.size; col++) {
        if (matrix.isDark(row, col)) {
          ctx.fillRect((col + QUIET) * PNG_SCALE, (row + QUIET) * PNG_SCALE, PNG_SCALE, PNG_SCALE);
        }
      }
    }

    ctx.fillStyle = '#0B2A31';
    ctx.font = '700 44px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(id, qrPx / 2, qrPx + textArea / 2 - 10);

    canvas.toBlob(function (blob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = id.toLowerCase() + '.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    }, 'image/png');
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderCard(obj) {
    const id = obj.qr || obj.id;
    const url = MuraQR.buildUrl(id, base);
    const matrix = makeMatrix(url);
    const nameKk = (obj.name && obj.name.kk) || id;
    const nameRu = (obj.name && obj.name.ru) || '';

    const wrap = el('div', 'card-wrap');
    const card = el('article', 'card');

    const qrBox = el('div', 'card__qr');
    qrBox.appendChild(matrixToSvg(matrix, 'QR: ' + nameKk));

    card.append(
      el('p', 'card__brand', 'MuraMap'),
      qrBox,
      el('p', 'card__code', id),
      el('h2', 'card__name', nameKk),
      el('p', 'card__name-ru', nameRu),
      el('p', 'card__call', 'Нысан туралы білу үшін сканерлеңіз · Отсканируйте, чтобы узнать об объекте')
    );

    const urlLine = el('p', 'card__url no-print', url);

    const pngBtn = el('button', 'png-btn no-print', 'Скачать PNG');
    pngBtn.type = 'button';
    pngBtn.addEventListener('click', function () { downloadPng(matrix, id); });

    wrap.append(card, urlLine, pngBtn);
    return wrap;
  }

  fetch('../data/objects.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      const objects = data.objects || [];
      if (!objects.length) {
        showError('В data/objects.json нет объектов.');
        return;
      }
      objects.forEach(function (obj) {
        if (!MuraQR.ID_RE.test(obj.qr || obj.id)) {
          console.warn('Пропущен объект с неверным кодом:', obj.id);
          return;
        }
        sheet.appendChild(renderCard(obj));
      });
    })
    .catch(function (err) {
      console.error(err);
      showError('Не удалось загрузить data/objects.json. Откройте страницу через локальный сервер (Live Server), а не двойным кликом.');
    });
})();
