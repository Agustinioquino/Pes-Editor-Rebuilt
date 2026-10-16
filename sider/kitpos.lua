--[[
  kitpos.lua  -  Posicionamiento libre (sin pasos) de nombre y numeros del kit
  PES 2021 + sider. Requiere LuaJIT FFI (luajit.ext.enabled = 1).

  Como funciona:
  - El juego convierte los enteros del kit (NameY 0-39, etc.) en floats; este modulo
    engancha PES2021.exe+1EAC232, justo despues de esa conversion, y pisa los floats.
  - Cada kit se identifica por una "ranura" (Unk_Offset0x24_Bits0to4, 1..31) que el
    juego no usa. Con el mapa por equipo el modulo pone esa ranura SOLO; no hace falta
    tocar nada en los config.txt.

  Archivo: content\kitpos\kitpos_slots.ini  (lo escribe la tecla 4 y Kit Studio Pro)

      [equipo 1234]          ; todos los kits de jugador del equipo 1234
      NameY = 0.21
      [equipo 1234 p2]       ; solo el 2do kit (p1..p10); pisa lo de [equipo 1234]
      BackNumberY_steps = 14.5
      [equipo 1234 gk]       ; kit de arquero
      NameSize = 1.2
      [3]                    ; ranura manual 3 (para kits con Unk_Offset0x24_Bits0to4 = 3)
      NameY = 0.30

  Campos: NameY NameSize NameStretch BackNumberY BackNumberSize BackNumberSpacing
          ChestNumberX ChestNumberY ChestNumberSize
          ShortsNumberX ShortsNumberY ShortsNumberSize
  Valor float directo, o Campo_steps = n (pasos del juego, admite decimales).
  (ShortsNumberY no admite _steps porque depende de ShortsNumberSide)

  Editor en el overlay (mientras esta visible, el juego no recibe teclas):
    Flechas arriba/abajo elegir campo | izq/der mover (Ctrl fino, Shift grueso)
    M: pasar el numero del short a la otra pierna (espejo, como cambiar ShortsNumberSide)
    Tab: este kit / todo el equipo | Supr: volver al juego | G guardar | C recargar
    Espacio: ocultar overlay y devolver el control al juego
    L: cambiar idioma espanol / English   ([opciones] idioma = es | en)
    RePag/AvPag: pagina 2 = opciones del kit (se guardan en el config.txt de kserv)
    Z o Ctrl+Z: deshacer | V: refrescar la vista del uniforme en el juego

  Formulas del juego (paso entero n -> float):
      NameY            = 0.05 + n*0.37/39        (n 0-39)
      NameSize         = 0.9  + n*1.5/20         (n 0-20)
      BackNumberY      = 1.2  - n*1.2/29         (n 0-29)
      BackNumberSize   = n/28                    (n 0-28)
      BackNumberSpacing= n/14                    (n 0-14)
      ChestNumberX     = 0.4  + n*0.207/29       (n 0-29)
      ChestNumberY     = 0.78 - n*0.24/29        (n 0-29)
      ChestNumberSize  = 0.6  + n*1.2/28         (n 0-28)
      ShortsNumberX    = 0.9  - n*0.14/29        (n 0-29)  horizontal en el short
      ShortsNumberY    = lado 1: 0.04 + n*0.19/29 | lado 0: 0.96 - n*0.19/29  (altura; depende del lado)
      ShortsNumberSize = 0.6  + n*1.2/28         (n 0-28)
      NameStretch      = 0.5  + n*0.5/3          (n 0-3; 0 en el kit = 3) separacion de letras del nombre
]]

local m = { version = "6.4" }

local HOOK_ADDR = 0x141EAC232
local HOOK_ORIG = "\x44\x0F\xB6\x47\x15"     -- movzx r8d, byte [rdi+15]
local RET_ADDR  = HOOK_ADDR + 5
-- Cueva (una sola reserva de 0x2000 bytes):
--   A 0x000  forma del uniforme: escribe los floats del kit y la forma del nombre codificada
--   B 0x138  radio de la curva del nombre (forma 4 = curva libre de KitPos)
--   C 0x17F  inicio de la textura del nombre: limpia la forma y suma la separacion al ancho total
--   D 0x1D9  avance entre letras: separacion extra por letra
--   E 0x227  ajuste vertical por forma (la curva libre usa el de la curva leve)
-- Forma codificada en obj+0x44: base | 0x80 | ranura<<8 | gen<<13 (0x40 = dejar la del kit)
--   H1..H6 (0x24F..0x527) minusculas: busqueda de letras, coordenadas, ancho y sin mayusculas
local OFF_TABLE, STRIDE = 0x800, 128
local OFF_B, OFF_C, OFF_D, OFF_E = 0x138, 0x17F, 0x1D9, 0x227
local OFF_H1, OFF_H2, OFF_H3, OFF_H4, OFF_H5, OFF_H6 = 0x24F, 0x319, 0x3D2, 0x40F, 0x482, 0x4C7
local OFF_RET, OFF_RETB1, OFF_RETB2, OFF_RETC, OFF_RETD, OFF_RETE, OFF_RETE0 =
      0x650, 0x658, 0x660, 0x668, 0x670, 0x678, 0x680
local OFF_RETH2, OFF_RETH3, OFF_RETH5, OFF_RETH7, OFF_RETH9 = 0x688, 0x690, 0x698, 0x6A0, 0x6A8
local OFF_ORIGD80, OFF_ORIGE60, OFF_HITS = 0x6B8, 0x6C0, 0x6C8
local OFF_MISSIDX, OFF_MISSBUF = 0x6E0, 0x6F0     -- ultimas 16 letras que no estaban en minusculas.txt
local OFF_H7, OFF_H9, OFF_STR1 = 0x540, 0x5CB, 0x3E00
local OFF_NMCOUNT, OFF_NMTABLE, NMMAX = 0x3F00, 0x4000, 128   -- tabla de nombres (nombres.txt)
-- H10: el juego pasa el nombre del uniforme por una conversion (mayusculas y sin acentos) al
-- armar el modelo del jugador (0x141EA99E0, llamada desde 0x1423E99E3). Con minusculas_juego = 1
-- KitPos la saltea y el nombre llega tal cual esta en la base de datos.
local OFF_H10, OFF_ORIGA99E0, OFF_LOWERALL = 0x61D, 0x6B0, 0x6D4
local CONV_SITE, CONV_ORIG, CONV_FUNC = 0x1423E99E3, "\xE8\xF8\xFF\xAB\xFF", 0x141EA99E0
-- H11: el editor del juego ("Nombre en el uniforme") filtra lo que se escribe con 0x140CC7610,
-- que por cada letra llama a 0x141EAB9F0 (letra -> mayuscula; 0 = letra no permitida).
-- Con minusculas_juego = 1 se guarda la letra tal como se escribio (minusculas y acentos) y,
-- ademas de las letras que acepta el juego, se aceptan las que tiene la fuente de KitPos
-- (minusculas.txt: polaco, checo, hungaro, rumano, baltico, cirilico, griego...).
-- (agrupado en una tabla: el archivo esta cerca del limite de 200 variables locales de Lua)
-- segunda llamada a la misma conversion (0x141ECD431): la usa el juego al volver a armar el
-- uniforme (por ejemplo cuando KitPos refresca el kit al cambiar opciones del nombre)
local ext = { conv2_site = 0x141ECD431, conv2_orig = "\xE8\xAA\xC5\xFD\xFF",
              off_h11 = 0x740, off_orig = 0x788,
              edit_site = 0x140CC764C, edit_orig = "\xE8\x9F\x43\x1E\x01", edit_func = 0x141EAB9F0,
              edit_ok = false, glyph_codes = {}, charmap_done = false,
              -- fuentes por kit: content\kit-server\...\<kit>\kitpos_letras.txt (la genera
              -- el creador de fuentes de KitPos junto con uXXXXpY_name.dds/.ftex)
              off_acount = 0xA000, off_atable = 0xA010, amax = 2048,
              fonts = {}, slot_font = {}, kc = {}, team_font = {}, dirty = false }
