using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TiposSolicitudController : ControllerBase
{
    private readonly AppDbContext _context;

    public TiposSolicitudController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tipos = await _context.TiposSolicitud
            .Where(t => t.Activo)
            .OrderBy(t => t.Nombre)
            .ToListAsync();

        return Ok(tipos);
    }
}