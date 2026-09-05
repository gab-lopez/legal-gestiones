using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SolicitudesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly INotificacionesService _notificaciones;

    public SolicitudesController(AppDbContext context, INotificacionesService notificaciones)
    {
        _context        = context;
        _notificaciones = notificaciones;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? estadoId, [FromQuery] int? solicitanteId)
    {
        var query = _context.Solicitudes
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Estado)
            .Include(s => s.Solicitante)
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .AsQueryable();

        if (estadoId.HasValue)
            query = query.Where(s => s.EstadoId == estadoId.Value);

        if (solicitanteId.HasValue)
            query = query.Where(s => s.SolicitanteId == solicitanteId.Value);

        var solicitudes = await query
            .OrderByDescending(s => s.FechaSolicitud)
            .Select(s => new {
                s.Id,
                s.Codigo,
                s.FechaSolicitud,
                s.FechaLimiteSla,
                s.FechaLimiteAlerta,
                s.BloqueadaPorInfo,
                TipoSolicitud = s.TipoSolicitud!.Nombre,
                Estado        = s.Estado!.Nombre,
                Solicitante   = s.Solicitante!.Nombres + " " + s.Solicitante.Apellidos,
                Proyecto      = s.Proyecto != null ? s.Proyecto.Nombre : null,
                Empresa       = s.Empresa != null ? s.Empresa.NombreLegal : null,
                SemaforoSla   = s.FechaCierre != null ? "completada"
                              : s.FechaLimiteSla < DateTime.UtcNow ? "vencida"
                              : s.FechaLimiteAlerta < DateTime.UtcNow ? "alerta"
                              : "ok"
            })
            .ToListAsync();

        return Ok(solicitudes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Estado)
            .Include(s => s.Solicitante)
            .Include(s => s.Responsable)
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (solicitud == null) return NotFound();

        var datos = await _context.SolicitudDatos.FindAsync(id);
        var partes = await _context.SolicitudPartes.Where(p => p.SolicitudId == id).ToListAsync();
        var adjuntos = await _context.SolicitudAdjuntos.Where(a => a.SolicitudId == id).ToListAsync();

        return Ok(new { solicitud, datos, partes, adjuntos });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CrearSolicitudDto dto)
    {
        var tipo = await _context.TiposSolicitud.FindAsync(dto.TipoSolicitudId);
        if (tipo == null) return BadRequest(new { mensaje = "Tipo de solicitud no válido." });

        var estadoInicial = await _context.EstadosSolicitud
            .OrderBy(e => e.OrdenFlujo)
            .FirstOrDefaultAsync(e => e.Activo);

        var ahora = DateTime.UtcNow;
        var totalSolicitudes = await _context.Solicitudes.CountAsync() + 1;
        var codigo = $"SOL-{ahora:yyyy}-{totalSolicitudes:D4}";

        var solicitud = new Solicitud
        {
            Codigo           = codigo,
            TipoSolicitudId  = dto.TipoSolicitudId,
            EstadoId         = estadoInicial!.Id,
            SolicitanteId    = dto.SolicitanteId,
            ProyectoId       = dto.ProyectoId,
            EmpresaId        = dto.EmpresaId,
            Descripcion      = dto.Descripcion,
            FechaSolicitud   = ahora,
            FechaLimiteSla   = ahora.AddHours(tipo.HorasResolucion),
            FechaLimiteAlerta = ahora.AddHours(tipo.HorasResolucion - tipo.HorasAlertaPrevia)
        };

        _context.Solicitudes.Add(solicitud);
        await _context.SaveChangesAsync();

        // Guardar datos del formulario
        _context.SolicitudDatos.Add(new SolicitudDatos
        {
            SolicitudId = solicitud.Id,
            DatosJson   = dto.DatosJson ?? "{}"
        });

        // Guardar partes si vienen
        if (dto.Partes != null)
            foreach (var parte in dto.Partes)
            {
                parte.SolicitudId = solicitud.Id;
                _context.SolicitudPartes.Add(parte);
            }

        // Registrar en historial
        _context.SolicitudHistorial.Add(new SolicitudHistorial
        {
            SolicitudId = solicitud.Id,
            UsuarioId   = dto.SolicitanteId,
            TipoEvento  = "creacion",
            Comentario  = "Solicitud creada"
        });

        await _context.SaveChangesAsync();

        await _notificaciones.SolicitudCreadaAsync(solicitud.Id);

        return CreatedAtAction(nameof(GetById), new { id = solicitud.Id },
            new { solicitud.Id, solicitud.Codigo });
    }

    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, CambiarEstadoDto dto)
    {
        var solicitud = await _context.Solicitudes.FindAsync(id);
        if (solicitud == null) return NotFound();

        var estadoAnteriorId     = solicitud.EstadoId;
        var estadoAnteriorNombre = (await _context.EstadosSolicitud.FindAsync(estadoAnteriorId))?.Nombre ?? "desconocido";
        var estadoAnterior       = estadoAnteriorId.ToString();
        solicitud.EstadoId  = dto.EstadoId;
        solicitud.UpdatedAt = DateTime.UtcNow;

        if (dto.Bloqueada.HasValue)
        {
            solicitud.BloqueadaPorInfo = dto.Bloqueada.Value;
            solicitud.MotivoBloqueo    = dto.MotivoBloqueo;
        }

        var nuevoEstado = await _context.EstadosSolicitud.FindAsync(dto.EstadoId);
        if (nuevoEstado?.EsFinal == true)
            solicitud.FechaCierre = DateTime.UtcNow;

        _context.SolicitudHistorial.Add(new SolicitudHistorial
        {
            SolicitudId    = id,
            UsuarioId      = dto.UsuarioId,
            TipoEvento     = "cambio_estado",
            CampoCambiado  = "estado_id",
            ValorAnterior  = estadoAnterior,
            ValorNuevo     = dto.EstadoId.ToString(),
            Comentario     = dto.Comentario
        });

        await _context.SaveChangesAsync();

        if (estadoAnteriorId != dto.EstadoId)
            await _notificaciones.CambioEstadoAsync(id, estadoAnteriorNombre);

        return NoContent();
    }

    [HttpGet("{id}/historial")]
    public async Task<IActionResult> GetHistorial(int id)
    {
        var historial = await _context.SolicitudHistorial
            .Where(h => h.SolicitudId == id)
            .Include(h => h.Usuario)
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new {
                h.Id,
                h.TipoEvento,
                h.CampoCambiado,
                h.ValorAnterior,
                h.ValorNuevo,
                h.Comentario,
                h.CreatedAt,
                Usuario = h.Usuario!.Nombres + " " + h.Usuario.Apellidos
            })
            .ToListAsync();

        return Ok(historial);
    }

    [HttpPut("{id}/datos")]
