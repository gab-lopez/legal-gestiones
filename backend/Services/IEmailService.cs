namespace backend.Services;

// Abstrae el envio de correo del proveedor real (SMTP de Office 365, Gmail,
// SendGrid, etc.). Mientras no se decida el proveedor, Program.cs registra
// NullEmailService (solo loguea) en vez de SmtpEmailService, asi el resto
// del codigo (NotificacionesService, controladores) no cambia el dia que
// se conecte un proveedor real.
public interface IEmailService
{
    Task EnviarAsync(string destinatarioCorreo, string asunto, string cuerpoHtml);
}
