using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("solicitud_datos")]
public class SolicitudDatos
{
    [Key]
    [Column("solicitud_id")]
    public int SolicitudId { get; set; }

    [Column("datos_json")]
    public string DatosJson { get; set; } = "{}";

    public int Version { get; set; } = 1;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Solicitud? Solicitud { get; set; }
}