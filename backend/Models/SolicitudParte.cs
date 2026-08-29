using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("solicitud_partes")]
public class SolicitudParte
{
    [Key] public int Id { get; set; }

    [Column("solicitud_id")]
    public int SolicitudId { get; set; }

    [Column("rol_parte")]
    public string RolParte { get; set; } = string.Empty;

    [Column("tipo_parte")]
    public string TipoParte { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    [Column("identificacion_tipo")]
    public string? IdentificacionTipo { get; set; }

    [Column("identificacion_numero")]
    public string? IdentificacionNumero { get; set; }

    public string? Correo { get; set; }
    public string? Telefono { get; set; }

    [Column("es_principal")]
    public bool EsPrincipal { get; set; } = false;

    public Solicitud? Solicitud { get; set; }
}