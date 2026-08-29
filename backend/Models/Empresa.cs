using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("empresas")]
public class Empresa
{
    [Key] public int Id { get; set; }

    [Column("nombre_legal")]
    public string NombreLegal { get; set; } = string.Empty;

    public string? Nit { get; set; }

    [Column("es_interna")]
    public bool EsInterna { get; set; } = false;

    public bool Activo { get; set; } = true;
}