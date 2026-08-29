using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProyectosController : ControllerBase
{
    private readonly AppDbContext _context;
    public ProyectosController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var proyectos = await _context.Proyectos
            .Where(p => p.Activo)
            .Include(p => p.Empresa)
            .OrderBy(p => p.Nombre)
            .ToListAsync();
        return Ok(proyectos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Empresa)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (proyecto == null) return NotFound();
        return Ok(proyecto);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Proyecto proyecto)
    {
        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = proyecto.Id }, proyecto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Proyecto proyecto)
    {
        if (id != proyecto.Id) return BadRequest();
        _context.Entry(proyecto).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}