public async Task<IActionResult> ActualizarDatos(int id, [FromBody] ActualizarDatosDto dto)
{
    var datos = await _context.SolicitudDatos.FindAsync(id);
    if (datos == null) return NotFound();

    datos.DatosJson  = dto.DatosJson;
    datos.Version    += 1;
    datos.UpdatedAt  = DateTime.UtcNow;

    _context.SolicitudHistorial.Add(new SolicitudHistorial
    {
        SolicitudId   = id,
        UsuarioId     = dto.UsuarioId,
        TipoEvento    = "edicion_datos",
        Comentario    = "Gestor legal actualizó datos del formulario"
    });

    await _context.SaveChangesAsync();
    return NoContent();
}

[HttpPut("{id}/observaciones")]
public async Task<IActionResult> GuardarObservaciones(int id, [FromBody] ObservacionesDto dto)
{
    var solicitud = await _context.Solicitudes.FindAsync(id);
    if (solicitud == null) return NotFound();

    // Guardar observaciones en el historial
    _context.SolicitudHistorial.Add(new SolicitudHistorial
    {
        SolicitudId   = id,
        UsuarioId     = dto.UsuarioId,
        TipoEvento    = "solicitud_correccion",
        CampoCambiado = string.Join(",", dto.CamposConObservacion.Keys),
        ValorNuevo    = System.Text.Json.JsonSerializer.Serialize(dto.CamposConObservacion),
        Comentario    = dto.MensajeGeneral
    });

    // Cambiar estado a "Pendiente de info"
    solicitud.EstadoId         = 3;
    solicitud.BloqueadaPorInfo = true;
    solicitud.MotivoBloqueo    = dto.MensajeGeneral;
    solicitud.UpdatedAt        = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    await _notificaciones.PendienteCorreccionAsync(id);

    return NoContent();
}

