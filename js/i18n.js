// ===================== Idioma: español (original) o inglés =====================
// El editor está escrito en español. En inglés no se toca el código de cada pantalla: se traduce lo que aparece
// en la página (textos, títulos, placeholders) con el diccionario de js/i18n-en.js, que se carga solo si hace falta.
// {x} en el diccionario es una parte que cambia (un número, un nombre); en la traducción {1}, {2}… permiten cambiar el orden.
const LANGS = { es: 'Español', en: 'English' };
const LANG = (() => { try { const l = localStorage.getItem('edit21-lang'); return LANGS[l] ? l : 'es'; } catch { return 'es'; } })();
document.documentElement.lang = LANG;
if (LANG !== 'es') document.write('<script src="js/i18n-' + LANG + '.js"><\/script>');

const I18N = { dict: null, pats: [], cache: new Map(), seen: new WeakMap() };
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nTxt = s => s.replace(/\s+/g, ' ').trim();
function i18nInit() {
  if (I18N.dict || LANG === 'es' || typeof I18N_EN === 'undefined') return !!I18N.dict;
  I18N.dict = new Map(); I18N.lower = new Map();
  for (const [k, v] of Object.entries(I18N_EN)) {
    if (!v || k === v) continue;
    if (!k.includes('{x}')) { I18N.dict.set(k, v); if (k.length > 3) I18N.lower.set(k.toLowerCase(), v); continue; }
    const lits = k.split('{x}'), longest = lits.reduce((a, b) => (b.length > a.length ? b : a), '');
    if (longest.replace(/[\s·.,:;()]/g, '').length < 2) continue; // sin texto fijo suficiente: atraparía cualquier cosa
    I18N.pats.push({ re: new RegExp('^' + lits.map(escRe).join('(.*?)') + '$', 's'), longest, v, lit: lits.join('').length });
  }
  I18N.pats.sort((a, b) => b.longest.length - a.longest.length); // los más específicos primero
  return true;
}
function trCore(s) {
  const d = I18N.dict, ex = d.get(s) ?? I18N.lower.get(s.toLowerCase()); if (ex != null) return ex;
  for (const p of I18N.pats) {
    if (!s.includes(p.longest) || p.lit < s.length * .3) continue; // el texto fijo tiene que ser buena parte de la frase
    const m = p.re.exec(s); if (!m) continue;
    const caps = m.slice(1).map(c => (c === 'es' ? 's' : c && /[a-záéíóúñ]/i.test(c) ? tr(c) : c)); // "jugador" + "es" → "player" + "s"
    let i = 0; return p.v.replace(/\{(x|\d+)\}/g, (_, k) => (k === 'x' ? caps[i++] ?? '' : caps[+k - 1] ?? ''));
  }
  // frases armadas con " · ": se traduce cada parte
  if (s.includes(' · ')) { const parts = s.split(' · '), t = parts.map(x => tr(x)); if (t.some((x, k) => x !== parts[k])) return t.join(' · '); }
  // la barra de texto de PES 6: "Novedad v0.030: …"
  const nv = s.match(/^Novedad (v[\d.]+): (.+)$/); if (nv) return 'New in ' + nv[1] + ': ' + tr(nv[2]);
  // "Inglaterra (45)": se traduce lo de antes del número entre paréntesis
  const cnt = s.match(/^(.+?) (\(\d[\d.,]*\))$/); if (cnt) { const t = tr(cnt[1]); if (t !== cnt[1]) return t + ' ' + cnt[2]; }
  // "del 13 oct 2026 · 09:55." (fecha de la versión)
  const dl = s.match(/^del (\d{1,2} \w{3} \d{4}.*)$/); if (dl) return 'from ' + tr(dl[1]);
  // fechas cortas: "13 oct 2026"
  if (/\b\d{1,2} (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/.test(s)) return s.replace(/\b(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/g, (_, d, mo) => d + ' ' + { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' }[mo]);
  return null;
}
// traduce un texto; si no está en el diccionario queda igual
function tr(s) {
  if (LANG === 'es' || s == null || !i18nInit()) return s;
  const str = String(s), core = nTxt(str); if (!core || !/[a-záéíóúñ¿¡]/i.test(core)) return str;
  let out = I18N.cache.get(core);
  if (out === undefined) { out = trCore(core); I18N.cache.set(core, out); }
  if (out == null) return str;
  const lead = str.match(/^\s*/)[0], trail = str.match(/\s*$/)[0];
  return lead + out + trail;
}
const I18N_ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'label', 'data-tip'];
const I18N_SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
function trNode(n) {
  if (n.nodeType === 3) {
    const p = n.parentNode; if (!p || I18N_SKIP.has(p.nodeName) || (p.closest && p.closest('[data-noi18n]'))) return;
    if (I18N.seen.get(n) === n.data) return;
    const t = tr(n.data); if (t !== n.data) n.data = t; I18N.seen.set(n, n.data); return;
  }
  if (n.nodeType !== 1 || I18N_SKIP.has(n.nodeName) || n.hasAttribute('data-noi18n')) return;
  for (const a of I18N_ATTRS) { const v = n.getAttribute(a); if (v) { const t = tr(v); if (t !== v) n.setAttribute(a, t); } }
  if (n.nodeName === 'INPUT' && (n.type === 'button' || n.type === 'submit') && n.value) n.value = tr(n.value);
  for (let c = n.firstChild; c; c = c.nextSibling) trNode(c);
}
function i18nStart() {
  if (LANG === 'es' || !i18nInit()) return;
  trNode(document.body); document.title = tr(document.title);
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(trNode);
      else if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') { const v = m.target.getAttribute(m.attributeName); if (v) { const t = tr(v); if (t !== v) m.target.setAttribute(m.attributeName, t); } }
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
  // los cuadros del navegador también
  for (const k of ['alert', 'confirm', 'prompt']) { const f = window[k].bind(window); window[k] = (msg, ...r) => f(tr(msg), ...r); }
}

// ---- selector de idioma, al lado de Recargar: muestra la bandera del idioma elegido ----
const FLAG_SVG = {
  es: '<svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true"><rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/></svg>',
  en: '<svg viewBox="0 0 60 30" width="22" height="15" aria-hidden="true"><clipPath id="ukc"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 60,30M60,0 0,30" clip-path="url(#ukc)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg>'
};
// con cambios sin guardar, el EDIT pasa al caché (vuelve solo al recargar, con Deshacer) y la recarga no se frena
async function setLang(l) {
  try { localStorage.setItem('edit21-lang', l); } catch { }
  if (typeof sessSave === 'function' && typeof pending === 'function' && pending() && await sessSave()) UNLOAD_OK = true;
  location.reload();
}
function langPicker() {
  const ref = document.getElementById('bReload'); if (!ref || document.getElementById('bLang')) return;
  const w = document.createElement('div'); w.className = 'langpick';
  w.innerHTML = `<button class="btn" id="bLang" type="button" aria-haspopup="true" aria-expanded="false" title="${LANG === 'en' ? 'Language' : 'Idioma'}">${FLAG_SVG[LANG]}<span class="langcode">${LANG.toUpperCase()}</span></button>
    <div class="langmenu" id="langMenu" role="menu" hidden data-noi18n>${Object.entries(LANGS).map(([k, n]) => `<button type="button" role="menuitemradio" aria-checked="${k === LANG}" data-lang="${k}">${FLAG_SVG[k]}<span>${n}</span></button>`).join('')}</div>`;
  ref.after(w);
  const b = w.querySelector('#bLang'), menu = w.querySelector('#langMenu');
  const close = () => { menu.hidden = true; b.setAttribute('aria-expanded', 'false'); };
  b.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; b.setAttribute('aria-expanded', String(!menu.hidden)); };
  menu.onclick = e => { const x = e.target.closest('[data-lang]'); if (!x) return; close(); if (x.dataset.lang !== LANG) setLang(x.dataset.lang); };
  document.addEventListener('click', e => { if (!w.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}
langPicker();
// en la pantalla de carga también se puede elegir, arriba a la derecha junto a Música
function introLang(el) {
  if (el.querySelector('.introlang')) return;
  const w = document.createElement('div'); w.className = 'introlang'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', LANG === 'en' ? 'Language' : 'Idioma'); w.dataset.noi18n = '';
  w.innerHTML = Object.keys(LANGS).map(k => `<button type="button" data-lang="${k}" aria-pressed="${k === LANG}" title="${LANGS[k]}">${FLAG_SVG[k]}<span>${k.toUpperCase()}</span></button>`).join('');
  w.onclick = e => { const b = e.target.closest('[data-lang]'); if (b && b.dataset.lang !== LANG) setLang(b.dataset.lang); };
  el.appendChild(w);
}
new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains('intro')) introLang(n); }); }).observe(document.body || document.documentElement, { childList: true });
document.addEventListener('DOMContentLoaded', i18nStart);
