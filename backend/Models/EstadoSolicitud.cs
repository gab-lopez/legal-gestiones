using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("estados_solicitud")]
public class EstadoSolicitud
{
    [Key] public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    [Column("orden_flujo")]
    public int OrdenFlujo { get; set; } = 0;

    [Column("es_final")]
    public bool EsFinal { get; set; } = false;

    [Column("cuenta_para_sla")]
    public bool CuentaParaSla { get; set; } = true;

    public bool Activo { get; set; } = true;
}