local lower_game, conv_ok = true, false
-- tabla de letras de minusculas.txt: hasta 512 (latin completo, cirilico y griego)
local OFF_GCOUNT, OFF_GTABLE, GSTRIDE, GMAX = 0x1800, 0x6000, 32, 512
local CAVE_CODE = "\x9C\x50\x51\x52\xFF\x05\xBE\x06\x00\x00\x8B\x47\x24\x83\xE0\x1F\x0F\x84\x13\x01\x00\x00\x48\x8D\x0D\xE3\x07\x00\x00\xC1\xE0\x07\x48\x01\xC1\x8B\x11\x85\xD2\x0F\x84\xFC\x00\x00\x00\x48\x8B\x46\x08\x48\x85\xC0\x0F\x84\xEF\x00\x00\x00\xF7\xC2\x01\x00\x00\x00\x74\x08\x44\x8B\x41\x04\x44\x89\x40\x40\xF7\xC2\x02\x00\x00\x00\x74\x08\x44\x8B\x41\x08\x44\x89\x40\x48\xF7\xC2\x04\x00\x00\x00\x74\x08\x44\x8B\x41\x0C\x44\x89\x40\x5C\xF7\xC2\x08\x00\x00\x00\x74\x08\x44\x8B\x41\x10\x44\x89\x40\x58\xF7\xC2\x10\x00\x00\x00\x74\x08\x44\x8B\x41\x14\x44\x89\x40\x60\xF7\xC2\x20\x00\x00\x00\x74\x08\x44\x8B\x41\x18\x44\x89\x40\x74\xF7\xC2\x40\x00\x00\x00\x74\x08\x44\x8B\x41\x1C\x44\x89\x40\x78\xF7\xC2\x80\x00\x00\x00\x74\x08\x44\x8B\x41\x20\x44\x89\x40\x70\xF7\xC2\x00\x01\x00\x00\x74\x0B\x44\x8B\x41\x24\x44\x89\x80\x90\x00\x00\x00\xF7\xC2\x00\x02\x00\x00\x74\x0B\x44\x8B\x41\x28\x44\x89\x80\x8C\x00\x00\x00\xF7\xC2\x00\x04\x00\x00\x74\x0B\x44\x8B\x41\x2C\x44\x89\x80\x88\x00\x00\x00\xF7\xC2\x00\x08\x00\x00\x74\x08\x44\x8B\x41\x30\x44\x89\x40\x4C\xF7\xC2\x00\x10\x00\x00\x74\x1E\x44\x8B\x41\x34\x41\xF7\xC0\x40\x00\x00\x00\x74\x0D\x41\x83\xE0\x80\x8B\x50\x44\x83\xE2\x3F\x41\x09\xD0\x44\x89\x40\x44\x5A\x59\x58\x9D\x44\x0F\xB6\x47\x15\xFF\x25\x18\x05\x00\x00\x0F\x57\xFF\xF3\x0F\x11\x7C\x24\x40\x83\xFF\x04\x75\x33\x51\x50\x8B\x8D\x80\x02\x00\x00\xC1\xE9\x08\x83\xE1\x1F\xC1\xE1\x07\x48\x8D\x05\xA2\x06\x00\x00\x48\x01\xC8\xF3\x0F\x10\x78\x3C\xF3\x0F\x11\x7C\x24\x50\xF3\x0F\x10\x78\x38\x58\x59\xFF\x25\xE7\x04\x00\x00\xFF\x25\xD9\x04\x00\x00\x8B\xBD\x80\x02\x00\x00\xF7\xC7\x80\x00\x00\x00\x74\x46\x50\x51\x89\xF8\x83\xE7\x3F\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x48\x8D\x0D\x5C\x06\x00\x00\x48\x01\xC1\xF7\x01\x00\x20\x00\x00\x74\x22\x44\x89\xE8\x83\xE8\x01\x7E\x1A\xF3\x0F\x2A\xC0\xF3\x0F\x59\x41\x44\xF3\x0F\x2D\xC0\x66\x01\xC2\x66\x83\xFA\x01\x7D\x04\x66\xBA\x01\x00\x59\x58\xFF\x25\x8F\x04\x00\x00\xF3\x44\x0F\x10\x6C\x24\x4C\xF3\x44\x0F\x5C\xE8\x50\x51\x8B\x85\x80\x02\x00\x00\xA9\x80\x00\x00\x00\x74\x2B\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x48\x8D\x0D\xFC\x05\x00\x00\x48\x01\xC1\xF7\x01\x00\x20\x00\x00\x74\x10\xF3\x0F\x10\x41\x44\xF3\x0F\x59\x44\x24\x68\xF3\x44\x0F\x5C\xE8\x59\x58\xFF\x25\x49\x04\x00\x00\xF7\xC1\x80\x00\x00\x00\x74\x0D\x83\xE1\x3F\x83\xF9\x04\x75\x05\xB9\x01\x00\x00\x00\x85\xC9\x74\x09\x83\xE9\x01\xFF\x25\x2F\x04\x00\x00\xFF\x25\x31\x04\x00\x00\x8B\x85\x80\x02\x00\x00\xA9\x80\x00\x00\x00\x0F\x84\xB3\x00\x00\x00\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x4C\x8D\x15\x90\x05\x00\x00\x41\xF7\x04\x02\x00\x40\x00\x00\x0F\x84\x95\x00\x00\x00\x44\x8B\x5C\x24\x30\x49\x01\xC2\x41\x8B\x42\x48\x4D\x8B\x52\x50\x90\x90\x85\xC0\x74\x0D\x45\x39\x1A\x74\x38\x49\x83\xC2\x20\xFF\xC8\xEB\xEF\x8B\x05\x39\x04\x00\x00\x83\xE0\x0F\x4C\x8D\x15\x3F\x04\x00\x00\x45\x89\x1C\x82\xFF\x05\x25\x04\x00\x00\xC6\x01\x00\x31\xC0\x89\x02\x41\x89\x00\x41\x89\x01\x4C\x8B\x54\x24\x28\x41\x89\x02\xC3\xC6\x01\x00\x41\x8B\x42\x10\x89\x02\x41\x8B\x42\x14\x41\x89\x00\x41\x0F\xB7\x42\x04\xF3\x0F\x2A\xC0\xF3\x0F\x59\x05\xDA\x03\x00\x00\xF3\x41\x0F\x11\x01\x41\x0F\xB7\x42\x06\xF3\x0F\x2A\xC0\xF3\x0F\x59\x05\xC8\x03\x00\x00\x4C\x8B\x54\x24\x28\xF3\x41\x0F\x11\x02\xC3\xFF\x25\x9F\x03\x00\x00\x50\x41\x52\x41\x53\x8B\x85\x80\x02\x00\x00\xA9\x80\x00\x00\x00\x0F\x84\x93\x00\x00\x00\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x4C\x8D\x15\xC1\x04\x00\x00\x41\xF7\x04\x02\x00\x40\x00\x00\x74\x79\x45\x8B\x1F\x49\x01\xC2\x41\x8B\x42\x48\x4D\x8B\x52\x50\x90\x90\x85\xC0\x74\x65\x45\x39\x1A\x74\x08\x49\x83\xC2\x20\xFF\xC8\xEB\xEF\xF3\x41\x0F\x10\x42\x18\xF3\x0F\x11\x85\x04\x01\x00\x00\xF3\x0F\x11\x85\x20\x01\x00\x00\xF3\x41\x0F\x10\x42\x10\xF3\x0F\x11\x85\x3C\x01\x00\x00\xF3\x0F\x11\x85\x58\x01\x00\x00\xF3\x41\x0F\x10\x42\x14\xF3\x0F\x11\x85\x08\x01\x00\x00\xF3\x0F\x11\x85\x40\x01\x00\x00\xF3\x41\x0F\x10\x42\x1C\xF3\x0F\x11\x85\x24\x01\x00\x00\xF3\x0F\x11\x85\x5C\x01\x00\x00\x41\x5B\x41\x5A\x58\xF3\x41\x0F\x59\xEB\xFF\x25\xB6\x02\x00\x00\x41\x0F\x95\xC1\x49\x89\xD8\x50\x41\x52\x8B\x85\x80\x02\x00\x00\xA9\x80\x00\x00\x00\x74\x1D\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x4C\x8D\x15\x07\x04\x00\x00\x41\xF7\x04\x02\x00\x40\x00\x00\x74\x03\x41\xB1\x01\x41\x5A\x58\xFF\x25\x81\x02\x00\x00\x8B\x85\x80\x02\x00\x00\xA9\x80\x00\x00\x00\x74\x60\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x4C\x8D\x15\xD4\x03\x00\x00\x41\xF7\x04\x02\x00\x40\x00\x00\x74\x46\x4D\x8D\x0C\x02\x90\x53\x56\x48\x89\xCE\x89\xD3\x45\x31\xC0\x85\xDB\x74\x2C\x44\x8B\x1E\x41\x8B\x41\x48\x4D\x8B\x51\x50\x85\xC0\x74\x15\x45\x39\x1A\x74\x08\x49\x83\xC2\x20\xFF\xC8\xEB\xEF\x41\x0F\xB7\x42\x04\x41\x01\xC0\x48\x83\xC6\x04\xFF\xCB\x75\xD4\x41\x0F\xB7\xC0\x5E\x5B\xC3\xFF\x25\x3E\x02\x00\x00\x44\x0F\xB6\x4C\x24\x30\x50\x41\x52\x49\x8B\x47\x08\x48\x85\xC0\x74\x2A\x8B\x40\x44\xA9\x80\x00\x00\x00\x74\x20\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x4C\x8D\x15\x52\x03\x00\x00\x41\xF7\x04\x02\x00\x40\x00\x00\x74\x06\x41\xB9\x01\x00\x00\x00\x41\x5A\x58\xFF\x25\xD1\x01\x00\x00\x49\x8B\x47\x08\x48\x85\xC0\x74\x6A\x8B\x40\x44\xA9\x80\x00\x00\x00\x74\x60\xC1\xE8\x08\x83\xE0\x1F\xC1\xE0\x07\x4C\x8D\x15\x16\x03\x00\x00\x41\xF7\x04\x02\x00\x40\x00\x00\x74\x46\x4D\x8D\x0C\x02\x90\x53\x56\x48\x89\xCE\x89\xD3\x45\x31\xC0\x85\xDB\x74\x2C\x44\x8B\x1E\x41\x8B\x41\x48\x4D\x8B\x51\x50\x85\xC0\x74\x15\x45\x39\x1A\x74\x08\x49\x83\xC2\x20\xFF\xC8\xEB\xEF\x41\x0F\xB7\x42\x04\x41\x01\xC0\x48\x83\xC6\x04\xFF\xCB\x75\xD4\x41\x0F\xB7\xC0\x5E\x5B\xC3\xFF\x25\x80\x01\x00\x00\x50\x41\x52\x41\x53\x51\x49\x89\xC2\x4C\x8D\x1D\xB0\x38\x00\x00\xB9\x2E\x00\x00\x00\x4D\x85\xD2\x74\x19\x41\x0F\xB6\x02\x41\x88\x03\x84\xC0\x74\x0E\x49\xFF\xC2\x49\xFF\xC3\xFF\xC9\x75\xEB\x41\xC6\x03\x00\x59\x41\x5B\x41\x5A\x58\x51\x52\x41\x52\x41\x53\x44\x8B\x15\x7A\x39\x00\x00\x4C\x8D\x1D\x73\x3A\x00\x00\x45\x85\xD2\x74\x28\x31\xC9\x0F\xB6\x14\x08\x41\x3A\x14\x0B\x75\x13\x84\xD2\x74\x09\xFF\xC1\x83\xF9\x1F\x72\xEB\xEB\x06\x49\x8D\x43\x20\xEB\x09\x49\x83\xC3\x40\x41\xFF\xCA\xEB\xD3\x41\x5B\x41\x5A\x5A\x59\x48\x89\x44\x24\x40\xFF\x25\xD5\x00\x00\x00\x51\x52\x41\x52\x41\x53\x44\x8B\x15\x28\x39\x00\x00\x4C\x8D\x1D\x21\x3A\x00\x00\x45\x85\xD2\x74\x28\x31\xC9\x0F\xB6\x14\x08\x41\x3A\x14\x0B\x75\x13\x84\xD2\x74\x09\xFF\xC1\x83\xF9\x1F\x72\xEB\xEB\x06\x49\x8D\x43\x20\xEB\x09\x49\x83\xC3\x40\x41\xFF\xCA\xEB\xD3\x41\x5B\x41\x5A\x5A\x59\x48\x89\x44\x24\x20\xFF\x25\x8B\x00\x00\x00\x80\x3D\xB0\x00\x00\x00\x00\x74\x21\x48\x85\xD2\x74\x1B\x31\xC0\x45\x0F\xB6\x0C\x00\x44\x88\x0C\x02\x45\x84\xC9\x74\x0B\xFF\xC0\x83\xF8\x3C\x72\xEB\xC6\x04\x02\x00\xC3\xFF\x25\x63\x00\x00\x00\x0F\x1F\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x80\x3A\x00\x00\x80\x3B\x00\x90\x66\x2E\x0F\x1F\x84\x00\x00\x00\x00\x00\x00\x00\x00\x00\x90\x66\x66\x2E\x0F\x1F\x84\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x80\x3D\x8D\xFF\xFF\xFF\x00\x74\x37\x53\x48\x83\xEC\x20\x89\xCB\xFF\x15\x32\x00\x00\x00\x85\xC0\x75\x1E\x8B\x05\xA0\x98\x00\x00\x4C\x8D\x15\xA9\x98\x00\x00\x85\xC0\x74\x0F\x41\x39\x1A\x74\x08\x49\x83\xC2\x04\xFF\xC8\xEB\xEF\x89\xD8\x48\x83\xC4\x20\x5B\xC3\xFF\x25\x02\x00\x00\x00\x66\x90\x00\x00\x00\x00\x00\x00\x00\x00"
-- ganchos del nombre: { direccion, bytes originales, offset en la cueva }
local NAME_HOOKS = {
    { 0x1419E7617, "\x0F\x57\xFF\xF3\x0F\x11\x7C\x24\x40", OFF_B },              -- radio de la curva
    { 0x1419E739C, "\x8B\xBD\x80\x02\x00\x00", OFF_C },                          -- mov edi,[rbp+280]
    { 0x1419E7F4D, "\xF3\x44\x0F\x10\x6C\x24\x4C\xF3\x44\x0F\x5C\xE8", OFF_D },   -- avance del cursor
    { 0x1419AA850, "\x85\xC9\x74\x2A\x83\xE9\x01", OFF_E },                      -- ajuste Y por forma
}
-- ganchos de minusculas: { direccion, bytes originales, offset, "jmp" o "call" }
local LOWER_HOOKS = {
    { 0x1419E74FA, "\xE8\x81\x28\x00\x00", OFF_H1, "call" },              -- busqueda de la letra
    { 0x1419E7565, "\xF3\x41\x0F\x59\xEB", OFF_H2, "jmp" },               -- coordenadas en la fuente
    { 0x1419E735F, "\x41\x0F\x95\xC1\x4C\x8B\xC3", OFF_H3, "jmp" },       -- sin mayusculas (textura)
    { 0x1419E7379, "\xE8\xE2\x2A\x00\x00", OFF_H4, "call" },              -- ancho del texto (textura)
    { 0x141A8B855, "\x44\x0F\xB6\x4C\x24\x30", OFF_H5, "jmp" },           -- sin mayusculas (camiseta)
    { 0x1419AA78D, "\xE8\xCE\xF6\x03\x00", OFF_H6, "call" },              -- ancho del texto (camiseta)
}
-- reemplazo de nombres (nombres.txt): el juego pasa el nombre del uniforme a mayusculas y
-- sin acentos antes de dibujarlo; KitPos lo cambia justo antes del dibujo y del ajuste
local DIAG_HOOKS = {
    { 0x141A87FBD, "\x48\x89\x44\x24\x40", OFF_H7, "jmp" },   -- nombre que se dibuja en la textura
    { 0x141A8EA09, "\x48\x89\x44\x24\x20", OFF_H9, "jmp" },   -- nombre que se ajusta a la camiseta
}
local DIAG_RETS = { { OFF_RETH7, 0x141A87FC2 }, { OFF_RETH9, 0x141A8EA0E } }
local name_count = 0
local diag_ok = false
local LOWER_RETS = {
    { OFF_RETH2, 0x1419E756A }, { OFF_RETH3, 0x1419E7366 }, { OFF_RETH5, 0x141A8B85B },
    { OFF_ORIGD80, 0x1419E9D80 }, { OFF_ORIGE60, 0x1419E9E60 },
}
local lower_ok, glyph_count = false, 0
local NAME_RETS = {
    { OFF_RETB1, 0x1419E7620 }, { OFF_RETB2, 0x1419E7651 }, { OFF_RETC, 0x1419E73A2 },
    { OFF_RETD, 0x1419E7F59 }, { OFF_RETE, 0x1419AA857 }, { OFF_RETE0, 0x1419AA87E },
}
local CURVE_K, CURVE_A = nil, nil   -- constantes del juego (se leen al instalar)
local curve_comp = 1               -- [opciones] curva_ajuste: cuanto se corrige el corrimiento
local curve_ok = false

local FIELDS = {
    "NameY", "NameSize", "BackNumberY", "BackNumberSize", "BackNumberSpacing",
    "ChestNumberX", "ChestNumberY", "ChestNumberSize",
    "ShortsNumberX", "ShortsNumberY", "ShortsNumberSize",
    "NameStretch",          -- indice 11 en el gancho (obj+0x4C): ancho del nombre
    "NameCurve",            -- bit 12: forma codificada (+0x34) + radios (+0x38, +0x3C)
    "NameSpacing",          -- bit 13: separacion extra entre letras del nombre (+0x44)
    "NameLower",            -- bit 14: minusculas (fuente generada por KitPos + minusculas.txt)
}
-- orden en pantalla (FIELDS es el orden del gancho y no se puede cambiar)
local DISPLAY = {
    "NameY", "NameSize", "NameStretch", "NameSpacing", "NameCurve",
    "BackNumberY", "BackNumberSize", "BackNumberSpacing",
    "ChestNumberX", "ChestNumberY", "ChestNumberSize",
    "ShortsNumberX", "ShortsNumberY", "ShortsNumberSize",
}
-- campo de escala de cada grupo (para ocultar/mostrar con O)
local GROUP_SIZE = {
    NameY = "NameSize", NameSize = "NameSize", NameStretch = "NameSize", NameCurve = "NameSize", NameSpacing = "NameSize",
    BackNumberY = "BackNumberSize", BackNumberSize = "BackNumberSize", BackNumberSpacing = "BackNumberSize",
    ChestNumberX = "ChestNumberSize", ChestNumberY = "ChestNumberSize", ChestNumberSize = "ChestNumberSize",
    ShortsNumberX = "ShortsNumberSize", ShortsNumberY = "ShortsNumberSize", ShortsNumberSize = "ShortsNumberSize",
}
local FIELD_IDX = {}
for i, f in ipairs(FIELDS) do FIELD_IDX[f] = i - 1 end

local STEPS = {
    NameY             = function(n) return 0.05 + n * 0.37 / 39 end,
    NameSize          = function(n) return 0.9 + n * 1.5 / 20 end,
    BackNumberY       = function(n) return 1.2 - n * 1.2 / 29 end,
    BackNumberSize    = function(n) return n / 28 end,
    BackNumberSpacing = function(n) return n / 14 end,
    ChestNumberX      = function(n) return 0.4 + n * 0.207 / 29 end,
    ChestNumberY      = function(n) return 0.78 - n * 0.24 / 29 end,
    ChestNumberSize   = function(n) return 0.6 + n * 1.2 / 28 end,
    ShortsNumberX     = function(n) return 0.9 - n * 0.14 / 29 end,   -- horizontal en el short
    ShortsNumberSize  = function(n) return 0.6 + n * 1.2 / 28 end,
    NameStretch       = function(n) return 0.5 + n * 0.5 / 3 end,     -- 0 en el kit = 3 (ancho normal)
}
-- ShortsNumberY (altura) depende del lado: ShortsNumberSide 1 = 0.04..0.23, 0 = 0.96..0.77
local function shorts_y(n, side)
    if side == 1 then return 0.04 + n * 0.19 / 29 end
    return 0.96 - n * 0.19 / 29
end

-- Curva del nombre: KitPos la mide como 1000 / radio (0 = recto, negativo = curva al reves).
-- Las 3 formas de kserv quedan en: leve 1.49, media 2.98, extrema 3.42.
local CURVE_OF_SHAPE = { [0] = 0, 1000 / 672, 1000 / 336, 1000 / 292 }
local CURVE_MIN = 0.05            -- por debajo de esto se dibuja recto (forma 0)
local function curve_to_steps(v)
    if v < 0 then return v / CURVE_OF_SHAPE[1] end
    for i = 1, 3 do
        local a, b = CURVE_OF_SHAPE[i - 1], CURVE_OF_SHAPE[i]
        if v <= b or i == 3 then return (i - 1) + (v - a) / (b - a) end
    end
end

-- Limites anchos, solo para que un valor absurdo (por ejemplo, tecla trabada) no mande
-- el numero fuera de la textura. No limitan el uso normal: van mucho mas alla del rango
-- del juego. Se pueden quitar con   [opciones]  limites = 0   en kitpos_slots.ini
local LIMITS = {
    NameY = { -1, 2 }, BackNumberY = { -1, 2 }, ChestNumberX = { -1, 2 }, ChestNumberY = { -1, 2 },
    ShortsNumberX = { -1, 2 }, ShortsNumberY = { -1, 2 },
    NameSize = { 0, 5 }, NameStretch = { 0, 5 }, BackNumberSize = { 0, 5 }, BackNumberSpacing = { -1, 5 },
    ChestNumberSize = { 0, 5 }, ShortsNumberSize = { 0, 5 }, NameCurve = { -20, 20 }, NameSpacing = { -40, 80 },
}
local limits_on = true
local image_on = true
local function clamp(f, v)
    local l = limits_on and LIMITS[f]
    if not l then return v end
    if v < l[1] then return l[1] end
    if v > l[2] then return l[2] end
    return v
end

local cave, ini_path, last_text, seed_paths, kitpos_dir
local manual = {}                -- manual[n][Campo]        secciones [n]
local teams = {}                 -- teams["1234"] / teams["1234/p2"] / teams["1234/gk"]
local dyn_slot, slot_owner = {}, {}   -- "1234/p2" -> ranura, ranura -> "1234/p2"
local ui = { sel = "NameY", kfield = 1, page = 1, team_wide = false, msg = "", dirty = false }
local STEP_SIZES = { 0.001, 0.005, 0.02, 0.1 }
local status = "hook_off"   -- clave de TXT; se traduce al mostrar
local status_arg = nil
local frame = 0
local slots_loaded = 0
local SLOT_KEY = "Unk_Offset0x24_Bits0to4"

