--[[
    edit21_db.lua  v1.6  -- modulo de SOLO LECTURA para PES Editor
    -------------------------------------------------------------------
    No modifica el juego. Cuando PES carga su base de datos (common\etc\pesdb\*.bin)
    guarda una copia de cada archivo tal como el juego lo usa (con todo lo que
    agregan los mods) en:

        <carpeta de sider>\content\edit21-db\

    Novedades de la v1.6:
      - tambien copia el fisico de los jugadores
        (common\character0\model\character\appearance\PlayerAppearance.bin):
        PES Editor lo usa al agregar jugadores de la base a tu EDIT, para que
        no queden con el cuerpo en -7

    v1.5:
      - el io de Sider no deja escribir archivos en algunas instalaciones
        (io.open devuelve nil sin error, tambien a otros modulos). Si pasa eso,
        el modulo escribe con las funciones de Windows por medio de ffi
        (necesita luajit.ext.enabled = 1 en sider.ini, que Sider ya trae)
      - crea la carpeta de salida si no existe
      - anota en sider.log que metodo de escritura uso

    v1.4: no toca archivos mientras Sider arranca; elige la carpeta al cargar la base.
    v1.3: carpeta de reserva content\pes-editor-db, estado.txt y errores en sider.log.
    v1.2: copia todos los archivos de pesdb y escribe index.txt.

    Funciona con cualquier juego hecho sobre PES 2021 (tambien Football Life
    2026, con FL_2026.exe y Sider en SiderAddons): Sider avisa de cada archivo
    que el juego lee de cualquier .cpk (Data, download\data_s2526*.cpk) o de
    livecpk, y el modulo se queda con los de common\etc\pesdb.

    Como completar la copia: abri el juego hasta el menu principal, entra en
    Partido > Amistoso hasta la eleccion de equipos (ahi el juego carga el
    resto de la base) y cerra el juego. PES Editor avisa si falta algo.
]]

local m = { version = "1.6" }
local OUT, INDEX, CANDS, failed
local done, count, partial = {}, 0, {}
local METHOD -- "io" o "ffi"

-- ---------- escritura con Windows (ffi) ----------
local W -- funciones de kernel32, se preparan la primera vez
local function ffi_setup()
    if W ~= nil then return W end
    W = false
    if type(ffi) ~= "table" or type(ffi.cdef) ~= "function" then
        log("[edit21_db] ffi no disponible (activa luajit.ext.enabled = 1 en sider.ini)")
        return W
    end
    -- nombres propios (e21_*) para no chocar con declaraciones de otros modulos
    ffi.cdef[[
        int e21_MultiByteToWideChar(unsigned int cp, unsigned long flags, const char *s, int n, uint16_t *w, int wn) __asm__("MultiByteToWideChar");
        void *e21_CreateFileW(const uint16_t *name, unsigned long access, unsigned long share, void *sec, unsigned long disp, unsigned long flags, void *tmpl) __asm__("CreateFileW");
        int e21_WriteFile(void *h, const char *buf, unsigned long n, unsigned long *written, void *ov) __asm__("WriteFile");
        unsigned long e21_SetFilePointer(void *h, long dist, long *hi, unsigned long method) __asm__("SetFilePointer");
        int e21_CloseHandle(void *h) __asm__("CloseHandle");
        int e21_CreateDirectoryW(const uint16_t *name, void *sec) __asm__("CreateDirectoryW");
        unsigned long e21_GetLastError(void) __asm__("GetLastError");
    ]]
    W = ffi.C
    return W
end

local function wide(s)
    local n = W.e21_MultiByteToWideChar(65001, 0, s, -1, nil, 0)
    local buf = ffi.new("uint16_t[?]", n + 1)
    W.e21_MultiByteToWideChar(65001, 0, s, -1, buf, n)
    return buf
end

