using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AreasController : ControllerBase
{
    private readonly AppDbContext _context;
    public AreasController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var areas = await _context.Areas
            .Where(a => a.Activo)
            .Include(a => a.UnidadNegocio)
            .OrderBy(a => a.Nombre)
            .ToListAsync();
        return Ok(areas);
    }

    [HttpGet("por-unidad/{unidadId}")]
    public async Task<IActionResult> GetByUnidad(int unidadId)
    {
        var areas = await _context.Areas
            .Where(a => a.Activo && a.UnidadNegocioId == unidadId)
            .OrderBy(a => a.Nombre)
            .ToListAsync();
        return Ok(areas);
    }

    [HttpGet("por-unidad-con-usuarios")]
    public async Task<IActionResult> GetUnidadesConAreas()
    {
        var unidades = await _context.UnidadesNegocio
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .Select(u => new {
                u.Id,
                u.Nombre,
                Areas = _context.Areas
                    .Where(a => a.UnidadNegocioId == u.Id && a.Activo)
                    .OrderBy(a => a.Nombre)
                    .Select(a => new {
                        a.Id,
                        a.Nombre,
                        Usuarios = _context.Usuarios
                            .Where(us => us.AreaId == a.Id && us.Activo)
                            .Select(us => new {
                                us.Id,
                                us.Nombres,
                                us.Apellidos,
                                us.Correo,
                                Rol = us.Rol!.Nombre
                            }).ToList()
                    }).ToList()
            }).ToListAsync();

        return Ok(unidades);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Area area)
    {
        area.Activo = true;
        _context.Areas.Add(area);
        await _context.SaveChangesAsync();
        return Ok(area);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Area area)
    {
        if (id != area.Id) return BadRequest();
        _context.Entry(area).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area == null) return NotFound();
        area.Activo = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}