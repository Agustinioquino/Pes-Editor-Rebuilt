// Búsqueda de fotos de jugadores (js/faces.js): con el apellido "L. MARTÍNEZ" del juego hay que dar con Lisandro Martínez
// del Manchester United y no con Emiliano o Lautaro; y TheSportsDB (gratis: 1 pedido cada 2,1 s) atiende primero lo que se ve.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./load');
const TS = load('teamsearch.js', 'TS');
const msrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'matches.js'), 'utf8');
const ns = msrc.match(/function nameScore\([\s\S]*?\n}\n/)[0];
const fetched = [];
const F = load('faces.js', `${ns};({ sofifaUrls, faceName, faceNameOk, faceTeamLike, espnPick, tsdbPick, wikiPick, tsdbGet, TSDB, FACES })`, {
  TS, setTimeout, clearTimeout, performance, PREFS: undefined,
  fetch: async u => { fetched.push(u.split('/').pop()); return { ok: true, status: 200, json: async () => ({ player: [] }) }; },
});

test('el nombre del juego: inicial y apellido', () => {
  const n = F.faceName('L. MARTÍNEZ');
  assert.equal(n.initial, 'l'); assert.equal(n.surname, 'MARTÍNEZ'); assert.equal(n.last, 'martinez');
  const b = F.faceName('BRUNO FERNANDES'); assert.equal(b.initial, ''); assert.equal(b.last, 'fernandes');
  assert.equal(F.faceName(''), null);
  assert.ok(F.faceNameOk(n, 'Lisandro Martínez')); assert.ok(!F.faceNameOk(n, 'Emiliano Martínez')); assert.ok(!F.faceNameOk(n, 'Lisandro López'));
});

test('el club de afuera se reconoce sin confundir "Atlético" con cualquier Atlético', () => {
  assert.ok(F.faceTeamLike('Manchester United', 'Manchester United'));
  assert.ok(F.faceTeamLike('River Plate', 'Club Atlético River Plate'));
  assert.ok(F.faceTeamLike('Internazionale', 'Inter'));
  assert.ok(!F.faceTeamLike('Boca Juniors', 'River Plate'));
  assert.ok(!F.faceTeamLike('Atlético Madrid', 'Atlético Tucumán'));
});

const ESPN = [
  { displayName: 'Toni Martínez', subtitle: 'Alavés' },
  { displayName: 'Lisandro Martínez', subtitle: 'Manchester United', image: { default: 'https://a.espncdn.com/i/headshots/soccer/players/full/233937.png' } },
  { displayName: 'Emiliano Martínez', subtitle: 'Argentina' },
  { displayName: 'Lautaro Martínez', subtitle: 'Internazionale' },
];
test('ESPN: con el club se elige al jugador justo; sin club y con dos parecidos, ninguno', () => {
  const nm = F.faceName('L. MARTÍNEZ');
  assert.equal(F.espnPick(ESPN, nm, 'Manchester United').x.displayName, 'Lisandro Martínez');
  assert.equal(F.espnPick(ESPN, nm, 'Manchester United').sure, true);
  assert.equal(F.espnPick(ESPN, nm, 'FC Internazionale Milano').x.displayName, 'Lautaro Martínez');
  assert.equal(F.espnPick(ESPN, nm, ''), null); // Lisandro o Lautaro: no se adivina
  const b = F.espnPick([{ displayName: 'Bruno Fernandes', subtitle: 'Manchester United' }], F.faceName('BRUNO FERNANDES'), 'Otro Club');
  assert.equal(b.sure, true); // nombre entero igual
  const g = F.espnPick([{ displayName: 'Diogo Dalot', subtitle: 'Manchester United' }], F.faceName('DALOT'), 'Man Red');
  assert.equal(g.sure, false); // un solo Dalot pero el club no coincide: sirve de pista, no para la foto
});

