using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("solicitud_historial")]
public class SolicitudHistorial
{
    [Key] public int Id { get; set; }

    [Column("solicitud_id")]
    public int SolicitudId { get; set; }

    [Column("usuario_id")]
    public int UsuarioId { get; set; }

    [Column("tipo_evento")]
    public string TipoEvento { get; set; } = string.Empty;

    [Column("campo_cambiado")]
    public string? CampoCambiado { get; set; }

    [Column("valor_anterior")]
    public string? ValorAnterior { get; set; }

    [Column("valor_nuevo")]
    public string? ValorNuevo { get; set; }

    public string? Comentario { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Solicitud? Solicitud { get; set; }
    public Usuario? Usuario { get; set; }
}