-- ===================== idioma / language =====================
local lang = "es"
local TXT = {
  es = {
    hook_ok = "hook activo", hook_off = "hook sin instalar", no_ffi = "ERROR: sin FFI (luajit.ext.enabled = 1)",
    bad_bytes = "ERROR: bytes inesperados en el hook (%s)", no_mem = "ERROR: no se pudo reservar memoria",
    far = "ERROR: memoria demasiado lejos",
    header = "KITPOS v%s   %s   kits con ajustes: %d   uniformes armados: %d",
    enter_menu = "  Entra a la pantalla de uniformes (Editar > Equipos > Uniformes) para editar.",
    space_hide = "  Espacio: ocultar overlay",
    team_line = "Equipo %-6s  kit %-8s  Tab: %s   %s",
    gk = "arquero", mode_team = "[ todo el equipo ]  este kit", mode_kit = "  todo el equipo  [ este kit ]",
    unsaved = "* SIN GUARDAR *",
    side_line = "Short: ShortsNumberSide del kit = %s (kserv)", side = "lado %d",
    cols = "    CAMPO                   VALOR   PASO  CAMBIO  0 ... RANGO ... max  ORIGEN",
    compare_on = "<<< VIENDO EL ORIGINAL (sin KitPos) - B para volver a tus cambios >>>",
    compare_hint = "B: comparar antes / despues",
    letters_line = "Textura del nombre: mezcla de letras %d (K)   resolucion %sx (N)",
    letters_msg = "Mezcla de letras: modo %d (G para guardarlo)",
    res_msg = "Resolucion del nombre: %sx = %dx%d (G para guardarlo)",
    o_team = "equipo", o_kit = "kit", o_inh = "heredado", o_game = "juego",
    bar_help = "Barra: | donde estaba el kit   O donde esta ahora   < > fuera del rango del juego",
    st_fine = "fino = 1/4 de paso kserv", st_coarse = "grueso = 2 pasos kserv", st_normal = "normal = 1/2 paso kserv",
    help1 = "Arriba/abajo: elegir   Izq/der: mover   Ctrl: fino  Shift: grueso   [ahora: %s = %.4f]",
    help2 = "Supr: valor del juego   M: short a la otra pierna   G: guardar   C: recargar   L: English",
    help3 = "Espacio: ocultar overlay y devolver el control al juego (para girar o cambiar kit)",
    no_file = "Todavia no hay kitpos_slots.ini (se crea al guardar con G)",
    saved = "Guardado en content\\kitpos\\kitpos_slots.ini", reloaded = "Archivo recargado",
    mirrored = "Numero del short pasado a la otra pierna (%.4f)",
    cant_create = "no pude crear %s", cant_write = "fallo al escribir %s",
    lang_set = "Idioma: espanol (G para guardarlo)",
    undone = "Deshecho: %s", nothing_undo = "No hay nada para deshacer",
    refreshed = "Uniforme refrescado",
    help_undo = "Z / Ctrl+Z: deshacer   V: refrescar la vista del uniforme en el juego",
    help_hide = "O: ocultar / mostrar este elemento",
    name_off_note = "(se apaga el nombre del kit en kserv, G para guardarlo)",
    grp_NameSize = "Nombre", grp_BackNumberSize = "Dorsal", grp_ChestNumberSize = "Numero de pecho",
    grp_ShortsNumberSize = "Numero del short",
    hid_o = "O: mostrar", hid_k = "apagado en kserv   O: mostrar", need_page2 = "El nombre esta desactivado en la pagina 2 (Nombre en la camiseta)",
    hidden_msg = "%s: oculto", shown_msg = "%s: visible",
    page_pos = "Pagina 1/2: POSICIONES (KitPos)      RePag/AvPag: cambiar pagina",
    page_kit = "Pagina 2/2: OPCIONES DEL KIT (config.txt de kserv)   RePag/AvPag: cambiar pagina",
    kcols = "    OPCION                       VALOR              GUARDADO EN",
    k_file = "config.txt", k_kitpos = "kitpos",
    k_path = "Archivo: content\\kit-server\\%s\\config.txt",
    k_nomap = "Este equipo no esta en kit-server\\map.txt: los cambios se ven pero no se pueden guardar.",
    k_noorder = "No encontre la carpeta del kit en order.ini: los cambios se ven pero no se pueden guardar.",
    k_help1 = "Arriba/Abajo: elegir   Izq/Der: cambiar   Supr: volver a lo que dice el archivo",
    k_help2 = "G: guardar (config.txt + kitpos)   C: recargar   L: English   Espacio: ocultar",
    k_saved = "Guardado: %d config.txt de kserv + kitpos_slots.ini",
    k_changed = "* modificado *",
    vis_on = "Visible", vis_off = "Oculto",
    kf_Name = "Nombre en la camiseta", kf_NameShape = "Forma del nombre", kf_NameStretch = "Ancho del nombre",
    kf_BackNumberType = "Tipo de dorsal", kf_ShortsNumberSide = "Lado del numero del short",
    kf_TightKit = "Camiseta ajustada", kf_SleeveLimits = "Limite de mangas", kf_ShirtPattern = "Patron de camiseta",
    kf_Collar = "Cuello", kf_WinterCollar = "Cuello de invierno", kf_ShortSleevesModel = "Modelo manga corta",
    kf_ShortsModel = "Modelo de short",
    kf_vchest = "Numero de pecho", kf_vback = "Dorsal (numero de espalda)", kf_vshorts = "Numero del short",
    kf_vlower = "Minusculas en el nombre", lower_on = "Si", lower_off = "No", lower_na = "no disponible",
    lower_msg = "Minusculas: el kit tiene que usar la fuente de KitPos (%d letras cargadas)",
    lower_line = "Minusculas: %d letras en la fuente | pedidas y no encontradas: %s",
    names_line = "nombres.txt: %d nombres | el juego pide dibujar: '%s' (clave para nombres.txt)",
    NameY = "Nombre : altura", NameSize = "Nombre : escala", NameStretch = "Nombre : ancho", NameCurve = "Nombre : curva", NameSpacing = "Nombre : separacion",
    spacing_hint = "Separacion: espacio extra entre letras (0 = el del juego, negativo = mas juntas)",
    curve_hint = "Curva: 0 = recto | kserv: leve 1.49, media 2.98, extrema 3.42 | negativo = curva al reves",
    BackNumberY = "Dorsal : altura", BackNumberSize = "Dorsal : escala", BackNumberSpacing = "Dorsal : separacion",
    ChestNumberX = "Pecho  : horizontal", ChestNumberY = "Pecho  : altura", ChestNumberSize = "Pecho  : escala",
    ShortsNumberX = "Short  : horizontal", ShortsNumberY = "Short  : altura", ShortsNumberSize = "Short  : escala",
  },
  en = {
    hook_ok = "hook active", hook_off = "hook not installed", no_ffi = "ERROR: no FFI (set luajit.ext.enabled = 1)",
    bad_bytes = "ERROR: unexpected bytes at hook (%s)", no_mem = "ERROR: could not allocate memory",
    far = "ERROR: memory too far away",
    header = "KITPOS v%s   %s   adjusted kits: %d   kits built: %d",
    enter_menu = "  Go to the kit screen (Edit > Teams > Kits) to start editing.",
    space_hide = "  Space: hide overlay",
    team_line = "Team %-6s  kit %-8s  Tab: %s   %s",
    gk = "goalkeeper", mode_team = "[ whole team ]  this kit", mode_kit = "  whole team  [ this kit ]",
    unsaved = "* UNSAVED *",
    side_line = "Shorts: kit ShortsNumberSide = %s (kserv)", side = "side %d",
    cols = "    FIELD                   VALUE   STEP  CHANGE  0 ... RANGE ... max  SOURCE",
    compare_on = "<<< SHOWING THE ORIGINAL (no KitPos) - B to go back to your changes >>>",
    compare_hint = "B: compare before / after",
    letters_line = "Name texture: letter blend %d (K)   resolution %sx (N)",
    letters_msg = "Letter blend: mode %d (G to keep it)",
    res_msg = "Name resolution: %sx = %dx%d (G to keep it)",
    o_team = "team", o_kit = "kit", o_inh = "inherited", o_game = "game",
    bar_help = "Bar: | where the kit had it   O where it is now   < > outside the game range",
    st_fine = "fine = 1/4 kserv step", st_coarse = "coarse = 2 kserv steps", st_normal = "normal = 1/2 kserv step",
    help1 = "Up/Down: select   Left/Right: move   Ctrl: fine  Shift: coarse   [now: %s = %.4f]",
    help2 = "Del: game value   M: shorts number to other leg   G: save   C: reload   L: Espanol",
    help3 = "Space: hide overlay and give control back to the game (to rotate or change kit)",
    no_file = "No kitpos_slots.ini yet (it is created when you save with G)",
    saved = "Saved to content\\kitpos\\kitpos_slots.ini", reloaded = "File reloaded",
    mirrored = "Shorts number moved to the other leg (%.4f)",
    cant_create = "could not create %s", cant_write = "could not write %s",
    lang_set = "Language: English (press G to keep it)",
    undone = "Undone: %s", nothing_undo = "Nothing to undo",
    refreshed = "Kit refreshed",
    help_undo = "Z / Ctrl+Z: undo   V: refresh the kit view in the game",
    help_hide = "O: hide / show this element",
    name_off_note = "(turns the kit name off in kserv, G to save it)",
    grp_NameSize = "Name", grp_BackNumberSize = "Back number", grp_ChestNumberSize = "Chest number",
    grp_ShortsNumberSize = "Shorts number",
    hid_o = "O: show", hid_k = "off in kserv   O: show", need_page2 = "The name is turned off on page 2 (Name on shirt)",
    hidden_msg = "%s: hidden", shown_msg = "%s: visible",
    page_pos = "Page 1/2: POSITIONS (KitPos)      PgUp/PgDn: change page",
    page_kit = "Page 2/2: KIT OPTIONS (kserv config.txt)   PgUp/PgDn: change page",
    kcols = "    OPTION                       VALUE              SAVED IN",
    k_file = "config.txt", k_kitpos = "kitpos",
    k_path = "File: content\\kit-server\\%s\\config.txt",
    k_nomap = "This team is not in kit-server\\map.txt: changes are shown but cannot be saved.",
    k_noorder = "Kit folder not found in order.ini: changes are shown but cannot be saved.",
    k_help1 = "Up/Down: select   Left/Right: change   Del: back to the file value",
    k_help2 = "G: save (config.txt + kitpos)   C: reload   L: Espanol   Space: hide",
    k_saved = "Saved: %d kserv config.txt + kitpos_slots.ini",
    k_changed = "* modified *",
    vis_on = "Visible", vis_off = "Hidden",
    kf_Name = "Name on shirt", kf_NameShape = "Name shape", kf_NameStretch = "Name width",
    kf_BackNumberType = "Back number type", kf_ShortsNumberSide = "Shorts number side",
    kf_TightKit = "Tight kit", kf_SleeveLimits = "Sleeve limits", kf_ShirtPattern = "Shirt pattern",
    kf_Collar = "Collar", kf_WinterCollar = "Winter collar", kf_ShortSleevesModel = "Short sleeves model",
    kf_ShortsModel = "Shorts model",
    kf_vchest = "Chest number", kf_vback = "Back number", kf_vshorts = "Shorts number",
    kf_vlower = "Lowercase name", lower_on = "On", lower_off = "Off", lower_na = "not available",
    lower_msg = "Lowercase: the kit must use the KitPos font (%d letters loaded)",
    lower_line = "Lowercase: %d letters in the font | requested and missing: %s",
    names_line = "nombres.txt: %d names | the game asks to draw: '%s' (key for nombres.txt)",
    NameY = "Name   : height", NameSize = "Name   : scale", NameStretch = "Name   : width", NameCurve = "Name   : curve", NameSpacing = "Name   : spacing",
    spacing_hint = "Spacing: extra space between letters (0 = game default, negative = tighter)",
    curve_hint = "Curve: 0 = straight | kserv: light 1.49, medium 2.98, extreme 3.42 | negative = reversed curve",
    BackNumberY = "Back # : height", BackNumberSize = "Back # : scale", BackNumberSpacing = "Back # : spacing",
    ChestNumberX = "Chest #: horizontal", ChestNumberY = "Chest #: height", ChestNumberSize = "Chest #: scale",
    ShortsNumberX = "Shorts : horizontal", ShortsNumberY = "Shorts : height", ShortsNumberSize = "Shorts : scale",
  },
}
local function tr(k, ...)
    local t = TXT[lang] or TXT.es
    local str = t[k] or TXT.es[k] or k
    local args = { ... }
    if #args > 0 then return string.format(str, ... ) end
    return str
end


if ffi ~= nil then
    -- nombre propio (kp_) para no chocar con otros modulos que ya declaran VirtualAlloc
    ffi.cdef[[
    void* kp_VirtualAlloc(void* lpAddress, uint64_t dwSize, uint32_t flAllocationType, uint32_t flProtect) asm("VirtualAlloc");
    void* kp_CreateFileA(const char* name, uint32_t access, uint32_t share, void* sec, uint32_t disp, uint32_t flags, void* tmpl) asm("CreateFileA");
    int kp_WriteFile(void* h, const char* buf, uint32_t n, uint32_t* written, void* ov) asm("WriteFile");
    int kp_CloseHandle(void* h) asm("CloseHandle");
    int kp_CreateDirectoryA(const char* name, void* sec) asm("CreateDirectoryA");
    typedef struct { void* BaseAddress; void* AllocationBase; uint32_t AllocationProtect; uint16_t PartitionId;
                     uint64_t RegionSize; uint32_t State; uint32_t Protect; uint32_t Type; } kp_MBI;
    uint64_t kp_VirtualQuery(const void* addr, kp_MBI* info, uint64_t len) asm("VirtualQuery");
    ]]
end

local function ptr(p) return tonumber(ffi.cast("uint64_t", p)) end

local function alloc_near(target, size)
    local GRAN = 0x10000
    local base = target - (target % GRAN)
    for i = 1, 8192 do
        for _, d in ipairs({ -(i * GRAN), i * GRAN }) do
            local a = base + d
            if a > 0 then
                local p = ffi.C.kp_VirtualAlloc(ffi.cast("void*", ffi.cast("uint64_t", a)), size, 0x3000, 0x40)
                if p ~= nil and ptr(p) ~= 0 then return ptr(p) end
            end
        end
    end
end

-- ===================== textura del nombre: mezcla y resolucion =====================
-- Modo con el que se pega cada letra en la textura del nombre. El juego usa 6, que borra
-- lo que hay debajo cuando dos letras se pisan (cunas oscuras). Probado en el juego:
-- 2 = las letras se superponen limpias (por defecto en KitPos) | 1 = huecos | 8 = sin color
-- 3 y 4 = no dibuja | 5 = como el 6. Se puede cambiar en vivo con K.
local MODE_SITE = 0x1419E72EE                       -- mov edx,6 ; antes de fijar el modo de la letra
local MODE_LIST = { 2, 6, 1, 0, 5, 8 }
local letter_mode, mode_ok = 2, false
-- Tamano de la textura del nombre (1600x256) y de las pasadas que dibujan en ella.
local RES_SITES = {
    { 0x1419E91EA, "\xBA", "W" }, { 0x1419E91EF, "\x41\xB8", "H" },
    { 0x1419E92F5, "\xC7\x44\x24\x50", "H" }, { 0x1419E92FD, "\xC7\x44\x24\x48", "W" },
    { 0x1419E9383, "\xC7\x44\x24\x58", "H" }, { 0x1419E938B, "\xC7\x44\x24\x50", "W" },
    { 0x1419E943D, "\xC7\x44\x24\x58", "H" }, { 0x1419E9445, "\xC7\x44\x24\x50", "W" },
    { 0x1419E94D1, "\xC7\x44\x24\x38", "H" }, { 0x1419E94D9, "\xC7\x44\x24\x30", "W" },
}
local RES_LIST = { 1, 1.5, 2 }
local name_res, res_ok = 1, false

