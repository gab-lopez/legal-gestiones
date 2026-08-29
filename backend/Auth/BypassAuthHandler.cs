using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace backend.Auth;

// Handler de autenticación "falso" usado SOLO cuando Auth:Enabled = false en appsettings.
// Autentica automáticamente cada request como el usuario definido en Auth:DevUserEmail,
// para no tener que tocar los [Authorize] de cada controlador ni la lógica que depende
// de /api/auth/me para resolver el usuario actual.
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
        var correo = _config["Auth:DevUserEmail"];

        if (string.IsNullOrWhiteSpace(correo))
            return Task.FromResult(AuthenticateResult.Fail(
                "Auth:Enabled está en false pero falta Auth:DevUserEmail en appsettings."));

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
