using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("sociedades")]
public class Sociedad
{
    [Key] public int Id { get; set; }

    [Column("nombre_sociedad")]
    public string NombreSociedad { get; set; } = string.Empty;

    [Column("nombre_representante")]
    public string NombreRepresentante { get; set; } = string.Empty;

    [Column("fecha_nacimiento")]
    public DateTime FechaNacimiento { get; set; }

    public string Dpi { get; set; } = string.Empty;

    public string Profesion { get; set; } = string.Empty;

    [Column("estado_civil")]
    public string? EstadoCivil { get; set; }

    public string Cargo { get; set; } = string.Empty;

    [Column("nombre_notario")]
    public string? NombreNotario { get; set; }

    [Column("acta_fecha")]
    public string? ActaFecha { get; set; }

    [Column("acta_notario")]
    public string? ActaNotario { get; set; }

    [Column("registro_numero")]
    public string? RegistroNumero { get; set; }

    [Column("registro_folio")]
    public string? RegistroFolio { get; set; }

    [Column("registro_libro")]
    public string? RegistroLibro { get; set; }

    public string? Banco { get; set; }

    [Column("numero_cuenta")]
    public string? NumeroCuenta { get; set; }

    public bool Activo { get; set; } = true;
}