// Ida y vuelta del cifrado de EDIT (js/pescrypt.js): descifrar y volver a cifrar tiene que dar los mismos bytes.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { load, pattern } = require('./load');

const PesCrypt = load('pescrypt.js', 'PesCrypt');
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const sameBytes = (a, b, msg) => assert.ok(Buffer.from(a).equals(Buffer.from(b)), msg);

// Archivo sintético armado como los de PES: cabecera de 320, cabecera interna de 208 y cuatro bloques.
// Los tamaños no son múltiplos de 4 a propósito, para probar los bytes sueltos del final.
function sample(game) {
  const hdr = pattern(208, 2);
  const f = { game, enc: pattern(320, 1), hdr, desc: pattern(61, 3), logo: pattern(130, 4), data: pattern(1003, 5), serial: null };
  PesCrypt.setSid(f, 'PES-EDIT-7');
  return f;
}

// Hashes calculados con una implementación independiente en Python del mismo cifrado (libpesXcrypter).
// Si cambian, el editor dejó de producir archivos que PES puede leer.
const GOLDEN = {
  '2021': '6175e664717989c7b8182a508914e36416d1f5d4641c86418d5073f4b9f0fa8c',
  '2020': '43aa64efe9679dc0ad6712a0d68448bcc05b4f3378f24676444ae9968545742f',
};

for (const game of ['2021', '2020']) {
  test(`PES ${game}: cifrar da exactamente los bytes de la referencia`, () => {
    const bytes = PesCrypt.encrypt(sample(game));
    assert.equal(bytes.length, 320 + 208 + 61 + 130 + 1003 + 20);
    assert.equal(sha256(bytes), GOLDEN[game]);
  });

  test(`PES ${game}: descifrar recupera cada bloque y detecta el juego`, () => {
    const f = sample(game);
    const d = PesCrypt.decrypt(PesCrypt.encrypt(f));
    assert.equal(d.game, game);
    sameBytes(d.enc, f.enc, 'cabecera externa');
    sameBytes(d.desc, f.desc, 'descripción');
    sameBytes(d.logo, f.logo, 'logo');
    sameBytes(d.data, f.data, 'datos');
    sameBytes(d.serial, f.serial, 'serial');
    const info = PesCrypt.info(d);
    assert.equal(info.sid, 'PES-EDIT-7');
    assert.equal(info.dataSize, 1003);
    assert.equal(info.logoSize, 130);
  });

  test(`PES ${game}: descifrar y volver a cifrar da el mismo archivo byte por byte`, () => {
    const bytes = PesCrypt.encrypt(sample(game));
    sameBytes(PesCrypt.encrypt(PesCrypt.decrypt(bytes)), bytes);
  });
}

test('cambiar descripción y SID sobrevive la ida y vuelta', () => {
  const f = PesCrypt.decrypt(PesCrypt.encrypt(sample('2021')));
  PesCrypt.setDescription(f, 'Parche de Agustín ⚽');
  PesCrypt.setSid(f, 'NUEVO-SID-123');
  const back = PesCrypt.info(PesCrypt.decrypt(PesCrypt.encrypt(f)));
  assert.equal(back.description, 'Parche de Agustín ⚽');
  assert.equal(back.sid, 'NUEVO-SID-123');
  assert.equal(back.dataSize, 1003);
});

test('un archivo dañado o que no es de PES se rechaza', () => {
  const bytes = PesCrypt.encrypt(sample('2021'));
  assert.throws(() => PesCrypt.decrypt(bytes.subarray(0, bytes.length - 1)), /No es un archivo de guardado/);
  assert.throws(() => PesCrypt.decrypt(pattern(2000, 9)), /No es un archivo de guardado/);
});

// EDIT reales: si alguien deja archivos en test/fixtures (o apunta PES_EDIT_DIR a una carpeta), se prueban también.
// No se suben al repo porque son pesados y son datos del juego.
const dir = process.env.PES_EDIT_DIR || path.join(__dirname, 'fixtures');
const real = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => !n.startsWith('.') && n !== 'LEEME.md' && fs.statSync(path.join(dir, n)).isFile()) : [];
for (const name of real) {
  test(`EDIT real ${name}: descifrar y volver a cifrar da el mismo archivo byte por byte`, () => {
    const bytes = new Uint8Array(fs.readFileSync(path.join(dir, name)));
    sameBytes(PesCrypt.encrypt(PesCrypt.decrypt(bytes)), bytes);
  });
}
