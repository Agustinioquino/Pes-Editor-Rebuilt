// Búsqueda de equipos en la web: "Como 1907" tiene que encontrar a "Como", y las siglas no tienen que molestar.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');
const TS = load('teamsearch.js', 'TS');
const Q = n => JSON.parse(JSON.stringify(TS.queries(n))); // el array viene de otro contexto de vm

test('las búsquedas van del nombre entero al más corto, sin año ni siglas', () => {
  assert.deepEqual(Q('Como 1907'), ['Como 1907', 'como']);
  assert.deepEqual(Q('FC Internazionale Milano'), ['FC Internazionale Milano', 'internazionale milano', 'internazionale', 'milano']);
  assert.deepEqual(Q('Club Atlético Lanús'), ['Club Atlético Lanús', 'atletico lanus', 'atletico', 'lanus']);
  assert.deepEqual(Q('1. FC Köln'), ['1. FC Köln', 'koln']);
  assert.deepEqual(Q('Boca Juniors'), ['Boca Juniors', 'juniors', 'boca']);
});

test('clean saca el año y el tipo de club, pero no el nombre', () => {
  assert.equal(TS.clean('Como 1907'), 'como');
  assert.equal(TS.clean('Sporting CP'), 'sporting cp');
  assert.equal(TS.clean('Club Atlético'), 'atletico');
  assert.equal(TS.clean('FC'), 'fc');
});

test('Como 1907 puntúa a Como por encima de otros resultados', () => {
  const cands = [
    { id: 1, name: 'Como', country: 'Italian Serie A', league: 'ita.1', national: false },
    { id: 2, name: 'Comoros', country: 'FIFA World Cup Qualifying - CAF', league: 'fifa.worldq.caf', national: true },
    { id: 3, name: 'Como Women', country: 'Italian Serie A Women', league: 'ita.w.1', national: false },
  ];
  const hint = TS.hint('ITA', 'Italia');
  const sorted = cands.sort((a, b) => TS.score(b, 'Como 1907', false, hint) - TS.score(a, 'Como 1907', false, hint));
  assert.equal(sorted[0].id, 1);
  assert.ok(TS.confident(TS.score(sorted[0], 'Como 1907', false, hint)));
  assert.ok(!TS.confident(TS.score(cands.find(c => c.id === 2), 'Como 1907', false, hint)));
});

test('la pista de país desempata nombres repetidos y la selección no se confunde con un club', () => {
  const nac = [{ id: 1, name: 'Nacional', country: 'Uruguayan Primera División', league: 'uru.1', national: false }, { id: 2, name: 'Nacional', country: 'Portuguese Primeira Liga', league: 'por.1', national: false }];
  const h = TS.hint('URY', 'Uruguay');
  assert.ok(TS.score(nac[0], 'Nacional', false, h) > TS.score(nac[1], 'Nacional', false, h));
  assert.equal(h.slug, 'uru');
  const arg = { id: 3, name: 'Argentina', country: 'FIFA World Cup', league: 'fifa.world', national: true };
  assert.ok(TS.score(arg, 'Argentina', true, null) > TS.score({ id: 4, name: 'Argentinos Juniors', country: 'Argentine Liga Profesional', league: 'arg.1', national: false }, 'Argentina', true, null));
  assert.ok(TS.score(arg, 'Argentina', true, null) > TS.score(arg, 'Argentina', false, null));
});
