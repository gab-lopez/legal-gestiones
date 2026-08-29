using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SociedadesController : ControllerBase
{
    private readonly AppDbContext _context;
    public SociedadesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sociedades = await _context.Sociedades
            .Where(s => s.Activo)
            .OrderBy(s => s.NombreSociedad)
            .Select(s => new {
                s.Id,
                s.NombreSociedad,
                s.NombreRepresentante,
                s.Cargo,
                s.Dpi,
                s.Profesion,
                s.EstadoCivil,
                s.NombreNotario,
                s.ActaFecha,
                s.ActaNotario,
                s.RegistroNumero,
                s.RegistroFolio,
                s.RegistroLibro,
                s.Banco,
                s.NumeroCuenta
            })
            .ToListAsync();
        return Ok(sociedades);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sociedad = await _context.Sociedades.FindAsync(id);
        if (sociedad == null) return NotFound();
        return Ok(sociedad);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Sociedad sociedad)
    {
        if (id != sociedad.Id) return BadRequest();
        _context.Entry(sociedad).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost]
public async Task<IActionResult> Create(Sociedad sociedad)
{
    sociedad.Activo = true;
    _context.Sociedades.Add(sociedad);
    await _context.SaveChangesAsync();
    return CreatedAtAction(nameof(GetById), new { id = sociedad.Id }, sociedad);
}
}