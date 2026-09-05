using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text.RegularExpressions;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly INotificacionesService _notificaciones;

    public DocumentosController(AppDbContext context, IWebHostEnvironment env, INotificacionesService notificaciones)
    {
        _context        = context;
        _env            = env;
        _notificaciones = notificaciones;
    }

[HttpPost("generar/{solicitudId}")]
public async Task<IActionResult> Generar(int solicitudId, [FromQuery] int usuarioId)
{
    var solicitud = await _context.Solicitudes
        .Include(s => s.TipoSolicitud)
        .Include(s => s.Proyecto)
        .Include(s => s.Empresa)
        .Include(s => s.Solicitante)
        .FirstOrDefaultAsync(s => s.Id == solicitudId);

    if (solicitud == null)
        return NotFound(new { mensaje = "Solicitud no encontrada." });

    var datosSolicitud = await _context.SolicitudDatos.FindAsync(solicitudId);
    var partes         = await _context.SolicitudPartes
        .Where(p => p.SolicitudId == solicitudId)
        .ToListAsync();

    var nombrePlantilla = ObtenerNombrePlantilla(solicitud.TipoSolicitud?.Nombre);
    if (nombrePlantilla == null)
        return BadRequest(new { mensaje = "No existe plantilla para este tipo de documento." });

    var rutaPlantilla = Path.Combine(_env.ContentRootPath, "plantillas", nombrePlantilla);
    if (!System.IO.File.Exists(rutaPlantilla))
        return BadRequest(new { mensaje = $"Plantilla no encontrada: {nombrePlantilla}" });

    // 1 — Construir diccionario de marcadores
    var marcadores = new Dictionary<string, string>();

    // Fecha
    var ahora = DateTime.UtcNow.AddHours(-6);
    marcadores["fecha_en_letras"] = NumerosALetrasService.FechaALetras(ahora);
    marcadores["fecha_dia"]       = ahora.Day.ToString();
    marcadores["fecha_mes"]       = ahora.ToString("MMMM", new System.Globalization.CultureInfo("es-GT"));
    marcadores["fecha_anio"]      = ahora.Year.ToString();

    // Datos del formulario
    if (!string.IsNullOrEmpty(datosSolicitud?.DatosJson))
    {
        var datosJson = System.Text.Json.JsonDocument.Parse(datosSolicitud.DatosJson);
        foreach (var prop in datosJson.RootElement.EnumerateObject())
            marcadores[prop.Name] = prop.Value.GetString() ?? "";
    }

    // Convertir montos a letras
    if (marcadores.TryGetValue("renta", out var rentaStr) && decimal.TryParse(rentaStr, out var renta))
    {
        marcadores["quetzales_en_letras"] = NumerosALetrasService.MontoALetras(renta);
        marcadores["monto_en_letras"]     = NumerosALetrasService.MontoALetras(renta);
    }

    if (marcadores.TryGetValue("deposito", out var depositoStr) && decimal.TryParse(depositoStr, out var deposito))
        marcadores["quetzales_deposito_en_letras"] = NumerosALetrasService.MontoALetras(deposito);

    // Convertir finca, folio, libro a letras (Registro de la Propiedad del inmueble)
    // NOTA: estas claves son distintas de folio_registro_mercantil_en_letras / libro_registro_mercantil_en_letras
    // (que corresponden al Registro Mercantil de la sociedad arrendante). Antes ambos pares usaban
    // el mismo nombre de marcador y el bloque de la sociedad sobrescribía silenciosamente estos valores.
    if (marcadores.TryGetValue("finca", out var finca) && !string.IsNullOrEmpty(finca))
        marcadores["finca_en_letras"] = long.TryParse(finca, out _)
            ? NumerosALetrasService.RegistroALetras(finca) : finca;

    if (marcadores.TryGetValue("folio", out var folio) && !string.IsNullOrEmpty(folio))
        marcadores["folio_en_letras"] = long.TryParse(folio, out _)
            ? NumerosALetrasService.RegistroALetras(folio) : folio;

    if (marcadores.TryGetValue("libro", out var libro) && !string.IsNullOrEmpty(libro))
        marcadores["libro_en_letras"] = long.TryParse(libro, out _)
            ? NumerosALetrasService.RegistroALetras(libro) : libro;

    // Fechas de inicio y terminación del contrato (campos nuevos del formulario)
    if (marcadores.TryGetValue("fecha_inicio_contrato", out var fechaInicioStr) &&
        DateTime.TryParse(fechaInicioStr, out var fechaInicioDt))
        marcadores["fecha_inicio_contrato_en_letras"] = NumerosALetrasService.FechaALetras(fechaInicioDt);

    if (marcadores.TryGetValue("fecha_terminacion_contrato", out var fechaFinStr) &&
        DateTime.TryParse(fechaFinStr, out var fechaFinDt))
        marcadores["fecha_terminacion_contrato_en_letras"] = NumerosALetrasService.FechaALetras(fechaFinDt);

    // Metros cuadrados en letras
    if (marcadores.TryGetValue("metros_cuadrados", out var metros) && long.TryParse(metros, out var metrosN))
        marcadores["metraje_en_letras"] = NumerosALetrasService.NumeroALetras(metrosN);

    // DPI del arrendatario en letras
    if (marcadores.TryGetValue("dpi_arrendatario", out var dpiArr) && !string.IsNullOrEmpty(dpiArr))
    {
        marcadores["dpi_en_letras"]             = NumerosALetrasService.DpiALetras(dpiArr);
        marcadores["dpi_numeros"]               = dpiArr;
        marcadores["numero_dpi_en_letras"]      = NumerosALetrasService.DpiALetras(dpiArr);
        marcadores["dpi_arrendatario_en_letras"] = NumerosALetrasService.DpiALetras(dpiArr); // alias: nombre usado en la plantilla nueva
    }

    // Edad del arrendatario en letras
    if (marcadores.TryGetValue("edad_arrendatario", out var edadStr) && long.TryParse(edadStr, out var edadN))
        marcadores["edad_letras"] = NumerosALetrasService.NumeroALetras(edadN);

    // Número de oficina en letras
    if (marcadores.TryGetValue("numero_oficina", out var numOf))
        marcadores["numero_oficina_en_letras"] = numOf;

    // Número de local
    if (marcadores.TryGetValue("numero_locales", out var numLoc))
        marcadores["numero_locales"] = numLoc;

    // Alias de dirección con acento
    if (marcadores.TryGetValue("direccion_arrendatario", out var dirArr))
        marcadores["dirección_arrendatario"] = dirArr;

    if (marcadores.TryGetValue("direccion_fiador", out var dirFia))
        marcadores["dirección_fiador"] = dirFia;

    // ── Alias por errores de tipeo del área legal en la plantilla ──
    // Se agregan como aliases (en vez de corregir solo la plantilla) para que el
    // documento no quede en blanco aunque la plantilla no se corrija de inmediato.
    if (marcadores.TryGetValue("destino_local", out var destinoLocal))
        marcadores["distino_local"] = destinoLocal; // typo: "distino_local" en la plantilla

    if (marcadores.TryGetValue("profesion_arrendatario", out var profArr))
        marcadores["profesión_arrendatario"] = profArr; // typo: con tilde en la plantilla

    if (marcadores.TryGetValue("profesion_fiador", out var profFia))
        marcadores["profesión_fiador"] = profFia; // typo: con tilde en la plantilla

    // Partes involucradas
    foreach (var parte in partes)
    {
        var prefijo = parte.RolParte?.ToLower()
            .Replace(" ", "_")
            .Replace("á","a").Replace("é","e").Replace("í","i")
            .Replace("ó","o").Replace("ú","u") ?? "parte";

        marcadores[$"{prefijo}_nombre"] = parte.Nombre ?? "";
        marcadores[$"{prefijo}_dpi"]    = parte.IdentificacionNumero ?? "";

        if (!string.IsNullOrEmpty(parte.IdentificacionNumero))
        {
            marcadores[$"{prefijo}_dpi_en_letras"] = NumerosALetrasService.DpiALetras(parte.IdentificacionNumero);
            marcadores[$"{prefijo}_dpi_numeros"]   = parte.IdentificacionNumero;
        }

        if (parte.RolParte?.ToLower().Contains("fiador") == true ||
            parte.RolParte?.ToLower().Contains("fiadora") == true)
        {
            marcadores["nombre_fiador"] = parte.Nombre ?? "";
            marcadores["nombre_fiadro"] = parte.Nombre ?? "";
        }
    }

    if (solicitud.Proyecto != null)
        marcadores["proyecto"] = solicitud.Proyecto.Nombre;
    if (solicitud.Empresa != null)
        marcadores["empresa"] = solicitud.Empresa.NombreLegal;

    // Cargar sociedad arrendante
    Sociedad? sociedad = null;
    if (!string.IsNullOrEmpty(datosSolicitud?.DatosJson))
    {
        var jsonDoc = System.Text.Json.JsonDocument.Parse(datosSolicitud.DatosJson);
        if (jsonDoc.RootElement.TryGetProperty("sociedad_id", out var sidEl) &&
            int.TryParse(sidEl.GetString(), out int sid))
        {
            sociedad = await _context.Sociedades.FindAsync(sid);
        }
    }

    // Datos de la sociedad arrendante
    if (sociedad != null)
    {
        marcadores["nombre_razon_social"]         = sociedad.NombreSociedad;
        marcadores["nombre_representante_legal"]  = sociedad.NombreRepresentante;
        marcadores["cargo_representante_legal"]   = sociedad.Cargo;
        marcadores["nombre_Notario"]              = sociedad.NombreNotario  ?? "___________";
        marcadores["acta_fecha"]                  = sociedad.ActaFecha      ?? "___________";
        marcadores["acta_notario"]                = sociedad.ActaNotario    ?? "___________";
        marcadores["registro_letras"]             = !string.IsNullOrEmpty(sociedad.RegistroNumero)
                                                    ? NumerosALetrasService.RegistroALetras(sociedad.RegistroNumero)
                                                    : "___________";
        // Folio/Libro del Registro Mercantil de la sociedad — con clave propia para no chocar
        // con folio_en_letras / libro_en_letras de la finca (ver bloque de arriba).
        marcadores["folio_registro_mercantil_en_letras"] = !string.IsNullOrEmpty(sociedad.RegistroFolio)
                                                    ? NumerosALetrasService.RegistroALetras(sociedad.RegistroFolio)
                                                    : "___________";
        marcadores["libro_registro_mercantil_en_letras"] = !string.IsNullOrEmpty(sociedad.RegistroLibro)
                                                    ? NumerosALetrasService.RegistroALetras(sociedad.RegistroLibro)
                                                    : "___________";
        marcadores["dpi_representante_en_letras"] = NumerosALetrasService.DpiALetras(sociedad.Dpi);
        marcadores["dpi_represenante_legal_en_letras"] = NumerosALetrasService.DpiALetras(sociedad.Dpi); // alias typo plantilla
        marcadores["nombre_reazon_social"]        = sociedad.NombreSociedad; // alias typo plantilla
        marcadores["profesion_representante"]     = sociedad.Profesion;
        marcadores["estado_civil_representante"]  = sociedad.EstadoCivil ?? "___________";

        // Datos bancarios de la sociedad arrendante
        marcadores["banco_razon_social"]          = sociedad.Banco ?? "___________";
        marcadores["numero_de_cuenta_en_letras"]  = !string.IsNullOrEmpty(sociedad.NumeroCuenta)
                                                    ? NumerosALetrasService.RegistroALetras(sociedad.NumeroCuenta)
                                                    : "___________";

        // Edad del representante calculada dinámicamente
        var hoy  = DateTime.UtcNow.AddHours(-6);
        var edad = hoy.Year - sociedad.FechaNacimiento.Year;
        if (sociedad.FechaNacimiento.Date > hoy.AddYears(-edad)) edad--;
        marcadores["edad_representante"]           = edad.ToString();
        marcadores["edad_representante_en_letras"] = $"{NumerosALetrasService.NumeroALetras(edad)} ({edad})";
    }

    // ── FIADOR (bloque condicional) ──────────────────────────────
    if (marcadores.TryGetValue("nombre_fiador", out var nombreFiador) && !string.IsNullOrEmpty(nombreFiador))
    {
        // Activa el bloque {{#fiador}}...{{/fiador}}
        marcadores["fiador"] = nombreFiador;

        if (marcadores.TryGetValue("dpi_fiador", out var dpiFiador) && !string.IsNullOrEmpty(dpiFiador))
        {
            marcadores["dpi_fiador_en_letras"] = NumerosALetrasService.DpiALetras(dpiFiador);
            marcadores["dpi_fiador_numeros"]   = dpiFiador;
        }

        if (marcadores.TryGetValue("edad_fiador", out var edadFiadorStr) && long.TryParse(edadFiadorStr, out var edadFiadorN))
            marcadores["edad_fiador_en_letras"] = NumerosALetrasService.NumeroALetras(edadFiadorN);
    }
    else
    {
        // Sin fiador — elimina el bloque condicional
        marcadores["fiador"] = "";
    }
    // ────────────────────────────────────────────────────────────

    // 2 — Copiar plantilla
    var carpetaDestino = Path.Combine(_env.ContentRootPath, "uploads", "solicitudes", solicitud.Codigo);
    Directory.CreateDirectory(carpetaDestino);

    var nombreArchivo = $"Borrador - {solicitud.TipoSolicitud?.Nombre}.docx";
    var rutaDestino   = Path.Combine(carpetaDestino, nombreArchivo);
    System.IO.File.Copy(rutaPlantilla, rutaDestino, overwrite: true);

    // 3 — Procesar documento (limpiar + reemplazar)
    ProcesarDocumento(rutaDestino, marcadores);

    // 4 — Registrar en BD
    var rutaRelativa = Path.Combine("solicitudes", solicitud.Codigo, nombreArchivo)
                           .Replace("\\", "/");

    var adjuntoAnterior = await _context.SolicitudAdjuntos
        .FirstOrDefaultAsync(a => a.SolicitudId == solicitudId && a.EsDocumentoGenerado);
    if (adjuntoAnterior != null)
        _context.SolicitudAdjuntos.Remove(adjuntoAnterior);

    _context.SolicitudAdjuntos.Add(new SolicitudAdjunto
    {
        SolicitudId         = solicitudId,
        NombreArchivo       = nombreArchivo,
        RutaArchivo         = rutaRelativa,
        MimeType            = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        EsDocumentoGenerado = true,
        Version             = 1,
        EstadoRevision      = "pendiente",
        SubidoPor           = usuarioId,
    });

    _context.SolicitudHistorial.Add(new SolicitudHistorial
    {
        SolicitudId = solicitudId,
        UsuarioId   = usuarioId,
        TipoEvento  = "documento_generado",
        Comentario  = $"Borrador generado automáticamente: {nombreArchivo}"
    });

    await _context.SaveChangesAsync();

    await _notificaciones.DocumentoGeneradoAsync(solicitudId, nombreArchivo);

    return Ok(new { mensaje = "Documento generado correctamente.", ruta = rutaRelativa, nombre = nombreArchivo });
}

    private static void ProcesarDocumento(string rutaDocx, Dictionary<string, string> marcadores)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
        Directory.CreateDirectory(tempDir);

        try
        {
            ZipFile.ExtractToDirectory(rutaDocx, tempDir);

            var documentXmlPath = Path.Combine(tempDir, "word", "document.xml");
            var xml = System.IO.File.ReadAllText(documentXmlPath);

            // Paso 1: unir runs fragmentados
            xml = UnirRunsConMarcadores(xml);

            // Paso 2: limpiar asteriscos
            xml = Regex.Replace(
                xml,
                @"\{\{(\*+)?([^{}]+?)(\*+)?\}\}",
                m => "{{" + m.Groups[2].Value.Replace("*", "").Trim() + "}}"
            );

            // Paso 3: limpiar espacios extra
            xml = Regex.Replace(
                xml,
                @"\{\{\s+([^}]+?)\s+\}\}",
                m => "{{" + m.Groups[1].Value.Trim() + "}}"
            );

            xml = ProcesarBloquesCondicionales(xml, marcadores);

            // Paso 4: reemplazar marcadores con valores
            foreach (var marcador in marcadores)
            {
                var clave = $"{{{{{marcador.Key}}}}}";
                var valor = string.IsNullOrEmpty(marcador.Value) ? "___________" : marcador.Value;
                var valorEscapado = valor
                    .Replace("&", "&amp;")
                    .Replace("<", "&lt;")
                    .Replace(">", "&gt;")
                    .Replace("\"", "&quot;");
                xml = xml.Replace(clave, valorEscapado);
            }

            System.IO.File.WriteAllText(documentXmlPath, xml);

            if (System.IO.File.Exists(rutaDocx)) System.IO.File.Delete(rutaDocx);
            ZipFile.CreateFromDirectory(tempDir, rutaDocx);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    private static string UnirRunsConMarcadores(string xml)
    {
        var resultado = xml;

        // Cruce obligatorio de un límite de run de Word (</w:t>...<w:t>), con
        // cualquier cosa que no sea otro <w:t> en medio (ej. <w:proofErr/>).
        const string cruceRun = @"</w:t>(?:(?!<w:t).)*<w:t[^>]*>";

        // IMPORTANTE: a diferencia de la versión anterior, aquí las llaves de
        // apertura "{{" y de cierre "}}" también pueden venir partidas en dos
        // runs distintos (Word a veces inserta un <w:proofErr/> justo entre el
        // primer "{" y el segundo "{"). La versión anterior solo sabía unir el
        // CONTENIDO entre un "{{" y un "}}" ya reconocidos como tales, pero no
        // reconocía un "{{"/"}}" partido en sí mismo — eso dejaba marcadores
        // como {{nombre_fiador}} sin reemplazar cuando Word los fragmentaba así,
        // y en el caso de {{#fiador}}/{{/fiador}} rompía el bloque condicional
        // completo (quedaba el texto literal "{{#fiador}}" en el documento).
        var patron = new Regex(
            @"\{(?:" + cruceRun + @")?\{" +
            @"((?:[^{}]|" + cruceRun + @")*?)" +
            @"\}(?:" + cruceRun + @")?\}",
            RegexOptions.Singleline
        );

        resultado = patron.Replace(resultado, m => {
            var contenido = Regex.Replace(m.Groups[1].Value, @"<[^>]+>", "");
            contenido = contenido.Replace("*", "").Trim();
            if (string.IsNullOrEmpty(contenido)) return m.Value;
            return "{{" + contenido + "}}";
        });

        resultado = Regex.Replace(
            resultado,
            @"<w:t[^>]*>\{\{([^}]+)\}\}</w:t>",
            m => $"<w:t>{{{{ {m.Groups[1].Value.Trim()} }}}}</w:t>"
        );

        return resultado;
    }

    // Documento base único (con bloques condicionales) que reemplaza a las tres
    // plantillas separadas que existían antes. Las anteriores quedaron archivadas
    // en backend/plantillas/Anteriores/ como referencia.
    //
    // Kiosko y Oficina TODAVIA NO se enrutan a este documento base: su contenido
    // legal (ej. "los locales comerciales") es específico de Local Comercial, y
    // generar un contrato de Kiosko/Oficina con ese texto produciría un documento
    // legalmente incorrecto. Quedan pendientes hasta que el área legal entregue
    // sus variantes y se incorporen como nuevos bloques condicionales al mismo
    // documento base (ver tarea "Implementación y pruebas de generación con
    // documento base único").
    private static string? ObtenerNombrePlantilla(string? tipoNombre) => tipoNombre switch
    {
        "Arrendamiento - Local Comercial" => "CONTRATO_ARRENDAMIENTO_BASE.docx",
        "Arrendamiento - Kiosko"          => null, // pendiente: plantilla del área legal
        "Arrendamiento - Oficina"         => null, // pendiente: plantilla del área legal
        _ => null
    };

    private static string ProcesarBloquesCondicionales(string xml, Dictionary<string, string> marcadores)
{
    // Busca {{#clave}}...{{/clave}} y elimina el bloque si la clave está vacía
    var patron = new Regex(
        @"\{\{#(\w+)\}\}(.*?)\{\{/\1\}\}",
        RegexOptions.Singleline
    );

    return patron.Replace(xml, m => {
        var clave  = m.Groups[1].Value;
        var bloque = m.Groups[2].Value;

        // Si la clave tiene valor en el diccionario, conservar el bloque (sin los marcadores de apertura/cierre)
        if (marcadores.TryGetValue(clave, out var valor) && !string.IsNullOrWhiteSpace(valor))
            return bloque;

        // Si no tiene valor, eliminar el bloque completo
        return string.Empty;
    });
}
}