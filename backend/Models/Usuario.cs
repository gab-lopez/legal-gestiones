using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("usuarios")]
public class Usuario
{
    [Key] public int Id { get; set; }

    [Column("rol_id")]
    public int RolId { get; set; }

    [Column("area_id")]
    public int AreaId { get; set; }

    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Rol? Rol { get; set; }
    public Area? Area { get; set; }
}