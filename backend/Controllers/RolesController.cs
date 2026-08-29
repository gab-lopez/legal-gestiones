using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _context;
    public RolesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _context.Roles
            .Where(r => r.Activo)
            .OrderBy(r => r.Nombre)
            .ToListAsync();
        return Ok(roles);
    }
}