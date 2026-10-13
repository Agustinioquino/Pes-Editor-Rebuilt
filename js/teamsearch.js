// ===================== Búsqueda de equipos en la web (nombres del EDIT vs. nombres de ESPN / API-Football) =====================
// El EDIT dice "Como 1907", "FC Internazionale" o "Club Atlético Lanús"; la web dice "Como", "Inter" o "Lanús". Acá se arman
// las búsquedas en orden (nombre entero → sin año → sin "FC/Club/Calcio…" → palabra más larga → primera palabra) y se puntúan
// los candidatos sin que el año o esas siglas cuenten. Sin dependencias: también se prueba en Node (test/teamsearch.test.js).
const TS_NORM = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const TS_YEAR = /\b(1[89]\d\d|20\d\d)\b/g;
// siglas y palabras de "tipo de club" que la web suele omitir (no van "Sporting", "Deportivo", "Atlético", "Real": son parte del nombre)
const TS_TYPE = /\b(fc|cf|sc|ac|afc|cd|ca|cs|ud|rcd|sd|ssc|ssd|sad|asd|us|as|ec|se|sv|fk|bk|if|sk|nk|hnk|gnk|krc|rsc|tsv|vfb|vfl|bsc|spvgg|club|calcio|football|futbol|futebol|soccer|1)\b/g;
const TS_STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'the', 'of', 'y', 'and', 'da', 'do', 'di', 'e']);
const TS_JUNIOR = /\b(u\d\d|sub\d\d|w|women|femenino|femenina|feminino|ii|b|reserves|reserva|youth|juvenil|academy|amateur)\b/;
// prefijo de liga en ESPN ("ita.1", "arg.1") a partir del código ISO-3 del país del EDIT; solo las que no coinciden con el ISO
const TS_ISO2ESPN = { DEU: 'ger', NLD: 'ned', CHE: 'sui', DNK: 'den', CHL: 'chi', ZAF: 'rsa', SAU: 'ksa', ARE: 'uae', CRI: 'crc', GTM: 'gua', PRT: 'por', URY: 'uru', PRY: 'par', HRV: 'cro', SVN: 'slo', GRC: 'gre', NGA: 'nga', IRL: 'irl', WAL: 'wal', SCO: 'sco', ENG: 'eng', POL: 'pol', MYS: 'mas', PHL: 'phi', VNM: 'vie', BGR: 'bul', ROU: 'rou', SRB: 'srb', TUR: 'tur', JPN: 'jpn', KOR: 'kor', CHN: 'chn', AUS: 'aus', ZMB: 'zam', MAR: 'mar', DZA: 'alg', TUN: 'tun', EGY: 'egy', BRA: 'bra', ARG: 'arg', MEX: 'mex', USA: 'usa', CAN: 'can', COL: 'col', PER: 'per', ECU: 'ecu', BOL: 'bol', VEN: 'ven', HND: 'hon', SLV: 'slv', PAN: 'pan', JAM: 'jam', ESP: 'esp', ITA: 'ita', FRA: 'fra', BEL: 'bel', AUT: 'aut', SWE: 'swe', NOR: 'nor', FIN: 'fin', ISL: 'isl', UKR: 'ukr', RUS: 'rus', CZE: 'cze', SVK: 'svk', HUN: 'hun', ISR: 'isr', QAT: 'qat', IRN: 'irn', IND: 'ind', IDN: 'idn', THA: 'tha', CYP: 'cyp', KAZ: 'kaz', AZE: 'aze', GEO: 'geo', UZB: 'uzb', GHA: 'gha', SEN: 'sen', CMR: 'cmr', CIV: 'civ', NZL: 'nzl' };
// cómo aparece el país en el subtítulo de la web ("Italian Serie A", "Argentine Primera División", "Spanish LALIGA"…)
const TS_WORDS = { ita: ['ital', 'serie a', 'serie b'], esp: ['spa', 'laliga', 'la liga'], eng: ['engl', 'premier league', 'championship'], ger: ['germ', 'bundesliga'], fra: ['fren', 'ligue 1', 'ligue 2'], arg: ['argent', 'primera divis'], bra: ['braz', 'brasileir'], por: ['portug'], ned: ['dutch', 'eredivisie', 'nether'], usa: ['mls', 'major league', 'united states', 'u.s.'], mex: ['mex', 'liga mx'], tur: ['turk', 'super lig'], sco: ['scot'], bel: ['belg'], ksa: ['saudi'], jpn: ['japan', 'j1', 'j-league'], rus: ['russia'], gre: ['greek', 'greece'], sui: ['swiss', 'switz'], den: ['danish', 'denmark'], aut: ['austria'], col: ['colomb'], uru: ['urugua'], chi: ['chile'], per: ['peru'], ecu: ['ecuador'], par: ['paragua'], bol: ['bolivia'], ven: ['venezuel'], pol: ['polish', 'poland', 'ekstraklasa'], swe: ['swed', 'allsvenskan'], nor: ['norw', 'eliteserien'], ukr: ['ukrain'], cze: ['czech'], srb: ['serbia'], cro: ['croat'], wal: ['welsh', 'wales'], irl: ['irish', 'ireland'], aus: ['austral', 'a-league'], chn: ['chinese', 'china'], kor: ['korea', 'k league'], qat: ['qatar'], uae: ['emirat', 'uae'], egy: ['egypt'], rsa: ['south africa'], mar: ['morocc'], can: ['canad'], crc: ['costa ric'], hon: ['hondur'], gua: ['guatemal'], ind: ['india'], idn: ['indonesia'], tha: ['thai'], nga: ['nigeria'], gha: ['ghana'], sen: ['senegal'], isr: ['israel'], hun: ['hungar'], rou: ['romania'], bul: ['bulgar'], svk: ['slovak'], slo: ['sloven'], cyp: ['cyprus', 'cypriot'], fin: ['finland', 'finnish'], isl: ['iceland'], kaz: ['kazakh'], aze: ['azerbai'], geo: ['georgia'], uzb: ['uzbek'], irn: ['iran'], pan: ['panama'], jam: ['jamaica'], slv: ['el salvador', 'salvador'], mas: ['malaysia'], phi: ['philipp'], vie: ['vietnam'], zam: ['zambia'], alg: ['algeria'], tun: ['tunisia'], cmr: ['cameroon'], civ: ['ivory', 'cote d'], nzl: ['new zealand'] };
const TS = {
  norm: TS_NORM,
  noYear: s => TS_NORM(s).replace(TS_YEAR, ' ').replace(/\s+/g, ' ').trim(),
  // sin año y sin siglas de tipo de club; si no queda nada (ej. "Club Atlético" → ""), se devuelve lo anterior
  clean(s) { const a = TS.noYear(s), b = a.replace(TS_TYPE, ' ').replace(/\s+/g, ' ').trim(); return b.length >= 2 ? b : a; },
  toks: s => s.split(' ').filter(x => x && !TS_STOP.has(x)),
  // búsquedas en orden; se corta en la primera que trae un candidato convincente
  queries(name) {
    const raw = String(name || '').trim(), ny = TS.noYear(raw), cl = TS.clean(raw), tk = TS.toks(cl).sort((a, b) => b.length - a.length);
    const ct = TS.toks(cl), ok = (w, n) => (w && w.length >= n ? w : '');
    const list = [raw, ny, cl, ok(tk[0], 4), ok(ct[ct.length - 1], 3), ok(ct[0], 3)];
    const out = []; for (const q of list) { const k = TS_NORM(q); if (q && k.length >= 2 && !out.some(x => TS_NORM(x) === k)) out.push(q); }
    return out;
  },
  // pista de país a partir del ISO-3 del EDIT ("ITA") → prefijo de liga de ESPN ("ita") y palabras del subtítulo
  hint(iso, name) { const i = String(iso || '').toUpperCase(), p = TS_ISO2ESPN[i] || i.toLowerCase(); return p ? { slug: p, words: TS_WORDS[p] || [], name: name || '' } : null; },
  hintMatch(c, h) {
    if (!h || !c) return 0;
    const lg = TS_NORM(c.league || ''), sub = (c.country || '').toLowerCase();
    if (lg && (lg === h.slug || lg.startsWith(h.slug + ' '))) return 1;
    if (h.words.some(w => sub.includes(w))) return 1;
    if (h.name && sub.includes(h.name.toLowerCase())) return 1;
    const seg = lg.split(' ')[0]; return seg.length === 3 && TS_WORDS[seg] && seg !== h.slug ? -1 : 0; // liga de otro país: resta un poco ("Nacional" hay en varios)
  },
  // puntaje de un candidato: nombre igual (sin año ni siglas) manda; después, palabras en común, selección/club, filiales y país
  score(c, want, national, hint) {
    const cn = TS_NORM(c.name), wn = TS_NORM(want), cc = TS.clean(cn), wc = TS.clean(wn);
    let s = cn === wn ? 10 : cc === wc ? 9 : 0;
    const ct = TS.toks(cc), wt = TS.toks(wc), cts = new Set(ct), wts = new Set(wt);
    for (const t of ct) { if (wts.has(t)) s += t.length > 2 ? 2 : 1; else if (wt.some(w => w.length > 3 && t.length > 3 && (w.startsWith(t) || t.startsWith(w)))) s += 1; else s -= 1; }
    for (const t of wt) if (!cts.has(t) && t.length > 2) s -= 1;
    if (c.national != null) s += !!c.national === !!national ? 3 : -6;
    if (TS_JUNIOR.test(cn) && !TS_JUNIOR.test(wn)) s -= 5;
    s += 3 * TS.hintMatch(c, hint);
    return s;
  },
  // ¿alcanza con lo que hay? (nombre igual, sin confusión de selección/club): no hace falta seguir buscando
  confident(best) { return best >= 11; },
};