local function check_tex_sites()
    local b = memory.read(MODE_SITE, 5)
    mode_ok = b:sub(1, 1) == "\xBA" and b:sub(3, 5) == "\0\0\0"
    res_ok = true
    for _, r in ipairs(RES_SITES) do
        local b2 = memory.read(r[1], #r[2] + 4)
        local imm = memory.unpack("u32", b2:sub(#r[2] + 1))
        if b2:sub(1, #r[2]) ~= r[2] or (imm ~= 0x640 and imm ~= 0x100) then res_ok = false end
    end
    log(string.format("kitpos: textura del nombre: mezcla %s, resolucion %s",
        mode_ok and "ok" or "no disponible", res_ok and "ok" or "no disponible"))
end

local function apply_letter_mode()
    if mode_ok then memory.write(MODE_SITE + 1, memory.pack("u8", letter_mode)) end
end

local function apply_name_res()
    if not res_ok then return end
    local w, h = math.floor(1600 * name_res + 0.5), math.floor(256 * name_res + 0.5)
    for _, r in ipairs(RES_SITES) do
        memory.write(r[1] + #r[2], memory.pack("u32", (r[3] == "W") and w or h))
    end
end

local function install()
    if ffi == nil then status = "no_ffi"; return false end
    local cur = memory.read(HOOK_ADDR, 5)
    if cur ~= HOOK_ORIG then
        status = "bad_bytes"; status_arg = memory.hex(cur)
        return false
    end
    cave = alloc_near(HOOK_ADDR, 0xD000)
    if not cave then status = "no_mem"; return false end
    memory.write(cave, CAVE_CODE)
    memory.write(cave + OFF_RET, memory.pack("u64", RET_ADDR))
    memory.write(cave + OFF_HITS, memory.pack("u32", 0))
    memory.write(cave + OFF_TABLE, string.rep("\0", 32 * STRIDE))
    local disp = cave - (HOOK_ADDR + 5)
    if disp < -2147483648 or disp > 2147483647 then status = "far"; return false end
    memory.write(HOOK_ADDR, "\xE9" .. memory.pack("i32", disp))
    status = "hook_ok"
    log(string.format("kitpos: hook en %X -> cave %X", HOOK_ADDR, cave))
    check_tex_sites()
    -- ganchos del nombre (curva y separacion): van todos juntos o ninguno
    local ok = true
    for _, h in ipairs(NAME_HOOKS) do
        local b = memory.read(h[1], #h[2])
        local d = cave + h[3] - (h[1] + 5)
        if b ~= h[2] or d < -2147483648 or d > 2147483647 then
            ok = false
            log(string.format("kitpos: gancho del nombre en %X no disponible, bytes %s", h[1], memory.hex(b)))
        end
    end
    if ok then
        for _, r in ipairs(NAME_RETS) do memory.write(cave + r[1], memory.pack("u64", r[2])) end
        for _, h in ipairs(NAME_HOOKS) do
            local d = cave + h[3] - (h[1] + 5)
            memory.write(h[1], "\xE9" .. memory.pack("i32", d) .. string.rep("\x90", #h[2] - 5))
        end
        curve_ok = true
        local function rf(a) return memory.unpack("f", memory.read(a, 4)) end
        CURVE_A = rf(0x1425D0724)
        CURVE_K = rf(0x14257B348) + rf(0x1425CD94C)
        log(string.format("kitpos: curva y separacion del nombre activas  A=%.5f K=%.5f", CURVE_A, CURVE_K))
        -- minusculas: solo si los ganchos del nombre estan (usan la misma forma codificada)
        local lok = true
        for _, h in ipairs(LOWER_HOOKS) do
            local b = memory.read(h[1], #h[2])
            local d = cave + h[3] - (h[1] + 5)
            if b ~= h[2] or d < -2147483648 or d > 2147483647 then
                lok = false
                log(string.format("kitpos: gancho de minusculas en %X no disponible, bytes %s", h[1], memory.hex(b)))
            end
        end
        if lok then
            for _, r in ipairs(LOWER_RETS) do memory.write(cave + r[1], memory.pack("u64", r[2])) end
            for _, h in ipairs(LOWER_HOOKS) do
                local d = cave + h[3] - (h[1] + 5)
                local op = (h[4] == "call") and "\xE8" or "\xE9"
                memory.write(h[1], op .. memory.pack("i32", d) .. string.rep("\x90", #h[2] - 5))
            end
            lower_ok = true
            log("kitpos: minusculas activas")
            local dok = true
            for _, h in ipairs(DIAG_HOOKS) do
                local b = memory.read(h[1], #h[2])
                local d = cave + h[3] - (h[1] + 5)
                if b ~= h[2] or d < -2147483648 or d > 2147483647 then dok = false end
            end
            if dok then
                for _, r in ipairs(DIAG_RETS) do memory.write(cave + r[1], memory.pack("u64", r[2])) end
                for _, h in ipairs(DIAG_HOOKS) do
                    local d = cave + h[3] - (h[1] + 5)
                    memory.write(h[1], "\xE9" .. memory.pack("i32", d) .. string.rep("\x90", #h[2] - 5))
                end
                diag_ok = true
            end
            -- conversion del nombre en el modelo del jugador
            local cb = memory.read(CONV_SITE, 5)
            local dc = cave + OFF_H10 - (CONV_SITE + 5)
            if cb == CONV_ORIG and dc >= -2147483648 and dc <= 2147483647 then
                memory.write(cave + OFF_ORIGA99E0, memory.pack("u64", CONV_FUNC))
                memory.write(cave + OFF_LOWERALL, memory.pack("u8", lower_game and 1 or 0))
                memory.write(CONV_SITE, "\xE8" .. memory.pack("i32", dc))
                conv_ok = true
                log("kitpos: nombre sin conversion a mayusculas: " .. (lower_game and "activo" or "apagado"))
            else
                log("kitpos: gancho de conversion del nombre no disponible, bytes " .. memory.hex(cb))
            end
            local cb2 = memory.read(ext.conv2_site, 5)
            local dc2 = cave + OFF_H10 - (ext.conv2_site + 5)
            if conv_ok and cb2 == ext.conv2_orig and dc2 >= -2147483648 and dc2 <= 2147483647 then
                memory.write(ext.conv2_site, "\xE8" .. memory.pack("i32", dc2))
                log("kitpos: nombre sin conversion a mayusculas (al refrescar): activo")
            else
                log("kitpos: segundo gancho de conversion no disponible, bytes " .. memory.hex(cb2))
            end
            -- filtro del teclado del editor (Nombre en el uniforme)
            local eb = memory.read(ext.edit_site, 5)
            local de = cave + ext.off_h11 - (ext.edit_site + 5)
            if eb == ext.edit_orig and de >= -2147483648 and de <= 2147483647 then
                memory.write(cave + ext.off_orig, memory.pack("u64", ext.edit_func))
                memory.write(cave + OFF_LOWERALL, memory.pack("u8", lower_game and 1 or 0))
                memory.write(ext.edit_site, "\xE8" .. memory.pack("i32", de))
                ext.edit_ok = true
                log("kitpos: editor del juego sin mayusculas en el nombre del uniforme: " .. (lower_game and "activo" or "apagado"))
            else
                log("kitpos: gancho del editor no disponible, bytes " .. memory.hex(eb))
            end
        end
    end
    return true
end


local function read_file(p)
    local f = io.open(p, "rb")
    if not f then return nil end
    local t = f:read("*all"); f:close()
    return t
end

-- Tabla de letras para las minusculas: content\kitpos\minusculas.txt (la genera KitPos junto
-- con la fuente). Cada linea: codigo_utf8_hex  ancho  alto  u0 v0 u1 v1
-- nombres.txt: una linea por jugador, NOMBRE_COMO_LO_DEJA_EL_JUEGO=Texto a mostrar
-- (la clave es el nombre en mayusculas y sin acentos; el texto puede tener minusculas y acentos,
--  hasta 31 bytes; solo para kits con la fuente de KitPos y "Minusculas en el nombre" activado)
local function load_names()
    if not diag_ok then return end
    local t = read_file(kitpos_dir .. "\\nombres.txt")
    local parts, n = {}, 0
    if t then
        for line in t:gmatch("[^\r\n]+") do
            local k, v = line:match("^%s*([^;=][^=]-)%s*=%s*(.-)%s*$")
            if k and v ~= "" and n < NMMAX and #k < 32 and #v < 32 then
                n = n + 1
                parts[#parts + 1] = k .. string.rep("\0", 32 - #k) .. v .. string.rep("\0", 32 - #v)
            end
        end
    end
    memory.write(cave + OFF_NMCOUNT, memory.pack("u32", 0))
    if n > 0 then memory.write(cave + OFF_NMTABLE, table.concat(parts)) end
    memory.write(cave + OFF_NMCOUNT, memory.pack("u32", n))
    name_count = n
    log(string.format("kitpos: nombres.txt: %d nombres", n))
end

-- tabla de letras (minusculas.txt / kitpos_letras.txt): codigo_utf8_hex ancho alto u0 v0 u1 v1
function ext.parse_glyphs(t)
    local function hex(x)
        local v = 0
        for c in x:upper():gmatch(".") do v = v * 16 + (("0123456789ABCDEF"):find(c, 1, true) - 1) end
        return v
    end
    local parts, n, codes = {}, 0, {}
    for line in t:gmatch("[^\r\n]+") do
        local code, gw, gh, u0, v0, u1, v1 = line:match("^%s*(%x+)%s+(%d+)%s+(%d+)%s+([%d%.]+)%s+([%d%.]+)%s+([%d%.]+)%s+([%d%.]+)")
        if code and n < GMAX then
            n = n + 1
            codes[#codes + 1] = hex(code)
            parts[#parts + 1] = memory.pack("u32", hex(code)) .. memory.pack("u16", tonumber(gw)) ..
                memory.pack("u16", tonumber(gh)) .. string.rep("\0", 8) ..
                memory.pack("f", tonumber(u0)) .. memory.pack("f", tonumber(v0)) ..
                memory.pack("f", tonumber(u1)) .. memory.pack("f", tonumber(v1))
        end
    end
    return table.concat(parts), n, codes
end

-- letras que acepta el editor del juego: las de todas las fuentes de KitPos cargadas
function ext.write_accept()
    if not cave then return end
    local seen, list = {}, {}
    local function add(c)
        if not seen[c] and #list < ext.amax then seen[c] = true; list[#list + 1] = memory.pack("u32", c) end
    end
    for c in pairs(ext.glyph_codes) do add(c) end
    for _, f in pairs(ext.fonts) do
        if f then for _, c in ipairs(f.codes) do add(c) end end
    end
    memory.write(cave + ext.off_acount, memory.pack("u32", 0))
    memory.write(cave + ext.off_atable, table.concat(list))
    memory.write(cave + ext.off_acount, memory.pack("u32", #list))
end

-- fuente propia de un kit (se carga una vez por sesion)
function ext.load_font(file)
    local f = ext.fonts[file]
    if f ~= nil then return f or nil end
    local t = read_file(file)
    if not t then ext.fonts[file] = false; return nil end
    local data, n, codes = ext.parse_glyphs(t)
    if n == 0 then ext.fonts[file] = false; return nil end
    local p = ffi.C.kp_VirtualAlloc(nil, GMAX * GSTRIDE, 0x3000, 0x04)
    if p == nil or ptr(p) == 0 then ext.fonts[file] = false; return nil end
    f = { ptr = ptr(p), n = n, codes = codes }
    memory.write(f.ptr, data)
    ext.fonts[file] = f
    ext.write_accept()
    log(string.format("kitpos: fuente del kit: %s (%d letras)", file, n))
    return f
end

-- carpeta del kit (como kserv: orden de order.ini / gk_order.ini, o el KitFile que pone kserv)
function ext.kit_font(team, kid, is_gk, cfg)
    if not (lower_ok and ext.kit_list and ext.kroot) then return nil end
    local ck = tostring(team) .. (is_gk and "g" or "p")
    local e = ext.kc[ck]
    if not e then
        local list, path = ext.kit_list(team, is_gk)
        e = { list = list or {}, path = path }
        ext.kc[ck] = e
    end
    if not e.path then return nil end
    local ord
    local kf = cfg and cfg.KitFile
    if type(kf) == "string" then ord = tonumber(kf:match("^k%d+[pg](%d+)")) end
    ord = ord or (is_gk and 1 or (kid + 1))
    local folder = e.list[ord]
    if not folder then return nil end
    return ext.load_font(ext.kroot .. e.path .. "\\" .. folder .. "\\kitpos_letras.txt")
end

-- el equipo tiene algun kit con fuente propia
function ext.team_has_font(team)
    local v = ext.team_font[team]
    if v ~= nil then return v end
    v = false
    if lower_ok and ext.kit_list and ext.kroot then
        for _, gk in ipairs({ false, true }) do
            local list, path = ext.kit_list(team, gk)
            if list and path then
                for _, w in ipairs(list) do
                    if read_file(ext.kroot .. path .. "\\" .. w .. "\\kitpos_letras.txt") then v = true end
                end
            end
        end
    end
    ext.team_font[team] = v
    return v
end

local function load_glyphs()
    if not lower_ok then return end
    local t = read_file(kitpos_dir .. "\\minusculas.txt")
    if not t then log("kitpos: no hay minusculas.txt"); return end
    local data, n, codes = ext.parse_glyphs(t)
    for _, c in ipairs(codes) do ext.glyph_codes[c] = true end
    memory.write(cave + OFF_GTABLE, data)
    memory.write(cave + OFF_GCOUNT, memory.pack("u32", n))
    glyph_count = n
    ext.write_accept()
    log(string.format("kitpos: minusculas.txt: %d letras", n))
end

local function has_any(t)
    if not t then return false end
    for _ in pairs(t) do return true end
    return false
end

-- ===================== archivo =====================
local function parse(text)
    local man, tms, cur = {}, {}, nil
    limits_on = true
    image_on = true
    for line in (text .. "\n"):gmatch("([^\r\n]*)\r?\n") do
        line = line:gsub(";.*$", ""):gsub("^%s+", ""):gsub("%s+$", "")
        local sec = line:match("^%[(.-)%]$")
        if sec then
            cur = nil
            sec = sec:lower():gsub("^%s+", ""):gsub("%s+$", "")
            local n = sec:match("^(%d+)$")
            local t, w = sec:match("^equipo%s+(%d+)%s*(%w*)$")
            if sec == "opciones" then
                cur = "opciones"
            elseif n then
                n = tonumber(n)
                if n >= 1 and n <= 31 then cur = {}; man[n] = cur end
            elseif t then
                local key = t
                if w ~= "" then
                    if w == "gk" or w:match("^p%d+$") then key = t .. "/" .. w else key = nil end
                end
                if key then cur = tms[key] or {}; tms[key] = cur end
            end
        elseif cur == "opciones" then
            local v = line:match("^limites%s*=%s*(%d)")
            if v then limits_on = (v ~= "0") end
            local mj = line:match("^minusculas_juego%s*=%s*(%d)")
            if mj then
                lower_game = (mj ~= "0")
                if (conv_ok or ext.edit_ok) and cave then memory.write(cave + OFF_LOWERALL, memory.pack("u8", lower_game and 1 or 0)) end
            end
            local lm = line:match("^modo_letras%s*=%s*(%d+)")
            if lm then letter_mode = tonumber(lm) or 2 end
            local nr = line:match("^resolucion_nombre%s*=%s*([%d%.]+)")
            if nr then
                nr = tonumber(nr)
                if nr == 1 or nr == 1.5 or nr == 2 then name_res = nr end
            end
            local ca = line:match("^curva_ajuste%s*=%s*([%-%d%.]+)")
            if ca and tonumber(ca) then curve_comp = tonumber(ca) end
            local im = line:match("^imagen%s*=%s*(%d)") or line:match("^image%s*=%s*(%d)")
            if im then image_on = (im ~= "0") end
            local l = line:match("^idioma%s*=%s*(%a+)") or line:match("^language%s*=%s*(%a+)")
            if l then l = l:lower(); if l == "en" or l == "es" then lang = l end end
        elseif cur then
            local k, v = line:match("^([%w_]+)%s*=%s*([%-%d%.]+)$")
            v = tonumber(v)
            if k and v then
                local base = k:match("^(.-)_steps$")
                if base and STEPS[base] then cur[base] = STEPS[base](v)
                elseif FIELD_IDX[k] then cur[k] = v end
            end
        end
    end
    return man, tms
end

-- valores finales de un kit: lo del equipo (solo kits de jugador) + lo del kit
local function resolve(key)
    local t, w = key:match("^(%d+)/(%w+)$")
    if not t then return nil end
    local out, any = {}, false
    if w ~= "gk" and teams[t] then
        for k, v in pairs(teams[t]) do out[k] = v; any = true end
    end
    if teams[key] then
        for k, v in pairs(teams[key]) do out[k] = v; any = true end
    end
    return any and out or nil
end

local compare = nil   -- { key = "1234/p1", slot = n }: muestra ese kit con los valores originales (tecla B)
-- "Oculto" se guarda como escala 0, pero al juego se le manda una escala minima:
-- con escala exactamente 0 el juego estira un solo pixel del numero sobre toda la camiseta
-- y, segun el numero del jugador, el uniforme sale pintado de un color (camiseta blanca).
local HIDE_SCALE = 0.0001
local HIDE_FIELDS = { NameSize = true, BackNumberSize = true, ChestNumberSize = true, ShortsNumberSize = true }

local curve_gen, curve_last = {}, {}
local function apply()
    if not cave then return end
    local n = 0
    for s = 1, 31 do
        local e = manual[s]
        if not has_any(e) and slot_owner[s] then e = resolve(slot_owner[s]) end
        if compare and (slot_owner[s] == compare.key or s == compare.slot) then e = nil end
        -- 31 palabras de 4 bytes desde +0x04: 1..12 floats del kit, 13 forma, 14-15 radios, 17 separacion
        local mask, w = 0, {}
        for k = 1, 31 do w[k] = 0 end
        for i, f in ipairs(FIELDS) do
            local v = e and e[f]
            if i <= 12 and v then
                mask = mask + 2 ^ (i - 1)
                if v == 0 and HIDE_FIELDS[f] then v = HIDE_SCALE end
                w[i] = v
            end
        end
        local cv, sp = e and e.NameCurve, e and e.NameSpacing
        local lw = ((e and e.NameLower == 1) or ext.slot_font[s] ~= nil) and lower_ok
        local enc, rad, rad2 = 0, 672, 672
        if curve_ok and (cv or sp or lw) then
            mask = mask + 0x1000
            local base = 0x40                       -- sin curva propia: la forma del kit
            if cv then
                base = 0
                if math.abs(cv) >= CURVE_MIN then
                    base = 4
                    rad = 1000 / cv
                    -- El juego gira cada letra alrededor de un centro a A*r y la devuelve K*r
                    -- (A = -0.8, K = 0.89): sobra 0.09*r. Se calcula el radio de vuelta para
                    -- que el nombre quede a la misma altura que con la curva leve (r = 672).
                    rad2 = rad
                    if CURVE_K and CURVE_A and math.abs(CURVE_K) > 1e-6 then
                        local fix = (-CURVE_A * rad + (CURVE_K + CURVE_A) * 672) / CURVE_K
                        rad2 = rad + curve_comp * (fix - rad)
                    end
                end
            end
            if sp then mask = mask + 0x2000 end
            if lw then mask = mask + 0x4000 end
            -- la "generacion" cambia con cada valor nuevo para que el juego rearme la textura
            local sig = string.format("%d %.4f %.4f %.4f", base, rad, rad2, sp or 0)
            if curve_last[s] ~= sig then
                curve_last[s] = sig
                curve_gen[s] = ((curve_gen[s] or 0) + 1) % 8
            end
            enc = base + 0x80 + s * 256 + (curve_gen[s] or 0) * 8192
        end
        -- +0x48 cantidad de letras y +0x50 puntero a la tabla de la fuente de este kit
        local sf = ext.slot_font[s]
        local fp, fn = sf and sf.ptr or (cave + OFF_GTABLE), sf and sf.n or glyph_count
        local parts = {}
        for k = 1, 31 do
            if k == 13 then parts[k] = memory.pack("u32", enc)
            elseif k == 14 then parts[k] = memory.pack("f", rad)
            elseif k == 15 then parts[k] = memory.pack("f", rad2)
            elseif k == 17 then parts[k] = memory.pack("f", sp or 0)
            elseif k == 18 then parts[k] = memory.pack("u32", fn)
            elseif k == 20 then parts[k] = memory.pack("u32", fp % 4294967296)
            elseif k == 21 then parts[k] = memory.pack("u32", math.floor(fp / 4294967296))
            else parts[k] = memory.pack("f", w[k]) end
        end
        if mask > 0 then n = n + 1 end
        -- datos primero, mascara al final (el juego nunca lee una ranura a medio escribir)
        memory.write(cave + OFF_TABLE + s * STRIDE + 4, table.concat(parts))
        memory.write(cave + OFF_TABLE + s * STRIDE, memory.pack("u32", mask))
    end
    slots_loaded = n
    ext.dirty = false
end

-- ===================== ranuras automaticas por equipo =====================
local function alloc_slot(key)
    if dyn_slot[key] then return dyn_slot[key] end
    for s = 31, 1, -1 do                       -- de arriba hacia abajo; las manuales suelen ser bajas
        if not slot_owner[s] and not has_any(manual[s]) then
            dyn_slot[key] = s
            slot_owner[s] = key
            return s
        end
    end
    log("kitpos: no quedan ranuras libres para " .. key)
    return nil
end

local function reset_slots()
    dyn_slot, slot_owner = {}, {}
    ext.slot_font = {}
end

local function kit_key(team, kid, is_gk)
    if is_gk then return team .. "/gk" end
    return team .. "/p" .. (kid + 1)
end

-- Si el kit tiene valores en el mapa, le pone su ranura (Unk_0x24) con ctx.kits.set.
local function ensure_kit(ctx, team, kid, is_gk)
    if not (ctx and ctx.kits and team) then return false end
    local key = kit_key(team, kid, is_gk)
    local cfg
    if is_gk then cfg = ctx.kits.get_gk(team) else cfg = ctx.kits.get(team, kid) end
    local font = ext.kit_font(team, kid, is_gk, cfg)
    if not resolve(key) and not font then return false end
    local slot = alloc_slot(key)
    if not slot then return false end
    local changed = false
    if ext.slot_font[slot] ~= font then ext.slot_font[slot] = font; ext.dirty = true; changed = true end
    if not cfg then return changed end
    if tonumber(cfg[SLOT_KEY]) == slot then return changed end
    cfg[SLOT_KEY] = slot
    if is_gk then ctx.kits.set_gk(team, cfg) else ctx.kits.set(team, kid, cfg) end
    return true
end

local function ensure_team(ctx, team)
    if not (ctx and ctx.kits and team) then return end
    for kid = 0, 9 do
        if teams[team .. "/p" .. (kid + 1)] or teams[tostring(team)] or ext.team_has_font(team) then
            if ctx.kits.get(team, kid) then ensure_kit(ctx, team, kid, false) end
        end
    end
    if teams[team .. "/gk"] or ext.team_has_font(team) then
        if ctx.kits.get_gk(team) then ensure_kit(ctx, team, 0, true) end
    end
end

local function load_file()
    local text = read_file(ini_path)
    if not text then
        for _, p in ipairs(seed_paths or {}) do
            text = read_file(p)
            if text then break end
        end
    end
    return text
end

local function reload(ctx, force)
    local text = load_file()
    if not text then if ui.msg == "" then ui.msg = tr("no_file") end; return end
    if text == last_text and not force then return end
    last_text = text
    manual, teams = parse(text)
    apply()
    if ctx and ctx.kits then
        ensure_team(ctx, ctx.kits.get_current_team(0))
        ensure_team(ctx, ctx.kits.get_current_team(1))
        apply()
        ctx.kits.refresh(0)
        ctx.kits.refresh(1)
    end
end

-- ===================== editor en el overlay =====================
local DEFAULT_FROM_KIT = {   -- campo -> nombre en la config del kit (valor de partida)
    NameY = "NameY", NameSize = "NameSize", BackNumberY = "BackNumberY",
    BackNumberSize = "BackNumberSize", BackNumberSpacing = "BackNumberSpacing",
    ChestNumberX = "ChestNumberX", ChestNumberY = "ChestNumberY", ChestNumberSize = "ChestNumberSize",
    ShortsNumberX = "ShortsNumberX", ShortsNumberSize = "ShortsNumberSize",
}

local cur = { team = nil, kid = 0, is_gk = false, cfg = nil, frame = -1000 }
local function current_kit(ctx)
    if frame - cur.frame >= 30 then      -- como mucho 2 veces por segundo
        cur.frame = frame
        cur.team, cur.cfg = nil, nil
        if ctx and ctx.kits then
            local team = ctx.kits.get_current_team(0)
            local kid, is_gk = ctx.kits.get_current_kit_id(0)
            if team and kid then
                cur.team, cur.kid, cur.is_gk = team, kid, (is_gk and true or false)
                if cur.is_gk then cur.cfg = ctx.kits.get_gk(team) else cur.cfg = ctx.kits.get(team, kid) end
            end
        end
    end
    return cur
end

local function kit_default(ctx, f)
    local cfg = current_kit(ctx).cfg
    if f == "ShortsNumberY" then
        local n = cfg and tonumber(cfg.ShortsNumberY)
        if n then return shorts_y(n, tonumber(cfg.ShortsNumberSide) or 0) end
        return nil
    end
    if f == "NameSpacing" then return 0 end
    if f == "NameCurve" then
        local n = cfg and tonumber(cfg.NameShape)
        return n and CURVE_OF_SHAPE[n] or 0
    end
    if f == "NameStretch" then
        local n = cfg and tonumber(cfg.NameStretch)
        if n == nil then return nil end
        if n == 0 then n = 3 end                     -- el juego trata 0 como 3
        return STEPS.NameStretch(n)
    end
    local key = DEFAULT_FROM_KIT[f]
    local n = cfg and key and tonumber(cfg[key])
    if n and STEPS[f] then return STEPS[f](n) end
    return nil
end

-- seccion que se esta editando: el kit actual o todo el equipo
local function target_key(ctx)
    local c = current_kit(ctx)
    if not c.team then return nil end
    if ui.team_wide and not c.is_gk then return tostring(c.team) end
    return kit_key(c.team, c.kid, c.is_gk)
end


local held = {}

local function write_file(path, text)
    -- En este sider io.open no puede escribir (devuelve nil sin error, igual que le pasa a
    -- edit21_db), asi que se escribe con las funciones de Windows por ffi.
    ffi.C.kp_CreateDirectoryA(kitpos_dir, nil)
    local h = ffi.C.kp_CreateFileA(path, 0x40000000, 1, nil, 2, 0x80, nil)  -- GENERIC_WRITE, CREATE_ALWAYS
    if tonumber(ffi.cast("intptr_t", h)) == -1 then return false, tr("cant_create", path) end
    local wr = ffi.new("uint32_t[1]")
    local ok = ffi.C.kp_WriteFile(h, text, #text, wr, nil)
    ffi.C.kp_CloseHandle(h)
    if ok == 0 or wr[0] ~= #text then return false, tr("cant_write", path) end
    return true
end

-- Tabla de letras del juego para el nombre del uniforme (prueba de idiomas).
-- El juego guarda en un mapa (0x1437DB5C8) cada letra que acepta: la clave es la letra en UTF-8,
-- +0x20 = como la deja el editor (mayuscula) y +0x24 = las letras que dibuja en la camiseta
-- con la fuente original (hasta 4, ej. AE). Se escribe una vez en content\kitpos\letras_juego.txt
function ext.dump_charmap()
    if ext.charmap_done then return end
    local READ = { [0x02] = true, [0x04] = true, [0x08] = true, [0x20] = true, [0x40] = true, [0x80] = true }
    local mbi = ffi.new("kp_MBI")
    local function readable(a, n)
        if not a or a < 0x10000 or a > 0x7FFFFFFFFFFF then return false end
        if ffi.C.kp_VirtualQuery(ffi.cast("void*", ffi.cast("uint64_t", a)), mbi, ffi.sizeof(mbi)) == 0 then return false end
        local prot = tonumber(mbi.Protect)
        if tonumber(mbi.State) ~= 0x1000 or not READ[prot % 256] or math.floor(prot / 256) % 2 ~= 0 then return false end
        return a + (n or 8) <= ptr(mbi.BaseAddress) + tonumber(mbi.RegionSize)
    end
    local function packed_str(v)
        local out = {}
        for sh = 24, 0, -8 do
            local b = math.floor(v / 2 ^ sh) % 256
            if b ~= 0 then out[#out + 1] = string.char(b) end
        end
        return table.concat(out)
    end
    local function u64(a) return tonumber(ffi.cast("uint64_t*", ffi.cast("uint64_t", a))[0]) end
    local function u32(a) return tonumber(ffi.cast("uint32_t*", ffi.cast("uint64_t", a))[0]) end
    local function u8(a) return tonumber(ffi.cast("uint8_t*", ffi.cast("uint64_t", a))[0]) end
    local mgr = u64(0x1437DB5C8)
    if not readable(mgr, 16) then return end
    local map = u64(mgr + 8)
    if not readable(map, 24) then return end
    local head, size = u64(map + 8), u64(map + 0x10)
    if size == 0 or size > 20000 or not readable(head, 0x28) then return end
    ext.charmap_done = true
    local rows, node, count, bad = {}, u64(head), 0, false
    while node ~= head and count < size do
        if not readable(node, 0x28) then bad = true; break end
        local key = u32(node + 0x1C)
        local v1 = u32(node + 0x20)
        local v2 = u32(node + 0x24)
        rows[#rows + 1] = { key, v1, v2 }
        count = count + 1
        local r = u64(node + 0x10)
        if not readable(r, 0x28) then bad = true; break end
        if u8(r + 0x19) == 0 then
            node = r
            for _ = 1, 64 do
                local l = u64(node)
                if not readable(l, 0x28) or u8(l + 0x19) ~= 0 then break end
                node = l
            end
        else
            local p = u64(node + 8)
            for _ = 1, 64 do
                if not readable(p, 0x28) then bad = true; break end
                if u8(p + 0x19) ~= 0 or node ~= u64(p + 0x10) then break end
                node = p; p = u64(p + 8)
            end
            node = p
        end
    end
    local out, nofont = {}, {}
    out[#out + 1] = string.format("; letras que acepta el juego en el nombre del uniforme: %d%s", #rows, bad and " (lectura incompleta)" or "")
    out[#out + 1] = "; codigo  letra  | editor sin KitPos | camiseta con la fuente original | en minusculas.txt"
    for _, r in ipairs(rows) do
        local has = ext.glyph_codes[r[1]] and "si" or "NO"
        if not ext.glyph_codes[r[1]] then nofont[#nofont + 1] = packed_str(r[1]) end
        out[#out + 1] = string.format("%06X  %s  | %s | %s | %s", r[1], packed_str(r[1]), packed_str(r[2]), packed_str(r[3]), has)
    end
    out[#out + 1] = ""
    out[#out + 1] = "; letras aceptadas que NO estan en minusculas.txt (" .. #nofont .. "):"
    out[#out + 1] = table.concat(nofont, " ")
    local ok = write_file(kitpos_dir .. "\\letras_juego.txt", table.concat(out, "\r\n") .. "\r\n")
    log(string.format("kitpos: letras_juego.txt: %d letras, %d sin la fuente de KitPos%s", #rows, #nofont, ok and "" or " (no se pudo escribir)"))
end

-- Volcado de la memoria del juego (solo lectura) para estudiar como dibuja el nombre.
-- Se hace una sola vez, al arrancar, si content\kitpos\volcar.txt dice "volcar".
-- Las paginas que no se pueden leer se rellenan con ceros (asi los offsets coinciden).
local READABLE = { [0x02] = true, [0x04] = true, [0x08] = true, [0x20] = true, [0x40] = true, [0x80] = true }
local function dump_image()
    local flag = kitpos_dir .. "\\volcar.txt"
    local t = read_file(flag)
    if not t or not t:match("^volcar") then return end
    -- "volcar" = todo el ejecutable; "volcar 141000000 144000000" = solo ese rango
    local base = 0x140000000
    local nt = base + memory.unpack("u32", memory.read(base + 0x3C, 4))
    local size = memory.unpack("u32", memory.read(nt + 0x50, 4))
    local r1, r2 = t:match("^volcar%s+(%x+)%s+(%x+)")
    if r1 then
        -- (el tonumber de sider no acepta base 16: se convierte a mano)
        local function hex(x)
            local v = 0
            for c in x:upper():gmatch(".") do v = v * 16 + (("0123456789ABCDEF"):find(c, 1, true) - 1) end
            return v
        end
        local a1, a2 = hex(r1), hex(r2)
        if a1 >= base and a2 > a1 and a2 <= base + size then base, size = a1, a2 - a1 end
    end
    local out = kitpos_dir .. "\\pes2021_" .. string.format("%X", base) .. ".bin"
    ffi.C.kp_CreateDirectoryA(kitpos_dir, nil)
    local h = ffi.C.kp_CreateFileA(out, 0x40000000, 1, nil, 2, 0x80, nil)
    if tonumber(ffi.cast("intptr_t", h)) == -1 then log("kitpos: volcado: no se pudo crear " .. out); return end
    local wr = ffi.new("uint32_t[1]")
    local mbi = ffi.new("kp_MBI")
    local a, stop, total, skipped = base, base + size, 0, 0
    while a < stop do
        local n = ffi.C.kp_VirtualQuery(ffi.cast("void*", ffi.cast("uint64_t", a)), mbi, ffi.sizeof(mbi))
        if n == 0 then break end
        local rend = math.min(ptr(mbi.BaseAddress) + tonumber(mbi.RegionSize), stop)
        if rend <= a then break end
        local prot = tonumber(mbi.Protect)
        local ok = tonumber(mbi.State) == 0x1000 and READABLE[prot % 256] and math.floor(prot / 256) % 2 == 0
        local q = a
        while q < rend do
            local len = math.min(0x100000, rend - q)
            local chunk = ok and memory.read(q, len) or string.rep("\0", len)
            if not ok then skipped = skipped + len end
            ffi.C.kp_WriteFile(h, chunk, #chunk, wr, nil)
            total = total + len
            q = q + len
        end
        a = rend
    end
    ffi.C.kp_CloseHandle(h)
    write_file(flag, "hecho (borra pes2021_full.bin cuando ya no haga falta)\r\n")
    log(string.format("kitpos: volcado listo: %s  %d bytes (%d sin leer) desde %X", out, total, skipped, base))
end

local function section_lines(out, title, e)
    if not has_any(e) then return end
    out[#out + 1] = "[" .. title .. "]"
    for _, f in ipairs(FIELDS) do
        if e[f] then out[#out + 1] = string.format("%s = %.5f", f, e[f]) end
    end
    out[#out + 1] = ""
end

local function save_ini()
    local out = { "; kitpos_slots.ini - generado por kitpos.lua",
                  "; [equipo ID] = todos los kits de jugador | [equipo ID pN] = kit N | [equipo ID gk] = arquero",
                  "; [N] = ranura manual (kits con Unk_Offset0x24_Bits0to4 = N)", "" }
    out[#out + 1] = "[opciones]"
    out[#out + 1] = "idioma = " .. lang .. "      ; es / en"
    out[#out + 1] = "limites = " .. (limits_on and "1" or "0")
    out[#out + 1] = "imagen = " .. (image_on and "1" or "0") .. "       ; panel con logo a la derecha del overlay"
    out[#out + 1] = string.format("curva_ajuste = %g   ; correccion del corrimiento de la curva (1 = auto, 0 = sin corregir)", curve_comp)
    out[#out + 1] = string.format("minusculas_juego = %d   ; 1 = el juego no pasa el nombre a mayusculas ni le quita los acentos (camiseta y editor)", lower_game and 1 or 0)
    out[#out + 1] = string.format("modo_letras = %d   ; como se pegan las letras del nombre (2 = limpio, 6 = el del juego)", letter_mode)
    out[#out + 1] = string.format("resolucion_nombre = %g   ; tamano de la textura del nombre: 1, 1.5 o 2", name_res)
    out[#out + 1] = ""
    local keys = {}
    for k in pairs(teams) do keys[#keys + 1] = k end
    table.sort(keys, function(a, b)
        local ta, wa = a:match("^(%d+)/?(%w*)$")
        local tb, wb = b:match("^(%d+)/?(%w*)$")
        if ta ~= tb then return tonumber(ta) < tonumber(tb) end
        return wa < wb
    end)
    for _, k in ipairs(keys) do
        local t, w = k:match("^(%d+)/?(%w*)$")
        section_lines(out, "equipo " .. t .. ((w ~= "") and (" " .. w) or ""), teams[k])
    end
    for n = 1, 31 do section_lines(out, tostring(n), manual[n]) end
    local text = table.concat(out, "\r\n")
    local ok, err = write_file(ini_path, text)
    if not ok then ui.msg = err; log("kitpos: " .. err); return end
    last_text = read_file(ini_path) or text   -- para que el auto-recargado no lo pise
    ui.msg = tr("saved")
    ui.dirty = false
end

local refresh_pending, last_refresh, last_change = false, -1000, -1000
local confirm_at = nil   -- segundo refresco de confirmacion (a veces el juego ignora uno que llega mientras rearma)
local function changed(ctx)
    local c = current_kit(ctx)
    if c.team then
        if ui.team_wide then ensure_team(ctx, c.team) else ensure_kit(ctx, c.team, c.kid, c.is_gk) end
    end
    ui.dirty = true
    last_change = frame
    apply()                    -- la tabla se actualiza al instante (es barato)
    refresh_pending = true     -- el uniforme se rearma enseguida (ver do_pending_refresh)
end

-- Rearma el uniforme como lo hace kserv: primero vuelve a "poner" la config del kit que se
-- esta editando (ctx.kits.set) y despues pide el refresco. Solo con refresh el juego a veces
-- no rearmaba nada o mostraba el cambio anterior.
local function kick(ctx)
    if not (ctx and ctx.kits) then return end
    local team = ctx.kits.get_current_team(0)
    local kid, is_gk = ctx.kits.get_current_kit_id(0)
    if team and kid then
        if is_gk then
            local cfg = ctx.kits.get_gk(team)
            if cfg then ctx.kits.set_gk(team, cfg) end
        else
            local cfg = ctx.kits.get(team, kid)
            if cfg then ctx.kits.set(team, kid, cfg) end
        end
    end
    ctx.kits.refresh(0)
    ctx.kits.refresh(1)
end

local function do_confirm_refresh(ctx)
    if confirm_at and frame >= confirm_at and not refresh_pending and ctx and ctx.kits then
        confirm_at = nil
        local c = current_kit(ctx)
        if c.team then ensure_kit(ctx, c.team, c.kid, c.is_gk) end
        apply()
        kick(ctx)
        last_refresh = frame
    end
end

local function do_pending_refresh(ctx)
    -- El uniforme se rearma en cada cambio (como mucho unas 10 veces por segundo), asi se ve
    -- cada paso. Medio segundo despues del ultimo cambio se rearma una vez mas para confirmar
    -- (a veces el juego ignora un refresco que llega mientras todavia esta rearmando).
    if refresh_pending and ctx and ctx.kits and frame - last_refresh >= 6 then
        confirm_at = frame + 30
        refresh_pending = false
        last_refresh = frame
        kick(ctx)
    end
end

local GROUP_START = { NameY = true, BackNumberY = true, ChestNumberX = true, ShortsNumberX = true }

-- float -> paso equivalente de kserv (para comparar con el editor de kserv)
local function to_steps(f, v, cfg)
    if v == nil then return nil end
    if f == "ShortsNumberY" then
        local side = cfg and tonumber(cfg.ShortsNumberSide) or 0
        local a, b = shorts_y(0, side), shorts_y(1, side)
        return (v - a) / (b - a)
    end
    if f == "NameCurve" then return curve_to_steps(v) end
    if f == "NameSpacing" then return v end          -- se muestra en sus propias unidades
    local fn = STEPS[f]
    if not fn then return nil end
    local a, b = fn(0), fn(1)
    if b == a then return nil end
    return (v - a) / (b - a)
end

local function fmt(v) return v and string.format("%7.4f", v) or "   --  " end

-- Barra con el rango del juego (de paso 0 a paso maximo de kserv):
--   | = donde estaba el kit   O = donde esta ahora   < > = fuera del rango del juego
local SMAX = { NameY = 39, NameSize = 20, NameStretch = 3, BackNumberY = 29, BackNumberSize = 28,
    BackNumberSpacing = 14, ChestNumberX = 29, ChestNumberY = 29, ChestNumberSize = 28,
    ShortsNumberX = 29, ShortsNumberY = 29, ShortsNumberSize = 28, NameCurve = 3 }
local BAR_W = 15
local function bar(f, v, base, cfg)
    local nmax = SMAX[f]
    if not nmax then return string.rep(" ", BAR_W + 2) end
    local function pos(x)
        local st = x and to_steps(f, x, cfg)
        if not st then return nil end
        return math.floor(st / nmax * (BAR_W - 1) + 0.5) + 1
    end
    local t = {}
    for i = 1, BAR_W do t[i] = "-" end
    local pb, pv = pos(base), pos(v)
    if pb and pb >= 1 and pb <= BAR_W then t[pb] = "|" end
    if pv then
        if pv < 1 then t[1] = "<" elseif pv > BAR_W then t[BAR_W] = ">" else t[pv] = "O" end
    end
    return "[" .. table.concat(t) .. "]"
end
local function fmt_steps(n)
    if not n then return "     " end
    return string.format("%5.1f", n)
end

-- El paso depende del campo: se mide en "pasos de kserv" de ese campo, porque un 0.001 fijo
-- era casi invisible en algunos campos (menos de un pixel) y demasiado en otros.
--   normal = 1/2 paso de kserv | Ctrl (fino) = 1/4 de paso | Shift (grueso) = 2 pasos
local function game_step(f)
    if f == "ShortsNumberY" then return 0.19 / 29 end
    if f == "NameCurve" then return 0.2 end          -- normal 0.1 | fino 0.05 | grueso 0.4
    if f == "NameSpacing" then return 2 end          -- normal 1 | fino 0.5 | grueso 4
    local fn = STEPS[f]
    if not fn then return 0.01 end
    return math.abs(fn(1) - fn(0))
end

local function modifier_step(f)
    local gs = game_step(f or "NameY")
    if held[0x11] or held[0xA2] or held[0xA3] then return gs * 0.25, tr("st_fine") end    -- Ctrl
    if held[0x10] or held[0xA0] or held[0xA1] then return gs * 2, tr("st_coarse") end      -- Shift
    return gs * 0.5, tr("st_normal")
end


-- ===================== deshacer =====================
-- Cada cambio guarda el valor anterior. Si se mantiene una flecha sobre el mismo campo,
-- los pasos seguidos se juntan en un solo "deshacer" (vuelve a donde estaba antes de empezar).
local undo = {}
local UNDO_MAX = 200
local function push_undo(e)
    local top = undo[#undo]
    if top and top.t == e.t and top.key == e.key and top.f == e.f and frame - top.frame <= 45 then
        top.frame = frame                     -- mismo campo, seguido: se conserva el valor original
        return
    end
    e.frame = frame
    undo[#undo + 1] = e
    if #undo > UNDO_MAX then table.remove(undo, 1) end
end

-- ===================== pagina 2: opciones del kit (config.txt de kserv) =====================
-- kserv guarda con io.open, que en este sider no puede escribir; por eso kitpos escribe
-- el config.txt del kit con las funciones de Windows (ffi), conservando comentarios y orden.
local kroot
local kmap, kmap_loaded = {}, false
local kcache = {}       -- "1234p" / "1234g" -> { list = {carpetas}, path = "Liga\\Equipo" }
local korig = {}        -- korig[archivo][Clave] = valor que tiene el archivo
local kedits = {}       -- kedits[archivo][Clave] = valor nuevo (sin guardar)

local function trim(x) return (x:gsub("^%s+", ""):gsub("%s+$", "")) end

local function each_line(text, fn)
    for line in (text .. "\n"):gmatch("([^\n]*)\n") do fn((line:gsub("\r$", ""))) end
end

local function load_kmap()
    kmap, kmap_loaded = {}, true
    local text = read_file(kroot .. "map.txt")
    if not text then return end
    each_line(text, function(line)
        line = line:gsub("^\239\187\191", ""):gsub("#.*", "")
        local tid, path = line:match('^%s*(%d+)%s*,%s*"?([^"]*)')
        if tid and path then
            path = trim(path)
            if path ~= "" then kmap[tonumber(tid)] = path end
        end
    end)
end

-- carpetas de kits del equipo en el orden de order.ini (todas las colecciones, como kserv en modo edicion)
local function kit_list(team, is_gk)
    if not kmap_loaded then load_kmap() end
    local path = kmap[tonumber(team)]
    if not path then return nil, nil end
    local text = read_file(kroot .. path .. "\\" .. (is_gk and "gk_order.ini" or "order.ini"))
    if not text then return nil, path end
    local list = {}
    each_line(text, function(line)
        line = line:gsub("^\239\187\191", ""):gsub(";.*", ""):gsub("#.*", "")
        local w = line:match("^%s*([^%s]+)")
        if w and not w:match("^%[.*%]$") then
            if read_file(kroot .. path .. "\\" .. w .. "\\config.txt") then list[#list + 1] = w end
        end
    end)
    return list, path
end

local function read_kconfig(file)
    if korig[file] then return korig[file] end
    local t = {}
    local text = read_file(file)
    if text then
        each_line(text, function(line)
            line = line:gsub("^\239\187\191", ""):gsub(";.*", "")
            local k, v = line:match('^%s*([%w_]+)%s*=%s*"?([^"]*)')
            if k and v then v = trim(v); t[k] = tonumber(v) or v end
        end)
    end
    korig[file] = t
    return t
end

ext.kit_list = kit_list

-- archivo config.txt del kit que se esta viendo
local function kit_config_file(ctx)
    local c = current_kit(ctx)
    if not c.team then return nil end
    local ck = tostring(c.team) .. (c.is_gk and "g" or "p")
    local e = kcache[ck]
    if not e then
        local list, path = kit_list(c.team, c.is_gk)
        e = { list = list, path = path }
        kcache[ck] = e
    end
    if not e.path then return nil, "k_nomap" end
    if not e.list or #e.list == 0 then return nil, "k_noorder" end
    local ord
    local kf = c.cfg and c.cfg.KitFile
    if type(kf) == "string" then ord = tonumber(kf:match("^k%d+[pg](%d+)")) end   -- nombre que pone kserv
    ord = ord or (c.is_gk and 1 or (c.kid + 1))
    local folder = e.list[ord]
    if not folder then return nil, "k_noorder" end
    return kroot .. e.path .. "\\" .. folder .. "\\config.txt", e.path .. "\\" .. folder
end

local KFIELDS = {
    { k = "Name", min = 0, max = 1, es = { "Si", "No" }, en = { "On", "Off" } },
    { k = "NameShape", min = 0, max = 3, es = { "Recto", "Curva leve", "Curva media", "Curva extrema" },
      en = { "Straight", "Light curve", "Medium curve", "Extreme curve" } },
    { k = "NameStretch", min = 0, max = 3 },
    { k = "BackNumberType", min = 0, max = 1 },
    { k = "ShortsNumberSide", min = 0, max = 1, es = { "Izquierda", "Derecha" }, en = { "Left", "Right" } },
    { k = "TightKit", min = 0, max = 1, es = { "No", "Si" }, en = { "Off", "On" } },
    { k = "SleeveLimits", min = 0, max = 2, es = { "Ninguno", "Solo largas", "Solo cortas" },
      en = { "None", "Only long", "Only short" } },
    { k = "ShirtPattern", min = 0, max = 6 },
    { k = "Collar", min = 1, max = 135 },
    { k = "WinterCollar", min = 1, max = 135 },
    { k = "ShortSleevesModel", min = 1, max = 2 },
    { k = "ShortsModel", min = 0, max = 17 },
    -- estos no existen en el kit del juego: KitPos los oculta poniendo su escala en 0
    { k = "vchest", virtual = "ChestNumberSize" },
    { k = "vback", virtual = "BackNumberSize" },
    { k = "vshorts", virtual = "ShortsNumberSize" },
    { k = "vlower", virtual = "NameLower", toggle = true },
}

local function kvalue(ctx, file, k)
    local c = current_kit(ctx)
    local e = file and kedits[file]
    if e and e[k] ~= nil then return e[k], true end
    local o = file and read_kconfig(file)
    if o and o[k] ~= nil then return tonumber(o[k]) or o[k], false end
    return c.cfg and tonumber(c.cfg[k]), false
end

local function kset_live(ctx, k, v)
    local c = current_kit(ctx)
    if not (c.team and ctx and ctx.kits) then return end
    local cfg
    if c.is_gk then cfg = ctx.kits.get_gk(c.team) else cfg = ctx.kits.get(c.team, c.kid) end
    if not cfg then return end
    cfg[k] = v
    if c.is_gk then ctx.kits.set_gk(c.team, cfg) else ctx.kits.set(c.team, c.kid, cfg) end
    c.cfg = cfg
    refresh_pending = true
end

local function save_kserv()
    local n = 0
    for file, edits in pairs(kedits) do
        if has_any(edits) then
            local text = read_file(file)
            if text then
                -- copia de seguridad la primera vez
                if not read_file(file .. ".bak-kitpos") then write_file(file .. ".bak-kitpos", text) end
                local nl = text:find("\r\n", 1, true) and "\r\n" or "\n"
                local out, done = {}, {}
                each_line(text, function(line)
                    local body = line:gsub(";.*", "")
                    local k = body:match("^%s*([%w_]+)%s*=")
                    if k and edits[k] ~= nil then
                        local comment = line:match("(;.*)$")
                        line = k .. "=" .. tostring(edits[k]) .. (comment and ("    " .. comment) or "")
                        done[k] = true
                    end
                    out[#out + 1] = line
                end)
                if out[#out] == "" then out[#out] = nil end
                local extra = {}
                for k, v in pairs(edits) do if not done[k] then extra[#extra + 1] = k end end
                if #extra > 0 then
                    table.sort(extra)
                    out[#out + 1] = ""
                    out[#out + 1] = "; values added by kitpos.lua"
                    for _, k in ipairs(extra) do out[#out + 1] = k .. "=" .. tostring(edits[k]) end
                end
                local ok, err = write_file(file, table.concat(out, nl) .. nl)
                if ok then
                    korig[file] = nil
                    kedits[file] = nil
                    n = n + 1
                else
                    log("kitpos: " .. err)
                end
            end
        end
    end
    return n
end

local function kit_text(ctx, lines)
    local c = current_kit(ctx)
    local file, info = kit_config_file(ctx)
    lines[#lines + 1] = tr("page_kit")
    if file then lines[#lines + 1] = tr("k_path", info) else lines[#lines + 1] = tr(info or "k_nomap") end
    lines[#lines + 1] = "-----------------------------------------------------------------------------"
    lines[#lines + 1] = tr("kcols")
    local eff = resolve(kit_key(c.team, c.kid, c.is_gk)) or {}
    for i, fd in ipairs(KFIELDS) do
        local mark = (i == ui.kfield) and " >> " or "    "
        local val, where, mod
        if fd.virtual then
            if fd.k == "vchest" and i > 1 then lines[#lines + 1] = "" end
            if fd.toggle then
                val = (eff[fd.virtual] == 1) and tr("lower_on") or tr("lower_off")
                if not lower_ok then val = tr("lower_na") end
            else
                val = (eff[fd.virtual] == 0) and tr("vis_off") or tr("vis_on")
            end
            where = tr("k_kitpos")
        else
            local v
            v, mod = kvalue(ctx, file, fd.k)
            local names = fd[lang] or fd.es
            if v ~= nil and names and names[(tonumber(v) or 0) - fd.min + 1] then
                val = names[(tonumber(v) or 0) - fd.min + 1]
            else
                val = (v ~= nil) and tostring(v) or "--"
            end
            where = tr("k_file") .. (mod and ("  " .. tr("k_changed")) or "")
        end
        lines[#lines + 1] = string.format("%s%-28s %-18s %s", mark, tr("kf_" .. fd.k), val, where)
    end
    lines[#lines + 1] = "-----------------------------------------------------------------------------"
    lines[#lines + 1] = tr("k_help1")
    lines[#lines + 1] = tr("help_undo")
    lines[#lines + 1] = tr("k_help2")
end

local function kit_key_press(ctx, vkey)
    local fd = KFIELDS[ui.kfield]
    if vkey == 0x26 then ui.kfield = (ui.kfield - 2) % #KFIELDS + 1; return true end
    if vkey == 0x28 then ui.kfield = ui.kfield % #KFIELDS + 1; return true end
    local c = current_kit(ctx)
    if not c.team then return false end
    if fd.virtual then
        if vkey == 0x25 or vkey == 0x27 or vkey == 0x2E or vkey == 0x08 then
            local key = kit_key(c.team, c.kid, c.is_gk)
            local eff = resolve(key) or {}
            teams[key] = teams[key] or {}
            push_undo({ t = "pos", key = key, f = fd.virtual, old = teams[key][fd.virtual], label = tr("kf_" .. fd.k) })
            local reset = (vkey == 0x2E or vkey == 0x08)
            if fd.toggle then
                if not lower_ok then ui.msg = tr("lower_na"); return true end
                if reset or eff[fd.virtual] == 1 then teams[key][fd.virtual] = nil
                else teams[key][fd.virtual] = 1 end
                ui.msg = (teams[key][fd.virtual] == 1) and tr("lower_msg", glyph_count) or ""
                changed(ctx)
                return true
            end
            if reset or eff[fd.virtual] == 0 then
                teams[key][fd.virtual] = nil                  -- volver a mostrar
            else
                teams[key][fd.virtual] = 0                    -- ocultar (escala 0)
            end
            ui.msg = ""
            changed(ctx)
            return true
        end
        return false
    end
    local file = kit_config_file(ctx)
    local fkey = file or "(sin archivo)"
    if vkey == 0x25 or vkey == 0x27 then
        local v = tonumber((kvalue(ctx, file, fd.k))) or fd.min
        push_undo({ t = "k", key = fkey, f = fd.k, file = file,
                    old = kedits[fkey] and kedits[fkey][fd.k], live = v, label = tr("kf_" .. fd.k) })
        v = v + ((vkey == 0x27) and 1 or -1)
        if v > fd.max then v = fd.min elseif v < fd.min then v = fd.max end
        kedits[fkey] = kedits[fkey] or {}
        kedits[fkey][fd.k] = v
        kset_live(ctx, fd.k, v)
        ui.dirty = true
        ui.msg = ""
        return true
    elseif vkey == 0x2E or vkey == 0x08 then
        if kedits[fkey] and kedits[fkey][fd.k] ~= nil then
            push_undo({ t = "k", key = fkey, f = fd.k, file = file, old = kedits[fkey][fd.k],
                        live = kedits[fkey][fd.k], label = tr("kf_" .. fd.k) })
            kedits[fkey][fd.k] = nil
            local o = file and read_kconfig(file) or {}
            if o[fd.k] ~= nil then kset_live(ctx, fd.k, tonumber(o[fd.k]) or o[fd.k]) end
        end
        ui.msg = ""
        return true
    end
    return false
end

local function do_undo(ctx)
    local e = table.remove(undo)
    if not e then ui.msg = tr("nothing_undo"); return end
    if e.t == "pos" then
        teams[e.key] = teams[e.key] or {}
        teams[e.key][e.f] = e.old
        changed(ctx)
    elseif e.t == "k" then
        kedits[e.key] = kedits[e.key] or {}
        kedits[e.key][e.f] = e.old
        local v = e.old
        if v == nil then
            local o = e.file and read_kconfig(e.file) or {}
            v = (o[e.f] ~= nil) and (tonumber(o[e.f]) or o[e.f]) or e.live
        end
        kset_live(ctx, e.f, v)
        ui.dirty = true
    end
    ui.msg = tr("undone", e.label or e.f)
end

local function force_refresh(ctx)
    -- vuelve a poner las ranuras, reescribe la tabla y pide al juego que rearme los uniformes
    local c = current_kit(ctx)
    if ctx and ctx.kits then
        ensure_team(ctx, ctx.kits.get_current_team(0))
        ensure_team(ctx, ctx.kits.get_current_team(1))
        if c.team then ensure_kit(ctx, c.team, c.kid, c.is_gk) end
        apply()
        kick(ctx)
        last_refresh, refresh_pending = frame, false
        confirm_at = frame + 15            -- y una segunda vez un cuarto de segundo despues
    end
    ui.msg = tr("refreshed")
end


-- Filas visibles de la pagina 1: si un elemento esta oculto (escala 0 en KitPos, o el nombre
-- desactivado en la pagina 2) sus controles de posicion desaparecen y queda una sola fila.
local function group_hidden(c, sizef, eff)
    if eff[sizef] == 0 then return "o" end
    if sizef == "NameSize" and c.cfg and tonumber(c.cfg.Name) == 1 then return "k" end
    return nil
end

local function visible_rows(ctx)
    local c = current_kit(ctx)
    local eff = (c.team and resolve(kit_key(c.team, c.kid, c.is_gk))) or {}
    local rows = {}
    for _, f in ipairs(DISPLAY) do
        if (f ~= "NameCurve" and f ~= "NameSpacing") or curve_ok then
            local g = GROUP_SIZE[f]
            local h = group_hidden(c, g, eff)
            if not h then rows[#rows + 1] = { f = f }
            elseif f == g then rows[#rows + 1] = { f = f, hidden = h } end
        end
    end
    return rows
end

local function selected_row(rows)
    for i, r in ipairs(rows) do if r.f == ui.sel then return i, r end end
    -- el campo elegido quedo oculto: pasar a la fila de su grupo
    local g = GROUP_SIZE[ui.sel]
    for i, r in ipairs(rows) do if r.f == g then ui.sel = r.f; return i, r end end
    ui.sel = rows[1].f
    return 1, rows[1]
end

local function editor_text(ctx)
    local c = current_kit(ctx)
    local hits = cave and memory.unpack("u32", memory.read(cave + OFF_HITS, 4)) or 0
    local lines = {}
    lines[#lines + 1] = tr("header", m.version, tr(status, status_arg), slots_loaded, hits)
    if mode_ok or res_ok then lines[#lines + 1] = tr("letters_line", letter_mode, tostring(name_res)) end
    if not c.team then
        lines[#lines + 1] = ""
        lines[#lines + 1] = tr("enter_menu")
        lines[#lines + 1] = tr("space_hide")
        return table.concat(lines, "\n")
    end
    local kitname = c.is_gk and tr("gk") or ("p" .. (c.kid + 1))
    local mode = (ui.team_wide and not c.is_gk) and tr("mode_team") or tr("mode_kit")
    local side = c.cfg and tonumber(c.cfg.ShortsNumberSide)
    local sidename = side and tr("side", side) or "?"
    lines[#lines + 1] = tr("team_line", tostring(c.team), kitname, mode, ui.dirty and tr("unsaved") or "")
    if compare then lines[#lines + 1] = tr("compare_on") end
    if ui.page == 2 then
        kit_text(ctx, lines)
        if ui.msg ~= "" then lines[#lines + 1] = ">> " .. ui.msg end
        return table.concat(lines, "\n")
    end
    lines[#lines + 1] = tr("side_line", sidename)
    lines[#lines + 1] = tr("page_pos")
    lines[#lines + 1] = "-----------------------------------------------------------------------------"
    lines[#lines + 1] = tr("cols")
    local key = target_key(ctx)
    local own = teams[key] or {}
    local eff = resolve(kit_key(c.team, c.kid, c.is_gk)) or {}
    local rows = visible_rows(ctx)
    local sel_i = selected_row(rows)
    for i, r in ipairs(rows) do
        local f = r.f
        local first_of_group = GROUP_START[f] or (r.hidden and true)
        if first_of_group and i > 1 then lines[#lines + 1] = "" end
        local mark = (i == sel_i) and " >> " or "    "
        if r.hidden then
            lines[#lines + 1] = string.format("%s%-21s %7s                %s", mark, tr("grp_" .. f), tr("vis_off"),
                (r.hidden == "k") and tr("hid_k") or tr("hid_o"))
            goto continue
        end
        do
        local v, origin
        if own[f] then v, origin = own[f], (ui.team_wide and not c.is_gk) and tr("o_team") or tr("o_kit")
        elseif eff[f] then v, origin = eff[f], tr("o_inh")
        else v, origin = kit_default(ctx, f), tr("o_game") end
        local shown, steps = fmt(v), fmt_steps(to_steps(f, v, c.cfg))
        -- CAMBIO: cuanto te moviste respecto del kit, en pasos de kserv
        local delta = "      "
        local base = kit_default(ctx, f)
        if v and base and (own[f] or eff[f]) then
            local d = (to_steps(f, v, c.cfg) or 0) - (to_steps(f, base, c.cfg) or 0)
            delta = string.format("%+6.2f", d)
            if math.abs(d) < 0.005 then delta = "  0.00" end
        end
        local b = bar(f, v, base or v, c.cfg)
        if v == 0 and GROUP_SIZE[f] == f then
            shown, steps, delta, b = string.format("%7s", tr("vis_off")), "     ", "      ", string.rep(" ", BAR_W + 2)
        end
        lines[#lines + 1] = string.format("%s%-21s %s  %s  %s  %s  %s", mark, tr(f), shown, steps, delta, b, origin)
        end
        ::continue::
    end
    local stepval, stepname = modifier_step(ui.sel)
    lines[#lines + 1] = "-----------------------------------------------------------------------------"
    lines[#lines + 1] = tr("help1", stepname, stepval)
    lines[#lines + 1] = tr("help2")
    lines[#lines + 1] = tr("help_undo") .. "   " .. tr("help_hide")
    lines[#lines + 1] = tr("compare_hint") .. "     " .. tr("bar_help")
    lines[#lines + 1] = tr("help3")
    if ui.sel == "NameCurve" then lines[#lines + 1] = tr("curve_hint") end
    if ui.sel == "NameSpacing" then lines[#lines + 1] = tr("spacing_hint") end
    if lower_ok and cave and eff.NameLower == 1 then
        -- letras que el juego pidio y no estan en la fuente de minusculas (codigos UTF-8)
        local cnt = memory.unpack("u32", memory.read(cave + OFF_MISSIDX, 4))
        local seen, list = {}, {}
        for k = 0, math.min(cnt, 16) - 1 do
            local code = memory.unpack("u32", memory.read(cave + OFF_MISSBUF + k * 4, 4))
            if not seen[code] then
                seen[code] = true
                local str = ""
                local v = code
                while v > 0 do str = string.char(v % 256) .. str; v = math.floor(v / 256) end
                list[#list + 1] = string.format("%X(%s)", code, str)
            end
        end
        lines[#lines + 1] = tr("lower_line", glyph_count, (#list > 0) and table.concat(list, " ") or "-")
        if diag_ok then
            local function cstr(off)
                local raw = memory.read(cave + off, 48)
                local z = raw:find("\0", 1, true)
                if z then raw = raw:sub(1, z - 1) end
                return (raw:gsub("[\128-\255]", function(ch) return string.format("<%02X>", ch:byte()) end))
            end
            lines[#lines + 1] = tr("names_line", name_count, cstr(OFF_STR1))
        end
    end
    if ui.msg ~= "" then lines[#lines + 1] = ">> " .. ui.msg end
    return table.concat(lines, "\n")
end

local function editor_key(ctx, vkey)
    -- Con el overlay de kitpos abierto el juego no recibe teclas (input.set_blocked),
    -- asi que se pueden usar flechas y letras sin mover el menu.
    if vkey == 0x21 or vkey == 0x22 then ui.page = (ui.page == 1) and 2 or 1; ui.msg = ""; return end  -- RePag / AvPag
    if vkey == 0x47 then                                                    -- G: guarda todo
        local n = save_kserv()
        save_ini()
        if n > 0 then ui.msg = tr("k_saved", n) end
        return
    end
    if vkey == 0x42 then                                                    -- B: comparar antes / despues
        local c = current_kit(ctx)
        if compare then compare = nil
        elseif c.team then
            compare = { key = kit_key(c.team, c.kid, c.is_gk), slot = c.cfg and tonumber(c.cfg[SLOT_KEY]) }
        end
        apply()
        if ctx and ctx.kits then kick(ctx); last_refresh = frame; refresh_pending = false end
        ui.msg = ""
        return
    end
    if compare and (vkey == 0x25 or vkey == 0x27 or vkey == 0x4F or vkey == 0x4D or vkey == 0x2E
                    or vkey == 0x08 or vkey == 0x5A) then
        compare = nil                                                       -- al editar se sale de la comparacion
        apply()
    end
    if vkey == 0x5A then do_undo(ctx); return end                           -- Z / Ctrl+Z: deshacer
    if vkey == 0x56 then force_refresh(ctx); return end                     -- V: refrescar la vista del uniforme
    if vkey == 0x4B and mode_ok then                                        -- K: modo de mezcla de las letras
        local i = 1
        for k, v in ipairs(MODE_LIST) do if v == letter_mode then i = k end end
        letter_mode = MODE_LIST[i % #MODE_LIST + 1]
        apply_letter_mode()
        ui.dirty = true
        force_refresh(ctx)
        ui.msg = tr("letters_msg", letter_mode)
        return
    end
    if vkey == 0x4E and res_ok then                                         -- N: resolucion del nombre
        local i = 1
        for k, v in ipairs(RES_LIST) do if v == name_res then i = k end end
        name_res = RES_LIST[i % #RES_LIST + 1]
        apply_name_res()
        ui.dirty = true
        force_refresh(ctx)
        ui.msg = tr("res_msg", tostring(name_res), math.floor(1600 * name_res + 0.5), math.floor(256 * name_res + 0.5))
        return
    end
    if vkey == 0x43 then                                                    -- C: recarga todo
        korig, kedits, kcache, kmap_loaded = {}, {}, {}, false
        load_glyphs(); load_names()
        undo = {}
    end
    if ui.page == 2 and vkey ~= 0x43 and vkey ~= 0x4C and vkey ~= 0x09 then
        kit_key_press(ctx, vkey)
        return
    end
    local rows = visible_rows(ctx)
    local sel_i, sel_r = selected_row(rows)
    local f = sel_r.f
    if vkey == 0x26 then ui.sel = rows[(sel_i - 2) % #rows + 1].f; return   -- arriba
    elseif vkey == 0x28 then ui.sel = rows[sel_i % #rows + 1].f; return     -- abajo
    elseif vkey == 0x09 then ui.team_wide = not ui.team_wide; return      -- Tab
    elseif vkey == 0x43 then reload(ctx, true); ui.dirty = false; ui.msg = tr("reloaded"); return  -- C
    elseif vkey == 0x4C then lang = (lang == "es") and "en" or "es"; ui.dirty = true; ui.msg = tr("lang_set"); return  -- L
    end
    local key = target_key(ctx)
    if not key then return end
    if vkey == 0x4F then                                                   -- O: ocultar / mostrar
        local sf = GROUP_SIZE[f]
        if sf == "NameSize" then
            -- El juego no deja ocultar el nombre con escala 0 (la achica pero la sigue dibujando),
            -- asi que se apaga con la opcion Name del config.txt de kserv (igual que en la pagina 2).
            local c = current_kit(ctx)
            local eff = resolve(kit_key(c.team, c.kid, c.is_gk)) or {}
            if eff.NameSize == 0 and teams[key] and teams[key].NameSize == 0 then
                push_undo({ t = "pos", key = key, f = "NameSize", old = 0, label = tr("grp_NameSize") })
                undo[#undo].frame = -1000
                teams[key].NameSize = nil              -- escala 0 de versiones anteriores
                ui.msg = tr("shown_msg", tr("grp_NameSize"))
                changed(ctx)
                return
            end
            local file = kit_config_file(ctx)
            local fkey = file or "(sin archivo)"
            local cur = tonumber((kvalue(ctx, file, "Name"))) or 0
            push_undo({ t = "k", key = fkey, f = "Name", file = file,
                        old = kedits[fkey] and kedits[fkey].Name, live = cur, label = tr("kf_Name") })
            undo[#undo].frame = -1000
            local v = (cur == 1) and 0 or 1
            kedits[fkey] = kedits[fkey] or {}
            kedits[fkey].Name = v
            kset_live(ctx, "Name", v)
            ui.dirty = true
            ui.msg = tr((v == 1) and "hidden_msg" or "shown_msg", tr("grp_NameSize")) .. "  " .. tr("name_off_note")
            return
        end
        teams[key] = teams[key] or {}
        local c = current_kit(ctx)
        local eff = resolve(kit_key(c.team, c.kid, c.is_gk)) or {}
        push_undo({ t = "pos", key = key, f = sf, old = teams[key][sf], label = tr(sf) })
        undo[#undo].frame = -1000
        if eff[sf] == 0 then
            teams[key][sf] = nil
            ui.msg = tr("shown_msg", tr(sf))
        else
            teams[key][sf] = 0
            ui.msg = tr("hidden_msg", tr(sf))
        end
        changed(ctx)
        return
    end
    if sel_r.hidden then return end                                        -- fila oculta: solo O
    if vkey == 0x4D then                                                   -- M: espejar short
        -- el juego usa 0.04..0.23 de un lado y 0.96..0.77 del otro: el espejo es 1 - v
        teams[key] = teams[key] or {}
        local c = current_kit(ctx)
        local eff = resolve(kit_key(c.team, c.kid, c.is_gk)) or {}
        local v = teams[key].ShortsNumberY or eff.ShortsNumberY or kit_default(ctx, "ShortsNumberY")
        if v then
            push_undo({ t = "pos", key = key, f = "ShortsNumberY", old = teams[key].ShortsNumberY, label = tr("ShortsNumberY") })
            undo[#undo].frame = -1000          -- el espejo nunca se junta con otro paso
            teams[key].ShortsNumberY = clamp("ShortsNumberY", 1 - v)
            ui.msg = tr("mirrored", 1 - v)
            changed(ctx)
        end
        return
    end
    if vkey == 0x2E or vkey == 0x08 then                                   -- Supr / Retroceso
        if teams[key] and teams[key][f] then
            push_undo({ t = "pos", key = key, f = f, old = teams[key][f], label = tr(f) })
            undo[#undo].frame = -1000
            teams[key][f] = nil; ui.msg = ""; changed(ctx)
        end
    elseif vkey == 0x25 or vkey == 0x27 then                               -- izq / der
        teams[key] = teams[key] or {}
        local c = current_kit(ctx)
        local eff = resolve(kit_key(c.team, c.kid, c.is_gk)) or {}
        local base = teams[key][f] or eff[f] or kit_default(ctx, f) or 0.5
        local step = modifier_step(f)
        push_undo({ t = "pos", key = key, f = f, old = teams[key][f], label = tr(f) })
        teams[key][f] = clamp(f, base + step * ((vkey == 0x27) and 1 or -1))
        ui.msg = ""
        changed(ctx)
    end
end

-- ===================== eventos =====================
-- (kitpos va despues de kserv en sider.ini, asi estos eventos corren despues de que
--  kserv cargo los kits y la ranura no se pierde)
function m.set_teams(ctx, home, away)
    reset_slots()
    reload(nil, true)
    ensure_team(ctx, home)
    ensure_team(ctx, away)
    apply()
end

function m.set_home_team_for_kits(ctx, team_id, edit_mode)
    if edit_mode == 1 then reset_slots() end
    kcache, korig = {}, {}
    reload(nil, true)
    ensure_team(ctx, team_id)
    apply()
end

function m.set_kits(ctx)
    if lower_ok then ext.dump_charmap() end
    ensure_team(ctx, ctx.home_team)
    ensure_team(ctx, ctx.away_team)
    apply()
end

function m.after_set_conditions(ctx)
    ensure_team(ctx, ctx.home_team)
    ensure_team(ctx, ctx.away_team)
    apply()
end

-- Una pulsacion = un paso. Si se mantiene apretada, repite despacio (tras 0,4 s, cada ~0,07 s).
local REPEATABLE = { [0x25] = true, [0x27] = true, [0x26] = true, [0x28] = true }

function m.key_down(ctx, vkey)
    if held[vkey] then return end          -- autorepeticion de Windows: se ignora
    held[vkey] = frame
    editor_key(ctx, vkey)
end

function m.key_up(ctx, vkey)
    held[vkey] = nil
end

function m.show(ctx)
    -- mientras el overlay de kitpos este visible, el juego no recibe teclado ni mando
    if input and input.set_blocked then input.set_blocked(true) end
end

function m.hide(ctx)
    for k in pairs(held) do held[k] = nil end
    if input and input.set_blocked then input.set_blocked(false) end
end

local function handle_hold(ctx)
    for vkey, since in pairs(held) do
        if REPEATABLE[vkey] and frame - since >= 24 and frame % 4 == 0 then
            editor_key(ctx, vkey)
        end
    end
end

function m.overlay_on(ctx)
    frame = frame + 1
    if frame % 20 == 0 then reload(ctx) end
    if frame % 60 == 30 and lower_ok then ext.dump_charmap() end
    if frame % 60 == 0 then                 -- por si kserv cambio de kit y piso la ranura
        local c = current_kit(ctx)
        if c.team and ensure_kit(ctx, c.team, c.kid, c.is_gk) then apply(); refresh_pending = true end
    end
    handle_hold(ctx)
    do_pending_refresh(ctx)
    do_confirm_refresh(ctx)
    local text = editor_text(ctx)
    if not image_on then return text end
    -- panel con logo: resalta el elemento que se esta editando
    local name = "none"
    local c = current_kit(ctx)
    if c.team then
        if ui.page == 2 then name = "kit"
        else
            local g = GROUP_SIZE[ui.sel]
            name = ({ NameSize = "name", BackNumberSize = "back", ChestNumberSize = "chest",
                      ShortsNumberSize = "shorts" })[g] or "none"
        end
    end
    return text, kitpos_dir .. "\\img\\kitpos_" .. name .. ".png",
           { image_width = 0.13, image_hmargin = 12, image_vmargin = 8 }
end

function m.init(ctx)
    kitpos_dir = ctx.sider_dir .. "content\\kitpos"
    kroot = ctx.sider_dir .. "content\\kit-server\\"
    ext.kroot = kroot
    ini_path = kitpos_dir .. "\\kitpos_slots.ini"
    seed_paths = { ctx.sider_dir .. "content\\kitpos\\kitpos.ini",
                   ctx.sider_dir .. "modules\\kitpos.ini" }
    if install() then
        dump_image()
        reload(nil, true)
        apply_letter_mode()
        apply_name_res()
        load_glyphs()
        load_names()
        local function rf(a) return memory.unpack("f", memory.read(a, 4)) end
        log(string.format("kitpos: curvas del nombre 1/2/3 = %.5f %.5f %.5f  x%.5f | ajuste Y = %.5f %.5f %.5f | eps = %g",
            rf(0x142AA2498), rf(0x1425D2120), rf(0x142AA2494), rf(0x1425D0724),
            rf(0x14261306C), rf(0x142A995B0), rf(0x142A995B4), rf(0x1425EDAB0)))
    end
    log("kitpos: " .. status .. (status_arg and (" " .. status_arg) or ""))
    ctx.register("set_teams", m.set_teams)
    ctx.register("set_home_team_for_kits", m.set_home_team_for_kits)
    ctx.register("set_kits", m.set_kits)
    ctx.register("after_set_conditions", m.after_set_conditions)
    ctx.register("overlay_on", m.overlay_on)
    ctx.register("key_down", m.key_down)
    ctx.register("key_up", m.key_up)
    ctx.register("show", m.show)
    ctx.register("hide", m.hide)
end

return m
