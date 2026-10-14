// Prueba de interfaz del Kit Studio Pro con un navegador de verdad (Playwright): las dos partes (Uniformes y Editor)
// y cargar un kit desde un .zip arrastrado: como kit nuevo, reemplazando uno en uso y en un equipo sin carpeta en el kit-server.
// Necesita Playwright y un EDIT real (test/fixtures/EDIT* o PES_EDIT_DIR); si faltan, se salta. UI_SHOTS=carpeta guarda capturas.
const test = require('node:test'), assert = require('node:assert'), fs = require('node:fs'), path = require('node:path');
const { makeZip, makePng } = require('./zipmake');
const PW = ['playwright', '/opt/node-tools/node_modules/playwright'].map(p => { try { return require(p); } catch { return null; } }).find(Boolean);
const editDir = process.env.PES_EDIT_DIR || path.join(__dirname, 'fixtures');
const EDIT = fs.existsSync(editDir) ? fs.readdirSync(editDir).filter(f => /^EDIT\d+$/.test(f)).map(f => path.join(editDir, f))[0] : null;
const CHROME = process.env.PW_CHROMIUM || ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
const ROOT = path.join(__dirname, '..'), MIME = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2', ico: 'image/x-icon' };
const FTEX_MAGIC = [0x46, 0x54, 0x45, 0x58];

// la textura del kit: pecho rojo, mangas y espalda blancas, short azul y medias verdes (en las regiones que usa el juego)
const kitPng = () => makePng(64, 64, (u, v) => u > .34 && u < .66 && v > .49 ? [200, 0, 0] : u < .34 && v > .58 ? [0, 0, 200] : u < .34 && v > .31 && v < .56 ? [0, 160, 0] : [255, 255, 255]);
const zipKit = () => makeZip([['mi kit/', '', false], ['mi kit/u0001p2.png', kitPng(), true], ['mi kit/u0001p2_name.png', makePng(64, 16, () => [255, 255, 255, 255]), true], ['mi kit/leeme.txt', 'kit de prueba', true]]);