test('TheSportsDB: rechaza al Martínez equivocado y acepta al de nombre completo', () => {
  const nm = F.faceName('L. MARTÍNEZ');
  const emi = [{ strPlayer: 'Emiliano Martinez', strTeam: 'Chelsea', strSport: 'Soccer', strCutout: 'e.png' }];
  assert.equal(F.tsdbPick(emi, nm, 'Manchester United', null), null);
  const lis = [{ strPlayer: 'Lisandro Martinez', strTeam: 'Manchester United', strSport: 'Soccer', strCutout: 'l.png' }];
  assert.equal(F.tsdbPick(lis, nm, 'Manchester United', { full: 'Lisandro Martínez', sure: true }).strCutout, 'l.png');
  // el jugador cambió de club después del juego: alcanza con el nombre completo seguro
  const dal = [{ strPlayer: 'Diogo Dalot', strTeam: 'Real Madrid', strSport: 'Soccer', strCutout: 'd.png' }];
  assert.equal(F.tsdbPick(dal, F.faceName('DALOT'), 'Manchester United', { full: 'Diogo Dalot', sure: true }).strCutout, 'd.png');
  assert.equal(F.tsdbPick(dal, F.faceName('DALOT'), 'Manchester United', null), null); // solo el apellido y otro club: no
  const nba = [{ strPlayer: 'Lisandro Martinez', strTeam: 'Chicago Bulls', strSport: 'Basketball', strCutout: 'x.png' }];
  assert.equal(F.tsdbPick(nba, nm, '', { full: 'Lisandro Martinez', sure: true }), null);
});

test('Wikipedia: la página del jugador también en español; clubes y entrenadores no', () => {
  const nm = F.faceName('JAROSZEWICZ'), th = { source: 'https://upload.wikimedia.org/x.jpg' };
  const pages = [
    { title: 'Club Atlético River Plate', index: 1, description: 'club de fútbol de Argentina', thumbnail: th },
    { title: 'Franco Jaroszewicz', index: 2, description: 'futbolista argentino', thumbnail: th },
  ];
  assert.equal(F.wikiPick(pages, nm, null).title, 'Franco Jaroszewicz');
  const coach = [{ title: 'Pedro Jaroszewicz', index: 1, description: 'exfutbolista y entrenador argentino', thumbnail: th }];
  assert.equal(F.wikiPick(coach, nm, null), null);
  const lm = [
    { title: 'Emiliano Martínez', index: 1, description: 'Argentine footballer', thumbnail: th },
    { title: 'Lisandro Martínez', index: 2, description: 'Argentine footballer (born 1998)', thumbnail: th },
  ];
  assert.equal(F.wikiPick(lm, F.faceName('L. MARTÍNEZ'), null).title, 'Lisandro Martínez');
  const noDesc = [{ title: 'Juan Pérez (futbolista)', index: 1, thumbnail: th }];
  assert.equal(F.wikiPick(noDesc, F.faceName('J. PÉREZ'), null).title, 'Juan Pérez (futbolista)');
});

test('TheSportsDB: una sola cola, 2,1 s entre pedidos y primero lo que se pidió último', async () => {
  const t0 = Date.now(), done = [];
  const a = F.tsdbGet('searchplayers.php?p=A', () => 1).then(() => done.push('A'));
  const b = F.tsdbGet('searchplayers.php?p=B', () => 1).then(() => done.push('B'));
  const c = F.tsdbGet('searchteams.php?t=C', () => 9).then(() => done.push('C')); // lo que está en pantalla
  await Promise.all([a, b, c]);
  assert.deepEqual(done, ['A', 'C', 'B']);
  assert.ok(Date.now() - t0 >= 4100, 'respeta el ritmo de TheSportsDB gratis');
});

test('SoFIFA: del link del jugador sale la dirección de su foto', () => {
  assert.equal(F.sofifaUrls('https://sofifa.com/player/231478/lautaro-martinez/260001/')[0], 'https://cdn.sofifa.net/players/231/478/26_120.png');
  assert.equal(F.sofifaUrls('sofifa.com/player/20801')[0], 'https://cdn.sofifa.net/players/020/801/26_120.png');
  assert.equal(F.sofifaUrls('231478')[1], 'https://cdn.sofifa.net/players/231/478/25_120.png');
  assert.equal(F.sofifaUrls('https://upload.wikimedia.org/x.jpg'), null);
});
