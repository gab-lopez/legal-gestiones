using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Rol> Roles { get; set; }
    public DbSet<UnidadNegocio> UnidadesNegocio { get; set; }
    public DbSet<Area> Areas { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Empresa> Empresas { get; set; }
    public DbSet<Proyecto> Proyectos { get; set; }
    public DbSet<TipoSolicitud> TiposSolicitud { get; set; }
    public DbSet<EstadoSolicitud> EstadosSolicitud { get; set; }
    public DbSet<Solicitud> Solicitudes { get; set; }
    public DbSet<SolicitudDatos> SolicitudDatos { get; set; }
    public DbSet<SolicitudParte> SolicitudPartes { get; set; }
    public DbSet<SolicitudAdjunto> SolicitudAdjuntos { get; set; }
    public DbSet<SolicitudHistorial> SolicitudHistorial { get; set; }
    public DbSet<Sociedad> Sociedades { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SolicitudDatos>()
            .HasOne(sd => sd.Solicitud)
            .WithOne()
            .HasForeignKey<SolicitudDatos>(sd => sd.SolicitudId);

        modelBuilder.Entity<Solicitud>()
            .HasOne(s => s.Solicitante)
            .WithMany()
            .HasForeignKey(s => s.SolicitanteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Solicitud>()
            .HasOne(s => s.Responsable)
            .WithMany()
            .HasForeignKey(s => s.ResponsableId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}