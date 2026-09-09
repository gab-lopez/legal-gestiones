using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ArchivosController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly AppDbContext _context;
    private readonly INotificacionesService _notificaciones;

    public ArchivosController(IWebHostEnvironment env, AppDbContext context, INotificacionesService notificaciones)
    {
        _env            = env;
        _context        = context;
        _notificaciones = notificaciones;
    }

    [HttpPost("subir")]
    public async Task<IActionResult> Subir(
        [FromForm] string codigoSolicitud,
        [FromForm] string nombreParte,
        [FromForm] string nombreDocumento,
        [FromForm] int solicitudId,
        [FromForm] int subidoPor,
        IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { mensaje = "No se recibió ningún archivo." });

        var extensionesPermitidas = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(archivo.FileName).ToLower();
        if (!extensionesPermitidas.Contains(extension))
            return BadRequest(new { mensaje = "Tipo de archivo no permitido." });

        if (archivo.Length > 10 * 1024 * 1024)
            return BadRequest(new { mensaje = "El archivo supera el límite de 10MB." });

        var nombreParteSeguro     = SanitizarNombre(nombreParte);
        var nombreDocumentoSeguro = SanitizarNombre(nombreDocumento);

        var carpeta = Path.Combine(_env.ContentRootPath, "uploads", "solicitudes", codigoSolicitud, nombreParteSeguro);
        Directory.CreateDirectory(carpeta);

        var nombreArchivo = $"{nombreDocumentoSeguro}{extension}";
        var rutaCompleta  = Path.Combine(carpeta, nombreArchivo);

        using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            await archivo.CopyToAsync(stream);

        var rutaRelativa = Path.Combine("solicitudes", codigoSolicitud, nombreParteSeguro, nombreArchivo)
                               .Replace("\\", "/");

        var adjunto = new SolicitudAdjunto
        {
            SolicitudId         = solicitudId,
            NombreArchivo       = nombreDocumento,
            RutaArchivo         = rutaRelativa,
            MimeType            = archivo.ContentType,
            EsDocumentoGenerado = false,
            Version             = 1,
            EstadoRevision      = "pendiente",
            SubidoPor           = subidoPor,
        };

        _context.SolicitudAdjuntos.Add(adjunto);
        await _context.SaveChangesAsync();

        return Ok(new { ruta = rutaRelativa, nombre = nombreArchivo, adjuntoId = adjunto.Id });
    }

    // Documento final ya firmado (subido por el gestor legal/administrador),
    // distinto del borrador que arma DocumentosController.Generar. Se guarda
    // versionado (no se borra el anterior) para conservar el historial de
    // firmas si se vuelve a subir una corrección.
    [HttpPost("subir-firmado")]
    public async Task<IActionResult> SubirDocumentoFirmado(
        [FromForm] int solicitudId,
        [FromForm] int subidoPor,
        IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { mensaje = "No se recibió ningún archivo." });

        var extensionesPermitidas = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(archivo.FileName).ToLower();
        if (!extensionesPermitidas.Contains(extension))
            return BadRequest(new { mensaje = "Tipo de archivo no permitido. Usa PDF, JPG o PNG." });

        if (archivo.Length > 10 * 1024 * 1024)
            return BadRequest(new { mensaje = "El archivo supera el límite de 10MB." });

        var solicitud = await _context.Solicitudes.FindAsync(solicitudId);
        if (solicitud == null)
            return NotFound(new { mensaje = "Solicitud no encontrada." });

        var carpeta = Path.Combine(_env.ContentRootPath, "uploads", "solicitudes", solicitud.Codigo, "documento_firmado");
        Directory.CreateDirectory(carpeta);

        var versionAnterior = await _context.SolicitudAdjuntos
            .Where(a => a.SolicitudId == solicitudId && a.EsDocumentoFirmado)
            .Select(a => (int?)a.Version)
            .MaxAsync();
        var version = (versionAnterior ?? 0) + 1;

        var nombreArchivo = $"Documento firmado v{version}{extension}";
        var rutaDestino   = Path.Combine(carpeta, nombreArchivo);

        using (var stream = new FileStream(rutaDestino, FileMode.Create))
            await archivo.CopyToAsync(stream);

        var rutaRelativa = Path.Combine("solicitudes", solicitud.Codigo, "documento_firmado", nombreArchivo)
                               .Replace("\\", "/");

        var nombreParaMostrar = $"Documento firmado (v{version})";

        var adjunto = new SolicitudAdjunto
        {
            SolicitudId         = solicitudId,
            NombreArchivo       = nombreParaMostrar,
            RutaArchivo         = rutaRelativa,
            MimeType            = archivo.ContentType,
            EsDocumentoGenerado = false,
            EsDocumentoFirmado  = true,
            Version             = version,
            EstadoRevision      = "firmado",
            SubidoPor           = subidoPor,
        };
        _context.SolicitudAdjuntos.Add(adjunto);

        _context.SolicitudHistorial.Add(new SolicitudHistorial
        {
            SolicitudId = solicitudId,
            UsuarioId   = subidoPor,
            TipoEvento  = "documento_firmado",
            Comentario  = $"Se subió el documento firmado (v{version})."
        });

        await _context.SaveChangesAsync();

        await _notificaciones.DocumentoFirmadoAsync(solicitudId, nombreParaMostrar);

        return Ok(new { ruta = rutaRelativa, nombre = nombreParaMostrar, adjuntoId = adjunto.Id, version });
    }

    [HttpGet("descargar")]
    public IActionResult Descargar([FromQuery] string ruta)
    {
        var rutaCompleta = Path.Combine(_env.ContentRootPath, "uploads", ruta);

        if (!System.IO.File.Exists(rutaCompleta))
            return NotFound(new { mensaje = "Archivo no encontrado." });

        var extension   = Path.GetExtension(rutaCompleta).ToLower();
        var contentType = extension switch {
            ".pdf"            => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            _                 => "application/octet-stream"
        };

        var bytes = System.IO.File.ReadAllBytes(rutaCompleta);
        return File(bytes, contentType, Path.GetFileName(rutaCompleta));
    }

    [HttpGet("preview")]
    public IActionResult Preview([FromQuery] string ruta)
    {
        var rutaCompleta = Path.Combine(_env.ContentRootPath, "uploads", ruta);

        if (!System.IO.File.Exists(rutaCompleta))
            return NotFound(new { mensaje = "Archivo no encontrado." });

        var extension   = Path.GetExtension(rutaCompleta).ToLower();
        var contentType = extension switch {
            ".pdf"            => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            _                 => "application/octet-stream"
        };

        var bytes = System.IO.File.ReadAllBytes(rutaCompleta);
        Response.Headers["Content-Disposition"] = $"inline; filename=\"{Path.GetFileName(rutaCompleta)}\"";
        return File(bytes, contentType);
    }

    private static string SanitizarNombre(string nombre)
    {
        var invalidos = Path.GetInvalidFileNameChars();
        return string.Concat(nombre.Split(invalidos)).Replace(" ", "_").ToLower();
    }
}