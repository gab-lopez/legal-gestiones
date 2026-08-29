using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("solicitud_adjuntos")]
public class SolicitudAdjunto
{
    [Key] public int Id { get; set; }

    [Column("solicitud_id")]
    public int SolicitudId { get; set; }

    [Column("nombre_archivo")]
    public string NombreArchivo { get; set; } = string.Empty;

    [Column("ruta_archivo")]
    public string RutaArchivo { get; set; } = string.Empty;

    [Column("mime_type")]
    public string? MimeType { get; set; }

    [Column("es_documento_generado")]
    public bool EsDocumentoGenerado { get; set; } = false;

    public int Version { get; set; } = 1;

    [Column("estado_revision")]
    public string? EstadoRevision { get; set; }

    public string? Observacion { get; set; }

    [Column("subido_por")]
    public int SubidoPor { get; set; }

    [Column("validado_por")]
    public int? ValidadoPor { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Solicitud? Solicitud { get; set; }
}