test('Kit Studio Pro: Uniformes, Editor y cargar un kit desde un .zip', { skip: !PW ? 'sin Playwright' : !EDIT ? 'sin EDIT en test/fixtures (ver LEEME.md)' : false }, async () => {
  const shots = process.env.UI_SHOTS; if (shots) fs.mkdirSync(shots, { recursive: true });
  const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, n + '.png') }); };
  const b = await PW.chromium.launch({ executablePath: CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }), p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    // el editor se sirve desde el repo; todo lo de afuera (fuentes, GitHub) se corta
    await p.route(/^(?!http:\/\/localhost:8123\/)/, r => r.abort());
    await p.route('http://localhost:8123/**', r => { const u = new URL(r.request().url()), f = path.join(ROOT, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(f), contentType: MIME[path.extname(f).slice(1)] || 'application/octet-stream' }); });
    await p.goto('http://localhost:8123/index.html?fresh=1');
    await p.setInputFiles('#fFile', EDIT);
    await p.waitForFunction(() => typeof S !== 'undefined' && S.ix && S.ix.teamById && S.ix.teamById.size > 1, null, { timeout: 90000 });
    await p.waitForTimeout(1500);
    // un Sider de mentira en OPFS: equipo A con p1 en el kit-server; equipo B sin carpeta (sus kits "están en los .cpk")
    const ids = await p.evaluate(async () => {
      document.querySelectorAll('.modal-bg, .devpop, #intro, .intro').forEach(e => e.remove()); document.documentElement.classList.remove('introing');
      const root = await navigator.storage.getDirectory(); try { await root.removeEntry('sider', { recursive: true }); } catch { }
      const sd = await root.getDirectoryHandle('sider', { create: true }); await sd.getDirectoryHandle('livecpk', { create: true });
      const kit = await (await sd.getDirectoryHandle('content', { create: true })).getDirectoryHandle('kit-server', { create: true });
      const ts = [...S.ix.teamById.values()].filter(t => t.id >= 100).slice(0, 2), wr = async (d, n, s) => { const w = await (await d.getFileHandle(n, { create: true })).createWritable(); await w.write(s); await w.close(); };
      await wr(kit, 'map.txt', `${ts[0].id},"Team"\r\n`);
      const td = await kit.getDirectoryHandle('Team', { create: true }); await wr(td, 'order.ini', 'p1\r\n');
      await wr(await td.getDirectoryHandle('p1', { create: true }), 'config.txt', KZIP.configFor({ base: null, team: ts[0].id, slot: 'p1', have: [], colors: { c1: '#c8102e', c2: '#ffffff', sh: '#ffffff', so: '#c8102e' } }).text);
      const o = window.idbGet; window.idbGet = async k => k === 'sider' ? sd : o(k);
      KITS.map.set(ts[0].id, { k: [], g: [], path: 'Team' }); KITS.map.delete(ts[1].id); KITS.from = 'sider';
      S.tab = 'teams'; S.team = ts[0].id; S.ttab = 'kits'; render();
      return ts.map(t => t.id);
    });
    const opfs = async (fn, arg) => p.evaluate(async ([src, arg]) => { const root = await navigator.storage.getDirectory(); const kit = await (await (await root.getDirectoryHandle('sider')).getDirectoryHandle('content')).getDirectoryHandle('kit-server'); const ls = async d => { const o = []; for await (const [n] of d.entries()) o.push(n); return o.sort(); }; const rd = async (d, n) => (await (await d.getFileHandle(n)).getFile()).text(); const head = async (d, n) => [...new Uint8Array(await (await (await d.getFileHandle(n)).getFile()).arrayBuffer())].slice(0, 4); return (0, eval)('(' + src + ')')(kit, { ls, rd, head }, arg); }, [fn.toString(), arg]);
    const f4 = n => 'u' + String(ids[0]).padStart(4, '0') + n;

    // ---- Uniformes: la lista de kits con sus texturas y la zona para arrastrar ----
    await p.waitForSelector('.ksucard', { timeout: 60000 });
    assert.strictEqual(await p.locator('.ksucard').count(), 1);
    assert.ok(await p.locator('#ksDrop').isVisible(), 'la zona para arrastrar el .zip está en Uniformes');
    assert.strictEqual(await p.getAttribute('#ksMode [data-v="list"]', 'aria-pressed'), 'true');
    await p.waitForTimeout(1500); await shot(p, 'z1-uniformes');

    // ---- arrastrar el .zip: va como p2 (lo dice el nombre u0001p2.png), sin reemplazar nada ----
    const zip = [...zipKit()];
    const drop = async () => { const dt = await p.evaluateHandle(bytes => { const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array(bytes)], 'mi kit.zip', { type: 'application/zip' })); return dt; }, zip); await p.dispatchEvent('#ksDrop', 'drop', { dataTransfer: dt }); await p.waitForSelector('.ksmodal #kzGo', { timeout: 30000 }); };
    await drop();
    assert.strictEqual(await p.inputValue('[data-slot="0"]'), 'p2');
    assert.ok(await p.locator('[data-rep="0"]').isHidden(), 'p2 no está en uso: no pregunta si reemplazar');
    assert.deepStrictEqual(await p.$$eval('.kzchip', es => es.map(e => e.className.replace('kzchip ', ''))), ['ok', 'gen', 'gen', 'none', 'none', 'none', 'ok'], 'kit y nombre vienen; normal map y brillo se generan');
    await p.waitForTimeout(800); await shot(p, 'z2-cuadro');
    await p.click('#kzGo');
    await p.waitForSelector('.ksmodal', { state: 'detached', timeout: 180000 });
    await p.waitForFunction(() => document.querySelectorAll('.ksucard').length === 2, null, { timeout: 30000 });
    let st = await opfs(async (kit, h, f) => { const td = await kit.getDirectoryHandle('Team'), p2 = await td.getDirectoryHandle('p2'); return { team: await h.ls(td), p2: await h.ls(p2), order: await h.rd(td, 'order.ini'), cfg: await h.rd(p2, 'config.txt'), magic: await h.head(p2, f + '.ftex'), nrm: await h.head(p2, f + '_nrm.ftex') }; }, f4('p2'));
    assert.deepStrictEqual(st.p2, ['config.txt', f4('p2') + '.ftex', f4('p2') + '_name.ftex', f4('p2') + '_nrm.ftex', f4('p2') + '_srm.ftex'], 'la textura y el nombre convertidos a .ftex, normal map y brillo genéricos');
    assert.deepStrictEqual(st.magic, FTEX_MAGIC); assert.deepStrictEqual(st.nrm, FTEX_MAGIC);
    assert.strictEqual(st.order, 'p1\r\np2\r\n', 'p2 entra segundo en order.ini');
    assert.match(st.cfg, new RegExp('^KitFile=' + f4('p2') + '\\r$', 'm')); assert.match(st.cfg, new RegExp('^NameFontFile=' + f4('p2') + '_name\\r$', 'm')); assert.match(st.cfg, /^BackNumbersFile=\r$/m);
    assert.match(st.cfg, /^ShirtColor1=#c80000\r$/m, 'los colores del config salen de la textura'); assert.match(st.cfg, /^ShortsColor=#0000c8\r$/m); assert.match(st.cfg, /^SocksColor=#00a000\r$/m);
    assert.deepStrictEqual(await p.evaluate(() => [KS.kits, KS.all, KITS.map.get(S.team).k.length]), [['p1', 'p2'], ['p1', 'p2'], 2], 'el estudio y el mapa de kits se actualizan sin recargar');
    await p.waitForTimeout(2500); await shot(p, 'z3-cargado');

    // ---- el mismo .zip otra vez: p2 ya está en uso, se elige reemplazar y lo de antes va a _borrados ----
    await drop();
    assert.strictEqual(await p.inputValue('[data-slot="0"]'), 'p2');
    assert.ok(await p.locator('[data-rep="0"]').isVisible(), 'p2 en uso: pregunta si reemplazar o agregar como nuevo');
    assert.strictEqual(await p.textContent('[data-rep="0"] [data-nn]'), 'p3');
    await p.check('input[name="kzr0"][value="replace"]'); await p.waitForTimeout(500); await shot(p, 'z4-reemplazar');
    await p.click('#kzGo');
    await p.waitForSelector('.ksmodal', { state: 'detached', timeout: 180000 });
    st = await opfs(async (kit, h) => { const td = await kit.getDirectoryHandle('Team'); return { team: await h.ls(td), trash: await h.ls(await (await td.getDirectoryHandle('_borrados')).getDirectoryHandle('p2')), order: await h.rd(td, 'order.ini') }; });
    assert.ok(st.team.includes('_borrados') && st.trash.includes('config.txt') && st.trash.includes(f4('p2') + '.ftex'), 'el p2 anterior quedó en _borrados');
    assert.strictEqual(st.order, 'p1\r\np2\r\n', 'el orden no cambia al reemplazar');
    assert.deepStrictEqual(await p.evaluate(() => KS.kits), ['p1', 'p2']);

    // ---- Editor: la otra parte, con el visor 3D y la tira de kits ----
    await p.click('#ksMode [data-v="edit"]');
    await p.waitForSelector('#ks3d', { timeout: 30000 });
    assert.strictEqual(await p.locator('.kssel .kschip').count(), 2);
    assert.strictEqual(await p.locator('.ksucard').count(), 0, 'en el Editor no está la lista de Uniformes');
    await p.waitForTimeout(4000); await shot(p, 'z5-editor');

    // ---- equipo sin carpeta en el kit-server: aviso de los .cpk y carga por Sider (crea la carpeta y la línea en map.txt) ----
    await p.evaluate(id => { S.team = id; render(); }, ids[1]);
    await p.waitForSelector('#ksCpk', { timeout: 30000 });
    assert.ok(await p.locator('#ksDrop').isVisible(), 'también se puede arrastrar un kit para el equipo de los .cpk');
    await p.waitForTimeout(800); await shot(p, 'z6-cpk');
    await drop();
    await p.selectOption('[data-slot="0"]', 'p1');
    await p.click('#kzGo');
    await p.waitForSelector('.ksmodal', { state: 'detached', timeout: 180000 });
    await p.waitForFunction(() => document.querySelectorAll('.ksucard').length === 1, null, { timeout: 60000 });
    const g4 = 'u' + String(ids[1]).padStart(4, '0') + 'p1';
    st = await opfs(async (kit, h, g4) => { const map = await h.rd(kit, 'map.txt'), line = map.split(/\r?\n/).find(l => l.startsWith(KS.team + ',')), dir = line.match(/"([^"]+)"/)[1], td = await kit.getDirectoryHandle(dir); return { map, dir, team: await h.ls(td), order: await h.rd(td, 'order.ini'), p1: await h.ls(await td.getDirectoryHandle('p1')), magic: await h.head(await td.getDirectoryHandle('p1'), g4 + '.ftex') }; }, g4);
    assert.match(st.map, new RegExp('^' + ids[0] + ',"Team"\\r$', 'm'), 'la línea del otro equipo sigue igual');
    assert.match(st.map, new RegExp('^' + ids[1] + ',"' + st.dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\r$', 'm'), 'el equipo nuevo queda anotado en map.txt');
    assert.strictEqual(st.order, 'p1\r\n'); assert.ok(st.p1.includes(g4 + '.ftex') && st.p1.includes('config.txt')); assert.deepStrictEqual(st.magic, FTEX_MAGIC);
    assert.deepStrictEqual(await p.evaluate(() => [KS.path, KS.kits, KITS.map.get(S.team).path]), [st.dir, ['p1'], st.dir]);
    await p.waitForTimeout(2500); await shot(p, 'z7-cpk-cargado');
    assert.deepStrictEqual(errs, [], 'sin errores de JavaScript en la página');
  } finally { await b.close(); }
});
