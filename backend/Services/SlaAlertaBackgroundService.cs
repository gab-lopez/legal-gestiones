using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Services;

// Job en segundo plano que revisa periodicamente las solicitudes abiertas
// (fecha_cierre == null) y dispara:
//   - AlertaSlaProximaAsync cuando ya se paso fecha_limite_alerta pero
//     todavia no fecha_limite_sla.
//   - SlaVencidoAsync cuando ya se paso fecha_limite_sla.
// Cada aviso se manda una sola vez gracias a los flags alerta_sla_enviada /
// sla_vencido_notificado (ver Models/Solicitud.cs y
// Querys/ALTER_solicitudes_sla_flags.sql).
//
// Intervalo configurable via "Sla:IntervaloChequeoMinutos" en appsettings
// (default: 60 minutos).
public class SlaAlertaBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<SlaAlertaBackgroundService> _logger;

    public SlaAlertaBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<SlaAlertaBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _config       = config;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalo = TimeSpan.FromMinutes(_config.GetValue("Sla:IntervaloChequeoMinutos", 60));
        _logger.LogInformation("SlaAlertaBackgroundService iniciado (intervalo: {Intervalo}).", intervalo);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RevisarSlaAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revisando SLAs de solicitudes.");
            }

            try { await Task.Delay(intervalo, stoppingToken); }
            catch (TaskCanceledException) { /* apagado normal del servicio */ }
        }
    }

    private async Task RevisarSlaAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context         = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notificaciones  = scope.ServiceProvider.GetRequiredService<INotificacionesService>();

        var ahora = DateTime.UtcNow;

        var proximasAVencer = await context.Solicitudes
            .Where(s => s.FechaCierre == null
                     && !s.AlertaSlaEnviada
                     && s.FechaLimiteAlerta != null && s.FechaLimiteAlerta <= ahora
                     && s.FechaLimiteSla != null && s.FechaLimiteSla > ahora)
            .ToListAsync(ct);

        foreach (var s in proximasAVencer)
        {
            await notificaciones.AlertaSlaProximaAsync(s.Id);
            s.AlertaSlaEnviada = true;
        }

        var vencidas = await context.Solicitudes
            .Where(s => s.FechaCierre == null
                     && !s.SlaVencidoNotificado
                     && s.FechaLimiteSla != null && s.FechaLimiteSla <= ahora)
            .ToListAsync(ct);

        foreach (var s in vencidas)
        {
            await notificaciones.SlaVencidoAsync(s.Id);
            s.SlaVencidoNotificado = true;
        }

        if (proximasAVencer.Count > 0 || vencidas.Count > 0)
        {
            await context.SaveChangesAsync(ct);
            _logger.LogInformation(
                "Revision de SLA: {Proximas} alerta(s) de proximidad, {Vencidas} vencimiento(s) notificado(s).",
                proximasAVencer.Count, vencidas.Count);
        }
    }
}
