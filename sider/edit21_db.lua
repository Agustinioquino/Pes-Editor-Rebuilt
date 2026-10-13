--[[
    edit21_db.lua  v1.3  -- modulo de SOLO LECTURA para PES Editor
    -------------------------------------------------------------------
    No modifica el juego. Cuando PES carga su base de datos (common\etc\pesdb\*.bin)
    guarda una copia de cada archivo tal como el juego lo usa (con todo lo que
    agrega el Dream Patch) en:

        <carpeta de sider>\content\edit21-db\

    Novedades de la v1.3:
      - si no puede escribir en content\edit21-db prueba en content\pes-editor-db
      - anota en sider.log el error exacto de Windows (permiso denegado, etc.)
        y deja estado.txt para que PES Editor lo muestre

    Novedades de la v1.2:
      - copia TODOS los archivos de pesdb (Player, Team, PlayerAssignment, Coach,
        Stadium, Country, Competition, Tactics, PlayerAppearance, etc.), no solo
        una lista fija
      - escribe index.txt con el nombre, tamano y hora de cada archivo copiado,
        para que PES Editor sepa si la copia esta completa
      - escribe de a trozos sin perder nada si el juego pide el archivo en partes
      - log mas claro en sider.log

    Como completar la copia: abri el juego hasta el menu principal, entra en
    Partido > Amistoso hasta la eleccion de equipos (ahi el juego carga el
    resto de la base) y cerra el juego. PES Editor avisa si falta algo.
]]

local m = { version = "1.3" }
local OUT, INDEX
local done, count, partial = {}, 0, {}
local started = os.time()

local function try_dir(dir)
    local f, err = io.open(dir .. "prueba_escritura.tmp", "wb")
    if not f then return false, err end
    f:write("ok"); f:close(); os.remove(dir .. "prueba_escritura.tmp")
    return true
end

local function status(msg)
    if not OUT then return end
    local f = io.open(OUT .. "estado.txt", "wb")
    if f then f:write(os.date("%Y-%m-%d %H:%M:%S"), "\t", msg, "\n"); f:close() end
end

local function basename(fn)
    local l = string.lower(fn)
    if not string.find(l, "pesdb", 1, true) then return nil end
    if not string.find(l, "%.bin$") then return nil end
    return string.match(fn, "([^\\/]+)$")
end

local function write_index()
    local f = io.open(INDEX, "w")
    if not f then return end
    f:write("# edit21_db v" .. m.version .. " -- copia de la base del juego\n")
    f:write("# archivo<TAB>bytes<TAB>fecha\n")
    for name, info in pairs(done) do
        f:write(string.format("%s\t%d\t%s\n", name, info.size, os.date("%Y-%m-%d %H:%M:%S", info.when)))
    end
    f:close()
end

function m.data_ready(ctx, filename, data, size, total_size, offset, cpk_filename)
    local b = basename(filename)
    if not b or done[b] then return end
    local bytes = memory.read(data, size)
    if not bytes then return end
    offset = offset or 0
    total_size = total_size or size
    local path = OUT .. b
    local f
    if offset == 0 and not partial[b] then
        f = io.open(path, "wb")
    else
        f = io.open(path, "r+b") or io.open(path, "wb")
        if f then f:seek("set", offset) end
    end
    if not f then
        local _, err = io.open(path, "ab")
        log("[edit21_db] ERROR no se pudo escribir " .. path .. " -> " .. tostring(err))
        status("error al escribir " .. b .. ": " .. tostring(err))
        return
    end
    f:write(bytes); f:close()
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
    return string.format("edit21_db v%s (solo lectura)\nArchivos de la base copiados: %d\n%s",
        m.version, count, table.concat(names, ", "))
end

function m.init(ctx)
    local cands = { ctx.sider_dir .. "content\\edit21-db\\", ctx.sider_dir .. "content\\pes-editor-db\\" }
    local errs = {}
    for _, d in ipairs(cands) do
        local ok, err = try_dir(d)
        if ok then OUT = d; break end
        errs[#errs + 1] = d .. " -> " .. tostring(err)
    end
    if not OUT then
        for _, e in ipairs(errs) do log("[edit21_db] ERROR no puedo escribir: " .. e) end
        log("[edit21_db] ERROR sin carpeta de salida: revisa permisos de Windows (Seguridad de Windows > Proteccion contra ransomware > Acceso controlado a carpetas) o crea content\\pes-editor-db")
        return
    end
    for _, e in ipairs(errs) do log("[edit21_db] aviso, no se pudo usar " .. e .. " -> uso " .. OUT) end
    INDEX = OUT .. "index.txt"
    ctx.register("livecpk_data_ready", m.data_ready)
    ctx.register("overlay_on", m.overlay_on)
    status("listo v" .. m.version)
    log("[edit21_db] v" .. m.version .. " listo. Salida en " .. OUT)
end

return m
