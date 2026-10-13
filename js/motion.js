// ===================== Motion: cascade on load, enter/leave transitions, sticky tab bar =====================
// reduce: animaciones apagadas si Windows lo pide o si la calidad gráfica está en Baja
const ANIM = { last: {}, mq: matchMedia('(prefers-reduced-motion: reduce)'), get reduce() { return { matches: this.mq.matches || document.documentElement.dataset.q === 'low' }; } };
// escalonado de entrada. Antes forzaba un recálculo de página por cada elemento (void offsetWidth dentro del bucle):
// ahora escribe todo junto y, solo si alguno ya estaba animándose, fuerza un único recálculo
const casEnd = e => { const el = e.currentTarget; if (e.target !== el) return; el.classList.remove('cas'); el.style.removeProperty('--i'); el.removeEventListener('animationend', casEnd); };
function cascade(els, max = 26) {
  if (!els.length) return;
  let again = false;
  for (const el of els) if (el.classList.contains('cas')) { el.classList.remove('cas'); again = true; }
  if (again) void els[0].offsetWidth;
  els.forEach((el, i) => { el.style.setProperty('--i', Math.min(i, max)); el.classList.add('cas'); el.addEventListener('animationend', casEnd); });
}
function motion() {
  const m = $('main'); if (!m) return; m.classList.remove('leave'); if (ANIM.reduce.matches) return;
  const k = {
    page: S.tab + ':' + !!S.f,
    list: [S.tab, !!S.f, S.tFilter, S.showEmpty, S.pFilter].join('|'),
    sheet: [S.tab, !!S.f, S.team, S.ttab, S.rosterSort, S.player, S.ptab, PREFS.look, S.fplan, S.fvar].join('|'),
  };
  const L = ANIM.last;
  if (k.page !== L.page) { m.classList.remove('enter'); void m.offsetWidth; m.classList.add('enter'); }
  if (k.list !== L.list) cascade([...m.querySelectorAll('.list-body > .item')].slice(0, 22));
  if (k.sheet !== L.sheet) {
    const sheet = m.querySelector('.sheet') || m;
    cascade([...sheet.querySelectorAll(':scope > .card, :scope > .hero')].slice(0, 6), 6);
    cascade([...sheet.querySelectorAll('table tbody tr')].slice(0, 40));
    cascade([...sheet.querySelectorAll('.fm')]);
    cascade([...sheet.querySelectorAll('.bench .bn')].slice(0, 20));
    cascade([...sheet.querySelectorAll('.pgrid > *, .abil-grid > *')].slice(0, 30));
  }
  ANIM.last = k;
  if (typeof REVEAL !== 'undefined' && REVEAL.size) setTimeout(revealRatings, 450);
}
// play a short exit animation on el, then run fn (the re-render)
function leave(el, fn) {
  if (!el || ANIM.reduce.matches) { fn(); return; }
  el.classList.add('leave'); setTimeout(fn, 130);
}
// wrap renderers so every render can animate what changed (edits inside the same view don't replay the cascade)
for (const name of ['render', 'renderTeams', 'renderPlayers', 'renderFile']) {
  const orig = globalThis[name]; if (typeof orig !== 'function') continue;
  globalThis[name] = function (...a) { const r = orig.apply(this, a); motion(); return r; };
}
// sticky tab bar: show compact undo/save once the big header scrolls away
(() => {
  const bar = $('tabbar'), top = document.querySelector('.top');
  if (bar && top && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => bar.classList.toggle('stuck', !e.isIntersecting), { threshold: 0 }).observe(top);
  const pair = [['mUndo', 'bUndo'], ['mSave', 'bSave']];
  for (const [mini, big] of pair) {
    const a = $(mini), b = $(big); if (!a || !b) continue;
    a.onclick = () => b.click();
    const sync = () => { a.disabled = b.disabled; a.title = b.title || b.textContent; };
    sync(); new MutationObserver(sync).observe(b, { attributes: true, childList: true, characterData: true, subtree: true });
  }
})();

// FLIP: items that stay visible slide from their old place to the new one; new ones fade in
function flipRender(m, fn) {
  const body = () => m.querySelector('.list-body');
  const b0 = body(); if (!b0 || ANIM.reduce.matches) { fn(); return; }
  const r0 = b0.getBoundingClientRect(), before = new Map(), key = el => el.dataset.t || el.dataset.p;
  for (const el of b0.children) { const r = el.getBoundingClientRect(); if (r.bottom < r0.top - 60 || r.top > r0.bottom + 60) continue; if (key(el)) before.set(key(el), r.top - r0.top); }
  fn();
  const b1 = body(); if (!b1) return;
  // primero se leen todas las posiciones y después se anima (leer y escribir mezclado obliga al navegador a recalcular cada vez)
  const r1 = b1.getBoundingClientRect(), vis = [];
  for (const el of b1.children) { const r = el.getBoundingClientRect(); if (r.top > r1.bottom + 40) break; if (r.bottom < r1.top) continue; vis.push([el, r]); }
  let k = 0;
  for (const [el, r] of vis) {
    const id = key(el), y = r.top - r1.top;
    if (id && before.has(id)) {
      let dy = before.get(id) - y; if (Math.abs(dy) < 1) continue; dy = Math.max(-r1.height, Math.min(r1.height, dy));
      el.animate([{ translate: `0 ${dy}px`, zIndex: 1 }, { translate: '0 0', zIndex: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
    } else el.animate([{ opacity: 0, translate: '22px 0', scale: .96 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 380, delay: 80 + Math.min(k++, 16) * 28, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  }
}
// neon "kick" on every keystroke in search boxes
document.addEventListener('input', e => { const el = e.target; if (el.type !== 'search') return; el.classList.remove('kick'); void el.offsetWidth; el.classList.add('kick'); });
document.addEventListener('animationend', e => { if (e.target.classList && e.target.classList.contains('kick') && /neonKick|selKick/.test(e.animationName)) e.target.classList.remove('kick'); });
