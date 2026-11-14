// 食譜頁互動：食材勾選、一步一步做、計時器。
// 不需要為個別食譜修改這個檔案；它會自動讀取頁面上的清單。
// 沒有 JavaScript 時，頁面仍是完整可讀的一般清單。
(function () {
  'use strict';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- 食材勾選 ---------- */
  var ing = document.querySelector('.block.ingredients');
  if (ing) {
    var items = ing.querySelectorAll('li');
    var count = el('span', 'count');
    ing.querySelector('h2').appendChild(count);
    var hint = el('p', 'hint', '點一下食材，標記為「已備好」。');
    ing.querySelector('h2').insertAdjacentElement('afterend', hint);

    var updateCount = function () {
      var n = ing.querySelectorAll('li.checked').length;
      count.textContent = '已備好 ' + n + ' / ' + items.length;
    };
    var toggle = function (li) {
      li.classList.toggle('checked');
      li.setAttribute('aria-checked', li.classList.contains('checked'));
      updateCount();
    };
    ing.querySelectorAll('ul').forEach(function (ul) { ul.classList.add('checkable'); });
    items.forEach(function (li) {
      li.setAttribute('role', 'checkbox');
      li.setAttribute('aria-checked', 'false');
      li.tabIndex = 0;
      li.addEventListener('click', function () { toggle(li); });
      li.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(li); }
      });
    });
    updateCount();
  }

  /* ---------- 一步一步做 ---------- */
  var block = document.querySelector('.block.steps');
  if (!block) return;
  var list = block.querySelector('ol');
  var steps = Array.prototype.slice.call(list.children);
  if (!steps.length) return;

  var i = 0;              // 目前步驟；等於 steps.length 時顯示完成畫面
  var tick = null;        // 計時器
  var left = 0;

  var cook = el('div', 'cook');
  var lights = el('div', 'cook-lights');
  steps.forEach(function () { lights.appendChild(el('i')); });
  var card = el('div', 'cook-card');
  card.setAttribute('aria-live', 'polite');
  var nav = el('div', 'cook-nav');
  var prev = el('button', 'btn ghost', '← 上一步');
  var next = el('button', 'btn', '下一步 →');
  prev.type = next.type = 'button';
  nav.appendChild(prev);
  nav.appendChild(next);
  cook.appendChild(lights);
  cook.appendChild(card);
  cook.appendChild(nav);
  list.insertAdjacentElement('beforebegin', cook);

  var modeBtn = el('button', 'btn ghost small mode-toggle', '看全部步驟');
  modeBtn.type = 'button';
  block.querySelector('h2').appendChild(modeBtn);
  list.classList.add('is-hidden');

  function fmt(s) {
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function stopTimer() {
    if (tick) { clearInterval(tick); tick = null; }
  }

  function render() {
    stopTimer();
    Array.prototype.forEach.call(lights.children, function (b, k) {
      b.classList.toggle('on', k < i || (k === i && i < steps.length));
    });
    prev.disabled = i === 0;

    if (i >= steps.length) {
      card.innerHTML =
        '<img class="cook-done-img" src="../assets/images/tree.svg" alt="">' +
        '<div class="cook-count">全部完成</div>' +
        '<p class="cook-text">做好了！把燈光調暗、點上蠟燭，聖誕快樂 🎄</p>';
      next.textContent = '再做一次';
      return;
    }

    var li = steps[i];
    next.textContent = i === steps.length - 1 ? '完成 🎄' : '下一步 →';
    card.innerHTML =
      '<div class="cook-icon">' + (li.getAttribute('data-icon') || '👩‍🍳') + '</div>' +
      '<div class="cook-count">第 ' + (i + 1) + ' 步，共 ' + steps.length + ' 步</div>' +
      '<p class="cook-text">' + li.innerHTML + '</p>';

    var secs = parseInt(li.getAttribute('data-timer'), 10);
    if (secs > 0) {
      var t = el('button', 'btn ghost timer', '⏱ 開始計時 ' + fmt(secs));
      t.type = 'button';
      left = secs;
      t.addEventListener('click', function () {
        if (tick) { stopTimer(); t.textContent = '⏱ 繼續 ' + fmt(left); return; }
        if (left <= 0) { left = secs; t.classList.remove('done'); }
        t.textContent = '⏸ 暫停 ' + fmt(left);
        tick = setInterval(function () {
          left -= 1;
          if (left <= 0) {
            stopTimer();
            t.textContent = '🔔 時間到！（點一下重新計時）';
            t.classList.remove('ghost');
            t.classList.add('done');
          } else {
            t.textContent = '⏸ 暫停 ' + fmt(left);
          }
        }, 1000);
      });
      card.appendChild(t);
    }
  }

  prev.addEventListener('click', function () { if (i > 0) { i -= 1; render(); } });
  next.addEventListener('click', function () {
    i = i >= steps.length ? 0 : i + 1;
    render();
  });
  modeBtn.addEventListener('click', function () {
    var showAll = list.classList.toggle('is-hidden') === false;
    cook.classList.toggle('is-hidden', showAll);
    modeBtn.textContent = showAll ? '一步一步做' : '看全部步驟';
    if (showAll) stopTimer();
  });
  document.addEventListener('keydown', function (e) {
    if (cook.classList.contains('is-hidden')) return;
    if (e.target.closest && e.target.closest('.checkable')) return;
    if (e.key === 'ArrowRight') next.click();
    if (e.key === 'ArrowLeft') prev.click();
  });

  render();
})();
