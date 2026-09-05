using System.Net;
using System.Net.Mail;

namespace backend.Services;

// Envio real via SMTP generico (sirve para Office 365, Gmail con clave de
// aplicacion, o cualquier relay que exponga SMTP estandar). Se activa solo
// cuando Email:Enabled = true en appsettings; mientras tanto Program.cs
// usa NullEmailService.
//
// Configuracion esperada en appsettings (ver appsettings.Development.example.json):
//   "Email": {
//     "Enabled": true,
//     "Smtp": {
//       "Host": "smtp.office365.com",
//       "Port": 587,
//       "UseSsl": true,
//       "Usuario": "notificaciones@rvcuatro.com",
//       "Password": "...",
//       "NombreRemitente": "Legal Gestiones RV4"
//     }
//   }
public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task EnviarAsync(string destinatarioCorreo, string asunto, string cuerpoHtml)
    {
        var host      = _config["Email:Smtp:Host"];
        var port      = _config.GetValue("Email:Smtp:Port", 587);
        var useSsl    = _config.GetValue("Email:Smtp:UseSsl", true);
        var usuario   = _config["Email:Smtp:Usuario"];
        var password  = _config["Email:Smtp:Password"];
        var remitente = _config["Email:Smtp:NombreRemitente"] ?? "Legal Gestiones RV4";

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(usuario))
        {
            _logger.LogWarning(
                "Email:Enabled=true pero falta Email:Smtp:Host o Email:Smtp:Usuario en appsettings. No se envio el correo a {Destinatario}.",
                destinatarioCorreo);
            return;
        }

        using var mensaje = new MailMessage
        {
            From       = new MailAddress(usuario, remitente),
            Subject    = asunto,
            Body       = cuerpoHtml,
            IsBodyHtml = true,
        };
        mensaje.To.Add(destinatarioCorreo);

        using var cliente = new SmtpClient(host, port)
        {
            EnableSsl   = useSsl,
            Credentials = new NetworkCredential(usuario, password),
        };

        try
        {
            await cliente.SendMailAsync(mensaje);
        }
        catch (Exception ex)
        {
            // No dejamos que un correo fallido tumbe la operacion que lo disparo
            // (crear solicitud, cambiar estado, etc.) — solo se loguea.
            _logger.LogError(ex, "Fallo el envio de correo a {Destinatario}.", destinatarioCorreo);
        }
    }
}
