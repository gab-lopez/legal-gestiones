using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmpresasController : ControllerBase
{
    private readonly AppDbContext _context;
    public EmpresasController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var empresas = await _context.Empresas
            .Where(e => e.Activo)
            .OrderBy(e => e.NombreLegal)
            .ToListAsync();
        return Ok(empresas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);
        if (empresa == null) return NotFound();
        return Ok(empresa);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Empresa empresa)
    {
        _context.Empresas.Add(empresa);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = empresa.Id }, empresa);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Empresa empresa)
    {
        if (id != empresa.Id) return BadRequest();
        _context.Entry(empresa).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}