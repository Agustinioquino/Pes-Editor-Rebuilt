// Exportar a CSV de PES2020Editor (js/pes20csv.js): un jugador real del EDIT tiene que salir igual,
// columna por columna, a como lo exporta PES2020Editor, y el CSV leído de vuelta tiene que dar los mismos campos.
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load");

const C = load("pes20csv.js", "Pes20Csv");

// Campos leídos del EDIT (PesData.player.get) y la fila que exportó PES2020Editor para el mismo jugador.
const FIELDS = {"id":34862,"name":"Burak Yilmaz","shirt":"BURAK","shirt_nt":"","comm_id":34862,"nation":190,"height":188,"weight":0,"age":31,"strong_foot":0,"play_style":0,"reg_pos":12,"pos12":0,"pos9":0,"pos10":0,"pos11":0,"pos5":0,"pos6":0,"pos7":0,"pos8":0,"pos4":0,"pos2":0,"pos3":0,"pos1":0,"pos0":0,"atk":99,"ball_ctrl":99,"drib":96,"tight_pos":99,"lowpass":99,"loftpass":98,"finish":99,"header":95,"place_kick":99,"swerve":97,"speed":99,"exp_pwr":95,"kick_pwr":99,"jump":99,"phys_cont":99,"body_ctrl":92,"stamina":99,"def":91,"ball_win":94,"aggres":99,"gk":40,"catching":40,"clearing":40,"reflex":40,"cover":40,"weak_use":2,"weak_acc":2,"form":5,"injury":0,"star":4,"mo_hunchd":0,"mo_armd":0,"mo_hunchr":0,"mo_armr":0,"mo_ck":0,"mo_fk":0,"mo_pk":0,"play_attit":0,"com0":0,"com1":0,"com2":0,"com3":0,"com4":0,"com5":0,"com6":0,"sk0":0,"sk28":0,"sk1":0,"sk2":0,"sk3":0,"sk29":0,"sk4":0,"sk5":0,"sk30":0,"sk6":0,"sk7":0,"sk31":0,"sk39":0,"sk8":0,"sk32":0,"sk33":0,"sk9":0,"sk10":0,"sk11":0,"sk12":0,"sk40":0,"sk13":0,"sk14":0,"sk15":0,"sk16":0,"sk34":0,"sk17":0,"sk18":0,"sk35":0,"sk19":0,"sk20":0,"sk36":0,"sk37":0,"sk21":0,"sk22":0,"sk23":0,"sk38":0,"sk24":0,"sk25":0,"sk26":0,"sk27":0,"gc1":0,"gc2":0,"mo_drib":0,"strong_hand":0,"e_player":1,"e_basic":1,"e_regpos":1,"e_playpos":1,"e_ability":1,"e_skill":1,"e_style":1,"e_com":1,"e_motion":1};
const ROW = "34862;Burak Yilmaz;;BURAK;;34862;190;0;188;0;31;False;0;12;0;0;0;0;0;0;0;0;0;0;0;0;0;99;99;96;99;99;98;99;95;99;97;99;95;99;99;99;92;99;91;94;99;40;40;40;40;40;3;3;6;1;5;0;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;0;0;1;1;1;1;1;1;1;0;0;0;1/1/0001 00:00:00;1/1/0001 00:00:00;0;0;False;False;False;True;True;True;True;True;True;True;True;True;False;False;False;False;False;False;False;0;False;-1;0;0;0;0;0;True;106";
const g = k => FIELDS[k];

test("la fila del jugador es igual a la de PES2020Editor", () => {
  const row = C.playerRow(g, { inEdit: true, look: false, rating: 106 });
  assert.equal(row.length, C.PLAYER_HEAD.length);
  const want = ROW.split(";");
  row.forEach((v, i) => assert.equal(v, want[i], C.PLAYER_HEAD[i]));
});

test("el CSV se lee de vuelta con los mismos campos", () => {
  const back = C.playerFields(ROW.split(";"));
  for (const [k, v] of Object.entries(back)) assert.equal(v, FIELDS[k], k);
});

test("el archivo lleva BOM, punto y coma y fin de línea de Windows", () => {
  const txt = C.file(C.PLAYER_HEAD, [C.playerRow(g, { inEdit: true, look: false, rating: 106 })]);
  assert.ok(txt.startsWith("\uFEFFId;Name;JapName;"));
  assert.ok(txt.endsWith("\r\n"));
  const p = C.parse(txt);
  assert.equal(p.head.join(";"), C.PLAYER_HEAD.join(";"));
  assert.equal(p.rows[0].join(";"), ROW);
});

test("el equipo tiene las columnas de PES2020Editor y los kits en orden", () => {
  const t = { id: 109, name: "Real Madrid CF", nation: 0, stadium: 0, coach: 0, rival1: 262143, rival2: 262143, rival3: 262143 };
  const row = C.teamRow(k => t[k] ?? 0, { national: false, kits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
  assert.equal(row.length, C.TEAM_HEAD.length);
  const at = k => row[C.TEAM_HEAD.indexOf(k)];
  assert.equal(at("Id"), "109");
  assert.equal(at("Kit1"), "1");
  assert.equal(at("Kit10"), "10");
  assert.equal(at("EditRivals"), "False");
  assert.equal(at("National"), "False");
});

test("los ; y saltos de línea de un nombre no rompen el CSV", () => {
  const p = C.parse(C.file(["Id", "Name"], [["1", "A;B\r\nC"]]));
  assert.deepEqual([...p.rows[0]], ["1", "A B  C"]);
});
