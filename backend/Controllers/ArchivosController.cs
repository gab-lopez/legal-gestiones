using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ArchivosController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly AppDbContext _context;

    public ArchivosController(IWebHostEnvironment env, AppDbContext context)
    {
        _env     = env;
        _context = context;
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