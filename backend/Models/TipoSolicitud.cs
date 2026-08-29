using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("tipos_solicitud")]
public class TipoSolicitud
{
    [Key] public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Categoria { get; set; }

    [Column("horas_resolucion")]
    public int HorasResolucion { get; set; } = 24;

    [Column("horas_alerta_previa")]
    public int HorasAlertaPrevia { get; set; } = 4;

    [Column("requiere_proyecto")]
    public bool RequiereProyecto { get; set; } = false;

    [Column("requiere_empresa")]
    public bool RequiereEmpresa { get; set; } = false;

    [Column("esquema_json")]
    public string? EsquemaJson { get; set; }

    public bool Activo { get; set; } = true;
}