namespace backend.Services;

// Implementacion por defecto mientras Email:Enabled este en false (o ausente)
// en appsettings. No manda nada de verdad: solo deja constancia en el log
// para poder verificar en desarrollo que el disparador se ejecuto y con
// que datos, sin necesitar credenciales SMTP todavia.
public class NullEmailService : IEmailService
{
    private readonly ILogger<NullEmailService> _logger;

    public NullEmailService(ILogger<NullEmailService> logger) => _logger = logger;

    public Task EnviarAsync(string destinatarioCorreo, string asunto, string cuerpoHtml)
    {
        _logger.LogInformation(
            "[Correo simulado] Para: {Destinatario} | Asunto: {Asunto}\n{Cuerpo}",
            destinatarioCorreo, asunto, cuerpoHtml);
        return Task.CompletedTask;
    }
}
