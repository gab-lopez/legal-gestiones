using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("proyectos")]
public class Proyecto
{
    [Key] public int Id { get; set; }

    [Column("empresa_id")]
    public int EmpresaId { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string? Codigo { get; set; }
    public bool Activo { get; set; } = true;

    public Empresa? Empresa { get; set; }
}