local function ffi_write(path, bytes, offset)
    if not ffi_setup() then return false, "sin ffi" end
    -- 0x40000000 = GENERIC_WRITE, 1 = FILE_SHARE_READ, 2 = CREATE_ALWAYS, 4 = OPEN_ALWAYS
    local h = W.e21_CreateFileW(wide(path), 0x40000000, 1, nil, (offset > 0) and 4 or 2, 0x80, nil)
    if ffi.cast("intptr_t", h) == -1 then
        return false, "error de Windows " .. tostring(tonumber(W.e21_GetLastError()))
    end
    if offset > 0 then W.e21_SetFilePointer(h, offset, nil, 0) end
    local wr = ffi.new("unsigned long[1]")
    local ok = W.e21_WriteFile(h, bytes, #bytes, wr, nil)
    W.e21_CloseHandle(h)
    if ok == 0 then return false, "WriteFile fallo" end
    return true
end

-- ---------- escritura con io (lo normal) ----------
local function io_write(path, bytes, offset)
    local f, err
    if offset > 0 then
        f, err = io.open(path, "r+b")
        if f then f:seek("set", offset) end
    else
        f, err = io.open(path, "wb")
    end
    if not f then return false, tostring(err) end
    f:write(bytes); f:close()
    return true
end

-- escribe con el metodo que funciono; la primera vez prueba io y despues ffi
local function write(path, bytes, offset)
    offset = offset or 0
    if METHOD == "io" then return io_write(path, bytes, offset) end
    if METHOD == "ffi" then return ffi_write(path, bytes, offset) end
    local ok, err = io_write(path, bytes, offset)
    if ok then METHOD = "io"; return true end
    local ok2, err2 = ffi_write(path, bytes, offset)
    if ok2 then
        METHOD = "ffi"
        log("[edit21_db] io.open no deja escribir (" .. err .. "): uso las funciones de Windows (ffi)")
        return true
    end
    return false, "io: " .. err .. " / ffi: " .. tostring(err2)
end

local function status(msg)
    if OUT then write(OUT .. "estado.txt", os.date("%Y-%m-%d %H:%M:%S") .. "\t" .. msg .. "\r\n") end
end

local function basename(fn)
    local l = string.lower(fn)
    if string.find(l, "playerappearance%.bin$") then return string.match(fn, "([^\\/]+)$") end
    if not string.find(l, "pesdb", 1, true) then return nil end
    if not string.find(l, "%.bin$") then return nil end
    return string.match(fn, "([^\\/]+)$")
end

local function write_index()
    local t = { "# edit21_db v" .. m.version .. " -- copia de la base del juego (escrita con " .. tostring(METHOD) .. ")",
                "# archivo<TAB>bytes<TAB>fecha" }
    for name, info in pairs(done) do
        t[#t + 1] = string.format("%s\t%d\t%s", name, info.size, os.date("%Y-%m-%d %H:%M:%S", info.when))
    end
    write(INDEX, table.concat(t, "\r\n") .. "\r\n")
end

-- elige la carpeta de salida la primera vez que hace falta (no en init)
local function pick_out()
    if OUT then return true end
    local errs = {}
    for _, d in ipairs(CANDS) do
        if ffi_setup() then W.e21_CreateDirectoryW(wide(d), nil) end -- por si no existe
        local ok, err = write(d .. "estado.txt", os.date("%Y-%m-%d %H:%M:%S") .. "\tprobando v" .. m.version .. "\r\n")
        if ok then OUT = d; INDEX = OUT .. "index.txt"; break end
        errs[#errs + 1] = d .. " -> " .. tostring(err)
    end
    if not OUT then
        -- se vuelve a probar con el proximo archivo; el error se anota una sola vez
        if failed then return false end
        failed = true
        for _, e in ipairs(errs) do log("[edit21_db] ERROR no puedo escribir: " .. e) end
        log("[edit21_db] ERROR sin carpeta de salida (v" .. m.version .. ")")
        return false
    end
    for _, e in ipairs(errs) do log("[edit21_db] aviso, no se pudo usar " .. e .. " -> uso " .. OUT) end
    log("[edit21_db] v" .. m.version .. " escribiendo en " .. OUT .. " (metodo: " .. tostring(METHOD) .. ")")
    status("listo v" .. m.version .. " (" .. tostring(METHOD) .. ")")
    return true
end

function m.data_ready(ctx, filename, data, size, total_size, offset, cpk_filename)
    local b = basename(filename)
    if not b or done[b] then return end
    if not pick_out() then return end
    local bytes = memory.read(data, size)
    if not bytes then return end
    offset = offset or 0
    total_size = total_size or size
    if offset == 0 and partial[b] then partial[b] = nil end
    local ok, err = write(OUT .. b, bytes, offset)
    if not ok then
        log("[edit21_db] ERROR no se pudo escribir " .. OUT .. b .. " -> " .. tostring(err))
        status("error al escribir " .. b .. ": " .. tostring(err))
        return
    end
    partial[b] = (partial[b] or 0) + size
    if offset + size >= total_size or partial[b] >= total_size then
        done[b] = { size = total_size, when = os.time() }
        partial[b] = nil
        count = count + 1
        log(string.format("[edit21_db] copiado %s (%d bytes, origen=%s)", b, total_size, tostring(cpk_filename)))
        write_index()
        status(string.format("copiados %d archivos (ultimo: %s)", count, b))
    end
end

function m.overlay_on(ctx)
    local names = {}
    for k in pairs(done) do names[#names + 1] = k end
    table.sort(names)
    return string.format("edit21_db v%s (solo lectura, %s)\nArchivos de la base copiados: %d\n%s",
        m.version, tostring(METHOD or "-"), count, table.concat(names, ", "))
end

function m.init(ctx)
    -- sin abrir archivos aca: Sider todavia no lo permite durante init
    CANDS = { ctx.sider_dir .. "content\\edit21-db\\", ctx.sider_dir .. "content\\pes-editor-db\\" }
    ctx.register("livecpk_data_ready", m.data_ready)
    ctx.register("overlay_on", m.overlay_on)
    log("[edit21_db] v" .. m.version .. " listo. Salida en " .. CANDS[1] .. " (se elige al cargar la base; ffi: " .. type(ffi) .. ")")
end

return m
