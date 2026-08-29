using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UnidadesNegocioController : ControllerBase
{
    private readonly AppDbContext _context;
    public UnidadesNegocioController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var unidades = await _context.UnidadesNegocio
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .ToListAsync();
        return Ok(unidades);
    }

    [HttpPost]
    public async Task<IActionResult> Create(UnidadNegocio unidad)
    {
        unidad.Activo = true;
        _context.UnidadesNegocio.Add(unidad);
        await _context.SaveChangesAsync();
        return Ok(unidad);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UnidadNegocio unidad)
    {
        if (id != unidad.Id) return BadRequest();
        _context.Entry(unidad).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var unidad = await _context.UnidadesNegocio.FindAsync(id);
        if (unidad == null) return NotFound();
        unidad.Activo = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}