// PES 2020/2021 EDIT data layout — port of 4ccEditor (zlib license, the4chancup)
const PesData = (() => {
  // Player entry: sequence of [key, startBit, bits] or ['skip', bytes] or ['str', key, bytes]
  const P = [
    ['id', 0, 32], ['comm_id', 0, 32], ['nation', 0, 16], ['height', 0, 8], ['weight', 0, 8], ['gc1', 0, 8], ['gc2', 0, 8],
    ['atk', 0, 7], ['ball_ctrl', 7, 7], ['weak_use', 6, 2], ['tight_pos', 0, 7], ['lowpass', 7, 7], ['loftpass', 6, 7],
    ['finish', 5, 7], ['mo_armd', 4, 4], ['place_kick', 0, 7], ['swerve', 7, 7], ['speed', 6, 7], ['exp_pwr', 5, 7],
    ['mo_armr', 4, 4], ['jump', 0, 7], ['phys_cont', 7, 7], ['body_ctrl', 6, 7], ['stamina', 5, 7], ['mo_ck', 4, 4],
    ['ball_win', 0, 7], ['aggres', 7, 7], ['gk', 6, 7], ['catching', 5, 7], ['form', 4, 3], ['e_player', 7, 1],
    ['cover', 0, 7], ['age', 7, 6], ['reg_pos', 5, 4], ['play_style', 2, 5], ['mo_fk', 7, 5], ['star', 4, 3],
    ['e_basic', 7, 1], ['def', 0, 7], ['clearing', 7, 7], ['header', 6, 7], ['mo_hunchd', 5, 3], ['mo_hunchr', 0, 3],
    ['mo_pk', 3, 3], ['weak_acc', 6, 2], ['drib', 0, 7], ['injury', 7, 2], ['play_attit', 1, 2], ['mo_drib', 3, 2],
    ['pos12', 5, 2], ['pos9', 7, 2], ['pos10', 1, 2], ['pos11', 3, 2], ['pos5', 5, 2], ['pos6', 7, 2], ['pos7', 1, 2],
    ['pos8', 3, 2], ['pos4', 5, 2], ['e_regpos', 7, 1], ['pos3', 0, 2], ['pos1', 2, 2], ['pos0', 4, 2], ['reflex', 6, 7],
    ['kick_pwr', 5, 7], ['pos2', 4, 2], ['e_playpos', 6, 1], ['e_ability', 7, 1], ['e_skill', 0, 1], ['e_style', 1, 1],
    ['e_com', 2, 1], ['e_motion', 3, 1], ['strong_foot', 5, 1], ['strong_hand', 6, 1],
    ['com0', 7, 1], ['com1', 0, 1], ['com2', 1, 1], ['com3', 2, 1], ['com4', 3, 1], ['com5', 4, 1], ['com6', 5, 1],
    ['sk0', 6, 1], ['sk28', 7, 1], ['sk1', 0, 1], ['sk2', 1, 1], ['sk3', 2, 1], ['sk29', 3, 1], ['sk4', 4, 1], ['sk5', 5, 1],
    ['sk30', 6, 1], ['sk6', 7, 1], ['sk7', 0, 1], ['sk31', 1, 1], ['sk39', 2, 1], ['sk8', 3, 1], ['sk32', 4, 1], ['sk33', 5, 1],
    ['sk9', 6, 1], ['sk10', 7, 1], ['sk11', 0, 1], ['sk12', 1, 1], ['sk40', 2, 1], ['sk13', 3, 1], ['sk14', 4, 1], ['sk15', 5, 1],
    ['sk16', 6, 1], ['sk34', 7, 1], ['sk17', 0, 1], ['sk18', 1, 1], ['sk35', 2, 1], ['sk19', 3, 1], ['sk20', 4, 1], ['sk36', 5, 1],
    ['sk37', 6, 1], ['sk21', 7, 1], ['sk22', 0, 1], ['sk23', 1, 1], ['sk38', 2, 1], ['sk24', 3, 1], ['sk25', 4, 1], ['sk26', 5, 1],
    ['sk27', 6, 1], ['skip', 1],
    ['str', 'name', 61], ['str', 'shirt', 61], ['str', 'shirt_nt', 61], ['skip', 3], // camiseta en el club y en la selección
    ['skip', 4], ['e_face', 0, 1], ['e_hair', 1, 1], ['e_phys', 2, 1], ['e_strip', 3, 1], ['boot_id', 4, 14], ['glove_id', 2, 14],
    ['copy_id', 0, 32],
    ['neck_len', 0, 4], ['neck_size', 4, 4], ['shldr_hi', 0, 4], ['shldr_wid', 4, 4], ['chest', 0, 4], ['waist', 4, 4],
    ['arm_size', 0, 4], ['arm_len', 4, 4], ['thigh', 0, 4], ['calf', 4, 4], ['leg_len', 0, 4], ['head_len', 4, 4],
    ['head_wid', 0, 4], ['head_dep', 4, 4], ['wrist_col_l', 0, 3], ['wrist_col_r', 3, 3], ['wrist_tape', 6, 2],
    ['spec_col', 0, 3], ['spec_style', 3, 3], ['sleeve', 6, 2], ['inners', 0, 2], ['socks', 2, 2], ['undershorts', 4, 2],
    ['untucked', 6, 1], ['ankle_tape', 7, 1], ['gloves', 0, 1], ['gloves_col', 1, 3], ['skip', 23], ['skin_col', 0, 3],
    ['skip', 19], ['iris_col', 0, 4],
  ];
  const PLAYER_SIZE = 0x138, PLAYER_START = 0x7C;
  const TEAM_START = 0x8ED2FC;
  const LAYOUT = {
    '2021': { teamSize: 0x24C, roster: 0x9D4648, tactics: 0xA09880 },
    '2020': { teamSize: 0x210, roster: 0x9ccc04, tactics: 0xa01e3c },
  };
  // Team entry fields (relative)
  const T = [
    ['id', 0, 32], ['manager_id', 0, 32], ['skip', 2], ['stadium_id', 0, 16], ['skip', 2], ['country', 0, 9], ['skip', 3],
    // opciones detalladas del estadio local (comparadas con el CSV de PES2020Editor): colores de la red del arco,
    // estilo del arco y diseño de la red. El "Diseño red portería" del juego (1 blanca, 2 negra, 3 verde, 4-15 tipos 1-12;
    // 0 sin elegir) está en net_design, comparado con capturas del juego; PES2020Editor llama GoalNettingDesign a net_b7 + 2 × su bit bajo
    ['net1r', 0, 6], ['net1g', 6, 6], ['goal_style', 4, 2], ['net_pattern', 6, 2], ['net2r', 0, 6], ['net2g', 6, 6], ['net2b', 4, 6],
    ['c1r', 2, 6], ['c1g', 0, 6], ['e_name', 6, 1], ['e_emblem', 7, 1], ['c2g', 0, 6], ['c2b', 6, 6], ['skip', 2],
    ['e_stadium', 6, 1], ['e_stadname', 7, 1], ['e_staddet', 0, 1], ['turf', 4, 4], ['side_color', 0, 4], ['seat_color', 4, 4], ['c1b', 0, 6], ['c2r', 6, 6],
    ['skip', 1], ['net1b', 0, 6], ['net_b7', 7, 1], ['net_design', 0, 4], ['skip', 0x37], ['rival1', 0, 32], ['rival2', 0, 32], ['rival3', 0, 32], ['skip', 4],
    ['str', 'name', 0x46], ['str', 'short', 4], ['str', 'stadium_name', 181],
    ['str', 'banner1', 16], ['str', 'banner2', 16], ['str', 'banner3', 16], ['str', 'banner4', 16],
  ];

  // Compile a field list into absolute bit offsets (replicates 4ccEditor read_data cursor rules)
  function compile(spec) {
    const out = {}; let cb = 0;
    for (const f of spec) {
      if (f[0] === 'skip') { cb += f[1]; continue; }
      if (f[0] === 'str') { out[f[1]] = { str: true, off: cb, len: f[2] }; cb += f[2]; continue; }
      const [k, sb, n] = f; const pos = cb * 8 + sb;
      out[k] = { bit: pos, n }; cb += Math.floor((sb + n) / 8);
    }
    return out;
  }
  const PF = compile(P), TF = compile(T);

  function getBits(d, pos, n) { let v = 0; for (let i = 0; i < n; i++) { const p = pos + i; if ((d[p >> 3] >> (p & 7)) & 1) v += 2 ** i; } return v; }
  function setBits(d, pos, n, v) { for (let i = 0; i < n; i++) { const p = pos + i, m = 1 << (p & 7); if (Math.floor(v / 2 ** i) & 1) d[p >> 3] |= m; else d[p >> 3] &= ~m; } }
  const td = new TextDecoder('utf-8'), te = new TextEncoder();
  function getStr(d, off, len) { const b = d.subarray(off, off + len); const z = b.indexOf(0); return td.decode(z < 0 ? b : b.subarray(0, z)); }
  function setStr(d, off, len, s) {
    let b = te.encode(s);
    while (b.length > len - 1) { s = s.slice(0, -1); b = te.encode(s); }
    d.fill(0, off, off + len); d.set(b, off);
  }

  function makeAccessor(fields) {
    return {
      get(d, base, k) { const f = fields[k]; return f.str ? getStr(d, base + f.off, f.len) : getBits(d, base * 8 + f.bit, f.n); },
      set(d, base, k, v) { const f = fields[k]; if (f.str) setStr(d, base + f.off, f.len, v); else setBits(d, base * 8 + f.bit, f.n, Math.max(0, Math.min(2 ** f.n - 1, Math.round(v)))); },
      max(k) { return 2 ** fields[k].n - 1; },
      has: k => k in fields,
    };
  }
  const player = makeAccessor(PF), team = makeAccessor(TF);
  const u32 = (d, o) => d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | ((d[o + 3] << 24) >>> 0);
  const w32 = (d, o, v) => { d[o] = v & 255; d[o + 1] = (v >>> 8) & 255; d[o + 2] = (v >>> 16) & 255; d[o + 3] = (v >>> 24) & 255; };
  const u16 = (d, o) => d[o] | (d[o + 1] << 8);

  function index(d, game) {
    const L = LAYOUT[game];
    const nPlayers = u16(d, 96), nTeams = u16(d, 100);
    const players = [], byId = new Map();
    for (let i = 0; i < nPlayers; i++) {
      const base = PLAYER_START + i * PLAYER_SIZE;
      const p = { i, base, id: u32(d, base) >>> 0 };
      players.push(p); byId.set(p.id, p);
    }
    const teams = [], teamById = new Map();
    for (let i = 0; i < nTeams; i++) {
      const base = TEAM_START + i * L.teamSize;
      const t = { i, base, id: u32(d, base) >>> 0 };
      teams.push(t); teamById.set(t.id, t);
    }
    for (let i = 0; i < nTeams; i++) {
      const rb = L.roster + i * 0x11C;
      const t = teamById.get(u32(d, rb) >>> 0);
      if (!t) continue;
      t.rosterBase = rb;
      const tb = L.tactics + i * 0x274;
      const tt = teamById.get(u32(d, tb) >>> 0);
      if (tt) tt.tacticsBase = tb;
    }
    return { nPlayers, nTeams, players, byId, teams, teamById };
  }
  function roster(d, t) {
    const out = [];
    if (t.rosterBase == null) return out;
    for (let k = 0; k < 40; k++) {
      const pid = u32(d, t.rosterBase + 4 + k * 4) >>> 0;
      if (!pid) continue;
      out.push({ slot: k, pid, number: u16(d, t.rosterBase + 4 + 160 + k * 2) });
    }
    return out;
  }
  function setNumber(d, t, slot, num) { const o = t.rosterBase + 4 + 160 + slot * 2; d[o] = num & 255; d[o + 1] = (num >> 8) & 255; }
  function setRosterPlayer(d, t, slot, pid) { w32(d, t.rosterBase + 4 + slot * 4, pid >>> 0); }
  function starters(d, t) { if (t.tacticsBase == null) return []; const o = t.tacticsBase + 4 + 0x1E0; return Array.from(d.subarray(o, o + 11)); }
  function setStarter(d, t, i, slot) { if (t.tacticsBase != null) d[t.tacticsBase + 4 + 0x1E0 + i] = slot; }
  function captainSlot(d, t) { return t.tacticsBase == null ? -1 : d[t.tacticsBase + 4 + 0x211]; }
  function setCaptainSlot(d, t, s) { if (t.tacticsBase != null) d[t.tacticsBase + 4 + 0x211] = s; }
  return { player, team, index, roster, starters, setStarter, setNumber, setRosterPlayer, captainSlot, setCaptainSlot, PLAYER_FIELDS: PF, TEAM_FIELDS: TF };
})();
