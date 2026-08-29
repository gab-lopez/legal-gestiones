using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Cryptography;
using System.Text;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    public UsuariosController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _context.Usuarios
            .Where(u => u.Activo)
            .Include(u => u.Rol)
            .Include(u => u.Area)
            .ThenInclude(a => a!.UnidadNegocio)
            .OrderBy(u => u.Nombres)
            .Select(u => new {
                u.Id,
                u.Nombres,
                u.Apellidos,
                u.Correo,
                u.Activo,
                Rol = u.Rol!.Nombre,
                Area = u.Area!.Nombre,
                UnidadNegocio = u.Area.UnidadNegocio!.Nombre
            })
            .ToListAsync();
        return Ok(usuarios);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Area)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (usuario == null) return NotFound();
        return Ok(usuario);
    }

    [HttpPost]
public async Task<IActionResult> Create(CrearUsuarioDto dto)
{
    if (await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo))
        return BadRequest(new { mensaje = "El correo ya está registrado." });

    var usuario = new Usuario
    {
        RolId        = dto.RolId,
        AreaId       = dto.AreaId,
        Nombres      = "",
        Apellidos    = "",
        Correo       = dto.Correo,
        PasswordHash = "",
    };

    _context.Usuarios.Add(usuario);
    await _context.SaveChangesAsync();
    return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, new { usuario.Id, usuario.Correo });
}

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ActualizarUsuarioDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        usuario.Nombres  = dto.Nombres;
        usuario.Apellidos = dto.Apellidos;
        usuario.RolId    = dto.RolId;
        usuario.AreaId   = dto.AreaId;
        usuario.Activo   = dto.Activo;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLower();
    }

    [HttpPut("{id}/mover-area")]
public async Task<IActionResult> MoverArea(int id, [FromBody] int areaId)
{
    var usuario = await _context.Usuarios.FindAsync(id);
    if (usuario == null) return NotFound();
    usuario.AreaId = areaId;
    await _context.SaveChangesAsync();
    return NoContent();
}

[HttpPut("{id}/rol-area")]
public async Task<IActionResult> ActualizarRolArea(int id, ActualizarRolAreaDto dto)
{
    var usuario = await _context.Usuarios.FindAsync(id);
    if (usuario == null) return NotFound();
    usuario.RolId  = dto.RolId;
    usuario.AreaId = dto.AreaId;
    await _context.SaveChangesAsync();
    return NoContent();
}

[HttpDelete("{id}")]
public async Task<IActionResult> Desactivar(int id)
{
    var usuario = await _context.Usuarios.FindAsync(id);
    if (usuario == null) return NotFound();
    usuario.Activo = false;
    await _context.SaveChangesAsync();
    return NoContent();
}

}

public record CrearUsuarioDto(
    int RolId, int AreaId,
    string Nombres, string Apellidos,
    string Correo, string Password);

public record ActualizarUsuarioDto(
    string Nombres, string Apellidos,
    int RolId, int AreaId, bool Activo);

public record ActualizarRolAreaDto(int RolId, int AreaId);


    