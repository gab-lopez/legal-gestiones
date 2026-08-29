using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    public AuthController(AppDbContext context) => _context = context;

[HttpGet("me")]
[Authorize]
public async Task<IActionResult> Me()
{
    var correo = User.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")
              ?? User.FindFirstValue(ClaimTypes.Upn)
              ?? User.FindFirstValue(ClaimTypes.Name);

    if (string.IsNullOrEmpty(correo))
        return Unauthorized(new { mensaje = "No se pudo identificar el usuario." });

    var usuario = await _context.Usuarios
        .Include(u => u.Rol)
        .Include(u => u.Area)
        .ThenInclude(a => a!.UnidadNegocio)
        .FirstOrDefaultAsync(u => u.Correo == correo && u.Activo);

    if (usuario == null)
        return Unauthorized(new { mensaje = "Usuario no autorizado en el sistema.", correo });

    return Ok(new {
        id            = usuario.Id,
        nombres       = usuario.Nombres,
        apellidos     = usuario.Apellidos,
        correo        = usuario.Correo,
        rol           = usuario.Rol!.Nombre,
        rolId         = usuario.RolId,
        area          = usuario.Area!.Nombre,
        unidadNegocio = usuario.Area.UnidadNegocio!.Nombre
    });
}
}