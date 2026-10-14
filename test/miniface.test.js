// Minifaces propias (js/miniface.js usa FTEXW.encodeDxt3 y FTEXW.ddsFile de js/ftexenc.js):
// el .dds tiene que salir igual que las minifaces del juego (DXT3, sin mips) y leerse bien.
const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./load');
const FTEXW = load('ftexenc.js', 'FTEXW', { setTimeout });
const DDS = load('dds.js', 'DDS');

function img(w, h) { // degradé de color con un círculo opaco y borde suave, fondo transparente
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, r = Math.hypot(x - w / 2, y - h / 2) / (w / 2);
    px[i] = x * 255 / (w - 1); px[i + 1] = y * 255 / (h - 1); px[i + 2] = 128; px[i + 3] = r < .6 ? 255 : r > .8 ? 0 : Math.round((.8 - r) / .2 * 255);
  }
  return px;
}

test('la cabecera del .dds es la de las minifaces del juego (DXT3, 1 nivel)', async () => {
  const w = 256, blocks = await FTEXW.encodeDxt3(img(w, w), w, w), f = FTEXW.ddsFile(blocks, w, w), dv = new DataView(f.buffer);
  assert.equal(blocks.length, (w / 4) * (w / 4) * 16);
  assert.equal(f.length, 128 + w * w);
  // mismos valores que un 146287.dds de 256×256 hecho con Paint.NET (BC2, sin mips)
  assert.deepEqual([0, 4, 8, 12, 16, 20, 24, 28, 76, 80, 108].map(o => dv.getUint32(o, true)), [0x20534444, 124, 0xA1007, 256, 256, 65536, 1, 1, 32, 4, 0x1000]);
  assert.equal(String.fromCharCode(...f.subarray(84, 88)), 'DXT3');
});

test('al leerlo de nuevo, el color y la transparencia quedan cerca del original', async () => {
  const w = 64, px = img(w, w), back = DDS.decode(FTEXW.ddsFile(await FTEXW.encodeDxt3(px, w, w), w, w));
  assert.equal(back.w, w); assert.equal(back.h, w);
  let ea = 0, ec = 0, nc = 0;
  for (let i = 0; i < w * w; i++) {
    ea = Math.max(ea, Math.abs(back.data[i * 4 + 3] - px[i * 4 + 3]));
    if (px[i * 4 + 3] === 255) { for (let k = 0; k < 3; k++) ec += Math.abs(back.data[i * 4 + k] - px[i * 4 + k]); nc++; }
  }
  assert.ok(ea <= 17 * 2, 'alfa: diferencia máxima ' + ea); // 16 niveles con difusión de error
  assert.ok(ec / nc / 3 < 6, 'color: diferencia media ' + (ec / nc / 3).toFixed(2));
  // lo totalmente transparente y lo totalmente opaco no se ensucian
  assert.equal(back.data[3], 0); assert.equal(back.data[((w / 2) * w + w / 2) * 4 + 3], 255);
});

test('el borde transparente no oscurece el color de los píxeles visibles', async () => {
  const w = 8, px = new Uint8Array(w * w * 4); // mitad blanca opaca, mitad negra transparente
  for (let i = 0; i < w * w; i++) { const op = (i % w) < 2; px.set(op ? [250, 250, 250, 255] : [0, 0, 0, 0], i * 4); }
  const back = DDS.decode(FTEXW.ddsFile(await FTEXW.encodeDxt3(px, w, w), w, w));
  for (let y = 0; y < w; y++) for (let x = 0; x < 2; x++) assert.ok(back.data[(y * w + x) * 4] > 240, 'píxel visible oscurecido');
});
