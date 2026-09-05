using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Services;

public class NotificacionesService : INotificacionesService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _email;
    private readonly ILogger<NotificacionesService> _logger;

    public NotificacionesService(AppDbContext context, IEmailService email, ILogger<NotificacionesService> logger)
    {
        _context = context;
        _email   = email;
        _logger  = logger;
    }

    public async Task SolicitudCreadaAsync(int solicitudId)
    {
        var s = await CargarConSolicitanteAsync(solicitudId);
        if (s?.Solicitante == null) return;

        var asunto = $"Recibimos tu solicitud {s.Codigo}";
        var cuerpo = Plantilla(
            $"Hola {s.Solicitante.Nombres},",
            $"Recibimos tu solicitud <strong>{s.Codigo}</strong> ({s.TipoSolicitud?.Nombre}) y ya está en la fila de revisión.",
            "Te avisaremos por correo en cuanto haya novedades."
        );

        await _email.EnviarAsync(s.Solicitante.Correo, asunto, cuerpo);
    }

    public async Task CambioEstadoAsync(int solicitudId, string estadoAnteriorNombre)
    {
        var s = await CargarConSolicitanteAsync(solicitudId);
        if (s?.Solicitante == null) return;

        var asunto = $"Tu solicitud {s.Codigo} cambió de estado";
        var cuerpo = Plantilla(
            $"Hola {s.Solicitante.Nombres},",
            $"Tu solicitud <strong>{s.Codigo}</strong> ({s.TipoSolicitud?.Nombre}) pasó de <strong>{estadoAnteriorNombre}</strong> a <strong>{s.Estado?.Nombre}</strong>.",
            null
        );

        await _email.EnviarAsync(s.Solicitante.Correo, asunto, cuerpo);
    }

    public async Task PendienteCorreccionAsync(int solicitudId)
    {
        var s = await CargarConSolicitanteAsync(solicitudId);
        if (s?.Solicitante == null) return;

        var camposHtml = "";
        var ultimaCorreccion = await _context.SolicitudHistorial
            .Where(h => h.SolicitudId == solicitudId && h.TipoEvento == "solicitud_correccion")
            .OrderByDescending(h => h.CreatedAt)
            .FirstOrDefaultAsync();

        if (ultimaCorreccion?.ValorNuevo != null)
        {
            try
            {
                var campos = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(ultimaCorreccion.ValorNuevo)
                             ?? new Dictionary<string, string>();
                if (campos.Count > 0)
                    camposHtml = "<ul>" + string.Join("", campos.Select(c => $"<li><strong>{c.Key}:</strong> {c.Value}</li>")) + "</ul>";
            }
            catch (System.Text.Json.JsonException) { /* historial de un formato anterior, se omite el detalle */ }
        }

        var asunto = $"Tu solicitud {s.Codigo} necesita correcciones";
        var cuerpo = Plantilla(
            $"Hola {s.Solicitante.Nombres},",
            $"El gestor legal marcó algunos datos de tu solicitud <strong>{s.Codigo}</strong> que necesitan corrección" +
            (string.IsNullOrWhiteSpace(s.MotivoBloqueo) ? "." : $": {s.MotivoBloqueo}"),
            (camposHtml.Length > 0 ? camposHtml + "Entra a \"Mis solicitudes\" para corregirlos y reenviarlos." : "Entra a \"Mis solicitudes\" para corregirlos y reenviarlos.")
        );

        await _email.EnviarAsync(s.Solicitante.Correo, asunto, cuerpo);
    }

    public async Task DocumentoGeneradoAsync(int solicitudId, string nombreArchivo)
    {
        var s = await CargarConSolicitanteAsync(solicitudId);
        if (s == null) return;

        var asunto = $"Documento generado para tu solicitud {s.Codigo}";
        var cuerpo = Plantilla(
            s.Solicitante != null ? $"Hola {s.Solicitante.Nombres}," : "Hola,",
            $"Se generó el borrador del documento (<strong>{nombreArchivo}</strong>) para la solicitud <strong>{s.Codigo}</strong>.",
            "Puedes revisarlo desde el detalle de la solicitud."
        );

        if (s.Solicitante != null)
            await _email.EnviarAsync(s.Solicitante.Correo, asunto, cuerpo);

        if (s.Responsable != null)
            await _email.EnviarAsync(s.Responsable.Correo, asunto, cuerpo);
    }

    public async Task AlertaSlaProximaAsync(int solicitudId)
    {
        var s = await CargarConSolicitanteAsync(solicitudId);
        if (s == null) return;

        var asunto = $"SLA por vencer: solicitud {s.Codigo}";
        var cuerpo = Plantilla(
            "Hola,",
            $"La solicitud <strong>{s.Codigo}</strong> ({s.TipoSolicitud?.Nombre}, solicitante: {s.Solicitante?.Nombres} {s.Solicitante?.Apellidos}) " +
            $"está por vencer su SLA (límite: {s.FechaLimiteSla:dd/MM/yyyy HH:mm}).",
            "Revísala antes de que venza."
        );

        await EnviarAResponsableOAdminsAsync(s.ResponsableId, asunto, cuerpo);
    }

    public async Task SlaVencidoAsync(int solicitudId)
    {
        var s = await CargarConSolicitanteAsync(solicitudId);
        if (s == null) return;

        var asunto = $"SLA vencido: solicitud {s.Codigo}";
        var cuerpo = Plantilla(
            "Hola,",
            $"La solicitud <strong>{s.Codigo}</strong> ({s.TipoSolicitud?.Nombre}, solicitante: {s.Solicitante?.Nombres} {s.Solicitante?.Apellidos}) " +
            $"ya venció su SLA (límite: {s.FechaLimiteSla:dd/MM/yyyy HH:mm}) y sigue sin cerrarse.",
            "Necesita atención prioritaria."
        );

        await EnviarAResponsableOAdminsAsync(s.ResponsableId, asunto, cuerpo);
    }

    // -- helpers -------------------------------------------------------

    private Task<Solicitud?> CargarConSolicitanteAsync(int solicitudId) =>
        _context.Solicitudes
            .Include(s => s.Solicitante)
            .Include(s => s.Responsable)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Estado)
            .FirstOrDefaultAsync(s => s.Id == solicitudId);

    private async Task EnviarAResponsableOAdminsAsync(int? responsableId, string asunto, string cuerpo)
    {
        if (responsableId.HasValue)
        {
            var responsable = await _context.Usuarios.FindAsync(responsableId.Value);
            if (responsable != null)
            {
                await _email.EnviarAsync(responsable.Correo, asunto, cuerpo);
                return;
            }
        }

        // Sin responsable asignado todavia: avisar a los administradores para
        // que nadie se quede sin enterarse de un SLA en riesgo.
        var admins = await _context.Usuarios
            .Where(u => u.RolId == 1 && u.Activo)
            .ToListAsync();

        foreach (var admin in admins)
            await _email.EnviarAsync(admin.Correo, asunto, cuerpo);

        if (admins.Count == 0)
            _logger.LogWarning("No hay administrador activo a quien avisar del SLA (asunto: {Asunto}).", asunto);
    }

    private static string Plantilla(string saludo, string cuerpoPrincipal, string? notaFinal)
    {
        return $@"
            <div style=""font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.5;"">
                <p>{saludo}</p>
                <p>{cuerpoPrincipal}</p>
                {(notaFinal != null ? $"<p>{notaFinal}</p>" : "")}
                <p style=""color:#6b7280;font-size:12px;margin-top:24px;"">
                    Legal Gestiones · RV4 — este es un correo automático, no respondas a este mensaje.
                </p>
            </div>";
    }
}