// Bandeja de correcciones del solicitante: qué campos marcó el gestor y por qué.
// Se basa en el último evento "solicitud_correccion" del historial (el mismo que
// guarda GuardarObservaciones). Si la solicitud no está bloqueada por info, no
// hay nada pendiente que corregir.
[HttpGet("{id}/observaciones-pendientes")]
public async Task<IActionResult> GetObservacionesPendientes(int id)
{
    var solicitud = await _context.Solicitudes.FindAsync(id);
    if (solicitud == null) return NotFound();

    if (!solicitud.BloqueadaPorInfo)
        return Ok(new { bloqueada = false, camposConObservacion = new Dictionary<string, string>(), mensajeGeneral = (string?)null });

    var ultimaCorreccion = await _context.SolicitudHistorial
        .Where(h => h.SolicitudId == id && h.TipoEvento == "solicitud_correccion")
        .OrderByDescending(h => h.CreatedAt)
        .FirstOrDefaultAsync();

    var campos = new Dictionary<string, string>();
    if (ultimaCorreccion?.ValorNuevo != null)
    {
        try
        {
            campos = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(ultimaCorreccion.ValorNuevo)
                     ?? new Dictionary<string, string>();
        }
        catch (System.Text.Json.JsonException)
        {
            // Historial corrupto o de un formato anterior — se responde vacío en vez de fallar.
        }
    }

    return Ok(new
    {
        bloqueada = true,
        camposConObservacion = campos,
        mensajeGeneral = solicitud.MotivoBloqueo
    });
}

// El solicitante reenvía los datos corregidos: actualiza datos_json, quita el
// bloqueo y regresa la solicitud a "En revisión" (2) para que el gestor la
// vuelva a evaluar.
[HttpPut("{id}/responder-correccion")]
public async Task<IActionResult> ResponderCorreccion(int id, [FromBody] ActualizarDatosDto dto)
{
    var solicitud = await _context.Solicitudes.FindAsync(id);
    if (solicitud == null) return NotFound();

    var datos = await _context.SolicitudDatos.FindAsync(id);
    if (datos == null) return NotFound();

    datos.DatosJson = dto.DatosJson;
    datos.Version   += 1;
    datos.UpdatedAt  = DateTime.UtcNow;

    solicitud.EstadoId         = 2; // En revisión
    solicitud.BloqueadaPorInfo = false;
    solicitud.MotivoBloqueo    = null;
    solicitud.UpdatedAt        = DateTime.UtcNow;

    _context.SolicitudHistorial.Add(new SolicitudHistorial
    {
        SolicitudId = id,
        UsuarioId   = dto.UsuarioId,
        TipoEvento  = "correccion_enviada",
        Comentario  = "El solicitante envió los datos corregidos."
    });

    await _context.SaveChangesAsync();
    return NoContent();
}

}

public record CrearSolicitudDto(
    int TipoSolicitudId,
    int SolicitanteId,
    int? ProyectoId,
    int? EmpresaId,
    string? Descripcion,
    string? DatosJson,
    List<SolicitudParte>? Partes);

public record CambiarEstadoDto(
    int EstadoId,
    int UsuarioId,
    string? Comentario,
    bool? Bloqueada,
    string? MotivoBloqueo);

    public record ActualizarDatosDto(string DatosJson, int UsuarioId);
public record ObservacionesDto(
    int UsuarioId,
    Dictionary<string, string> CamposConObservacion,
    string? MensajeGeneral);