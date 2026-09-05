using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("solicitudes")]
public class Solicitud
{
    [Key] public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;

    [Column("tipo_solicitud_id")]
    public int TipoSolicitudId { get; set; }

    [Column("estado_id")]
    public int EstadoId { get; set; }

    [Column("solicitante_id")]
    public int SolicitanteId { get; set; }

    [Column("responsable_id")]
    public int? ResponsableId { get; set; }

    [Column("proyecto_id")]
    public int? ProyectoId { get; set; }

    [Column("empresa_id")]
    public int? EmpresaId { get; set; }

    public string? Descripcion { get; set; }

    [Column("fecha_solicitud")]
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    [Column("fecha_limite_sla")]
    public DateTime? FechaLimiteSla { get; set; }

    [Column("fecha_limite_alerta")]
    public DateTime? FechaLimiteAlerta { get; set; }

    [Column("fecha_cierre")]
    public DateTime? FechaCierre { get; set; }

    [Column("bloqueada_por_info")]
    public bool BloqueadaPorInfo { get; set; } = false;

    [Column("motivo_bloqueo")]
    public string? MotivoBloqueo { get; set; }

    // Evitan que el SlaAlertaBackgroundService reenvie la misma alerta en
    // cada corrida. Se resetean solo si alguien vuelve a abrir la solicitud
    // (no hay flujo automatico para eso todavia).
    [Column("alerta_sla_enviada")]
    public bool AlertaSlaEnviada { get; set; } = false;

    [Column("sla_vencido_notificado")]
    public bool SlaVencidoNotificado { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public TipoSolicitud? TipoSolicitud { get; set; }
    public EstadoSolicitud? Estado { get; set; }
    public Usuario? Solicitante { get; set; }
    public Usuario? Responsable { get; set; }
    public Proyecto? Proyecto { get; set; }
    public Empresa? Empresa { get; set; }
}