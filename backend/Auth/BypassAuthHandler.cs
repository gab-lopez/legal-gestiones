using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace backend.Auth;

// Handler de autenticación "falso" usado SOLO cuando Auth:Enabled = false en appsettings.
// Autentica automáticamente cada request como el usuario definido en Auth:DevUserEmail,
// para no tener que tocar los [Authorize] de cada controlador ni la lógica que depende
// de /api/auth/me para resolver el usuario actual.
//
// El frontend puede mandar el header "X-Dev-User" con un correo distinto (ver el
// selector de usuario de prueba en la UI) para "impersonar" a otro usuario sin tocar
// este archivo ni reiniciar el backend. Si el header no viene, se usa el valor por
// defecto de appsettings.
public class BypassAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly IConfiguration _config;

    public BypassAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration config)
        : base(options, logger, encoder)
    {
        _config = config;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var correoHeader = Context.Request.Headers["X-Dev-User"].ToString();
        var correo = !string.IsNullOrWhiteSpace(correoHeader)
            ? correoHeader
            : _config["Auth:DevUserEmail"];

        if (string.IsNullOrWhiteSpace(correo))
            return Task.FromResult(AuthenticateResult.Fail(
                "Auth:Enabled está en false pero falta Auth:DevUserEmail en appsettings (o el header X-Dev-User)."));

        var claims = new[]
        {
            new Claim(ClaimTypes.Upn, correo),
            new Claim(ClaimTypes.Name, correo),
        };
        var identity  = new ClaimsIdentity(claims, "BypassAuth");
        var principal = new ClaimsPrincipal(identity);
        var ticket    = new AuthenticationTicket(principal, "BypassAuth");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
