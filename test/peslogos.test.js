// Escudos de PES Logos (js/peslogos.js): leer el feed JSON de Blogger, elegir el PNG grande de cada post y pedir el original.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const G = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiABC/';
// un post como los del feed (2026-10): el escudo en 512 y sus copias de 256 y 128
const post = {
  title: { $t: 'CA Rosario Central' }, published: { $t: '2026-10-01T10:00:00.000-05:00' },
  link: [{ rel: 'replies', href: 'x' }, { rel: 'alternate', href: 'https://peslogos.blogspot.com/2026/10/ca-rosario-central.html' }],
  category: [{ term: 'ARG' }, { term: 'Escudos' }, { term: 'x26' }],
  media$thumbnail: { url: G + 's72-c/CA%20Rosario%20Central.png' },
  content: { $t: `<a href="${G}s512/CA%20Rosario%20Central.png"><img src="${G}s1600/CA%20Rosario%20Central.png"></a>`
    + `<a href="${G}s256/CA%20Rosario%20Central256x.png"></a><a href="${G}s128/CA%20Rosario%20Central128x.png"></a>` }
};

function env(fetchImpl) {
  return load('peslogos.js', '({ plEntry, plSize, plQuery, plFeed, plDownload })', {
    tget: (t, k) => t[k], fetch: fetchImpl, setTimeout, clearTimeout
  });
}

test('cada post da su título, su página, el escudo grande y una miniatura', () => {
  const e = env().plEntry(post);
  assert.equal(e.title, 'CA Rosario Central');
  assert.equal(e.link, 'https://peslogos.blogspot.com/2026/10/ca-rosario-central.html');
  assert.equal(e.img, G + 's512/CA%20Rosario%20Central.png');
  assert.equal(e.thumb, G + 's160/CA%20Rosario%20Central.png');
  assert.deepEqual([...e.tags], ['ARG', 'Escudos', 'x26']);
});

test('el tamaño de Blogger se cambia en cualquiera de sus formas', () => {
  const { plSize } = env();
  assert.equal(plSize(G + 's512/A.png', 's0'), G + 's0/A.png');
  assert.equal(plSize(G + 's72-c/A.png', 's160'), G + 's160/A.png');
  assert.equal(plSize(G + 'w640-h400/A.png', 's0'), G + 's0/A.png');
  assert.equal(plSize('https://blogger.googleusercontent.com/img/a/AVvXsEi=s512', 's0'), 'https://blogger.googleusercontent.com/img/a/AVvXsEi=s0');
  assert.equal(plSize('https://i.ibb.co/p69b7vcq/WC26.png', 's0'), 'https://i.ibb.co/p69b7vcq/WC26.png');
});

test('el nombre del juego se limpia para buscar', () => {
  const { plQuery } = env();
  assert.equal(plQuery({ name: 'C.A. ROSARIO CENTRAL' }), 'Rosario Central');
  assert.equal(plQuery({ name: 'PSV' }), 'Psv');
  assert.equal(plQuery({ name: 'FC 1860' }), '1860');
});

test('la búsqueda lee el feed y saltea posts sin imagen', async () => {
  let asked = '';
  const { plFeed } = env(async u => { asked = u; return { ok: true, json: async () => ({ feed: { openSearch$totalResults: { $t: '2' }, entry: [post, { title: { $t: 'Sin imagen' }, content: { $t: '<p>hola</p>' } }] } }) }; });
  const r = await plFeed('rosario central');
  assert.match(asked, /^https:\/\/peslogos\.blogspot\.com\/feeds\/posts\/default\?alt=json&max-results=24&start-index=1&q=rosario%20central$/);
  assert.equal(r.total, 2); assert.equal(r.list.length, 1);
});

test('la descarga pide el original y si no puede usa el reenvío', async () => {
  const asked = [];
  const { plDownload } = env(async u => { asked.push(u); if (!u.startsWith('https://images.weserv.nl/')) throw new TypeError('CORS'); return { ok: true, blob: async () => ({ size: 10, type: 'image/png' }) }; });
  const b = await plDownload(G + 's512/A.png');
  assert.equal(b.size, 10);
  assert.equal(asked[0], G + 's0/A.png');
  assert.match(asked[2], /^https:\/\/images\.weserv\.nl\/\?url=blogger\.googleusercontent\.com%2F.*s0%2FA\.png&output=png$/);
});
