using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("areas")]
public class Area
{
    [Key] public int Id { get; set; }

    [Column("unidad_negocio_id")]
    public int UnidadNegocioId { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;

    public UnidadNegocio? UnidadNegocio { get; set; }
}