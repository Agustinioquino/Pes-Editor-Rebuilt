// Antes de guardar: descifra de nuevo lo que se va a escribir y revisa que el EDIT siga sano
// (cantidades e IDs de jugadores, equipos y planteles). Solo frena por problemas nuevos:
// lo que ya venía raro en el archivo original no bloquea el guardado.
const EditCheck = (() => {
  const PLAYER_START = 0x7C, PLAYER_SIZE = 0x138, TEAM_START = 0x8ED2FC;
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  // problemas del contenido descifrado, cada uno con una clave estable para comparar con el original
  function problems(d, game) {
    const out = new Map(), add = (k, msg) => { if (!out.has(k)) out.set(k, msg); };
    const ix = PesData.index(d, game);
    if (PLAYER_START + ix.nPlayers * PLAYER_SIZE > TEAM_START) add('pfit', `Hay ${ix.nPlayers} jugadores y no entran en el espacio del EDIT.`);
    const seenP = new Set(); let prev = -1, sorted = true;
    for (const p of ix.players) {
      if (!p.id) add('p0', 'Hay un jugador con ID 0.');
      else if (seenP.has(p.id)) add('pdup' + p.id, `El jugador ID ${p.id} está repetido.`);
      if (p.id < prev) sorted = false;
      seenP.add(p.id); prev = p.id;
    }
    if (!sorted) add('psort', 'Los jugadores quedaron desordenados por ID.');
    const seenT = new Set();
    for (const t of ix.teams) {
      if (seenT.has(t.id)) add('tdup' + t.id, `El equipo ID ${t.id} está repetido.`);
      seenT.add(t.id);
      if (t.rosterBase == null) continue;
      const r = PesData.roster(d, t), inR = new Set();
      for (const x of r) {
        if (inR.has(x.pid)) add('rdup' + t.id + ':' + x.pid, `El jugador ID ${x.pid} aparece dos veces en el plantel del equipo ID ${t.id}.`);
        inR.add(x.pid);
      }
      if (t.tacticsBase == null) continue;
      const slots = new Set(r.map(x => x.slot));
      PesData.starters(d, t).forEach((s, i) => {
        if (!slots.has(s)) add('st' + t.id + ':' + i, `El titular ${i + 1} del equipo ID ${t.id} apunta a un lugar vacío del plantel.`);
      });
    }
    return { ix, out };
  }

  // bytes: lo que se va a escribir. f: el archivo en memoria. origData: los datos tal como se abrieron.
  // Devuelve una lista de errores en castellano; vacía = se puede guardar.
  function check(bytes, f, origData) {
    let chk;
    try { chk = PesCrypt.decrypt(bytes); } catch (e) { return ['El archivo generado no se puede volver a abrir: ' + e.message]; }
    const errs = [];
    if (chk.game !== f.game) errs.push(`El archivo generado quedó como PES ${chk.game} y el original es PES ${f.game}.`);
    if (PesCrypt.info(chk).type !== 'EDIT') errs.push('El archivo generado ya no es de tipo EDIT.');
    if (!same(chk.data, f.data)) errs.push('Los datos descifrados no coinciden con los del editor.');
    if (!same(chk.desc, f.desc) || !same(chk.logo, f.logo) || !same(chk.serial, f.serial)) errs.push('La descripción, el logo o el SID no coinciden con los del editor.');
    if (errs.length) return errs;

    const now = problems(chk.data, chk.game), before = problems(origData, f.game);
    const mem = PesData.index(f.data, f.game);
    if (now.ix.nPlayers !== mem.nPlayers) errs.push(`Cantidad de jugadores: el editor tiene ${mem.nPlayers} y el archivo ${now.ix.nPlayers}.`);
    if (now.ix.nTeams !== mem.nTeams) errs.push(`Cantidad de equipos: el editor tiene ${mem.nTeams} y el archivo ${now.ix.nTeams}.`);
    // el editor agrega jugadores pero nunca borra ni agrega equipos
    if (now.ix.nPlayers < before.ix.nPlayers) errs.push(`Faltan jugadores: el original tenía ${before.ix.nPlayers} y quedarían ${now.ix.nPlayers}.`);
    const lostP = before.ix.players.filter(p => !now.ix.byId.has(p.id)).map(p => p.id);
    if (lostP.length) errs.push(`Se perderían ${lostP.length} jugador(es) del original (ID ${lostP.slice(0, 5).join(', ')}${lostP.length > 5 ? '…' : ''}).`);
    if (now.ix.nTeams !== before.ix.nTeams) errs.push(`Cantidad de equipos: el original tenía ${before.ix.nTeams} y quedarían ${now.ix.nTeams}.`);
    const lostT = before.ix.teams.filter(t => !now.ix.teamById.has(t.id)).map(t => t.id);
    if (lostT.length) errs.push(`Cambiaron los IDs de ${lostT.length} equipo(s) (ID ${lostT.slice(0, 5).join(', ')}${lostT.length > 5 ? '…' : ''}).`);
    const lostR = before.ix.teams.filter(t => t.rosterBase != null && now.ix.teamById.get(t.id)?.rosterBase == null).map(t => t.id);
    if (lostR.length) errs.push(`Se perdería el plantel de ${lostR.length} equipo(s) (ID ${lostR.slice(0, 5).join(', ')}${lostR.length > 5 ? '…' : ''}).`);
    for (const [k, msg] of now.out) if (!before.out.has(k)) errs.push(msg);
    return errs;
  }
  return { check, problems };
})();
if (typeof module !== 'undefined') module.exports = EditCheck;
