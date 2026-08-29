using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EstadosSolicitudController : ControllerBase
{
    private readonly AppDbContext _context;
    public EstadosSolicitudController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var estados = await _context.EstadosSolicitud
            .Where(e => e.Activo)
            .OrderBy(e => e.OrdenFlujo)
            .ToListAsync();
        return Ok(estados);
    }
}