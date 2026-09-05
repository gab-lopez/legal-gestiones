using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using backend.Auth;
using backend.Data;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Auth:Enabled = false (en appsettings.Development.json) desactiva el login de Microsoft
// y autentica todo request como Auth:DevUserEmail. Para producción, Auth:Enabled debe
// quedar en true (o ausente, ya que el default es true) para volver a exigir Entra ID.
var authEnabled = builder.Configuration.GetValue("Auth:Enabled", true);

if (authEnabled)
{
    builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd");
}
else
{
    builder.Services.AddAuthentication("BypassAuth")
        .AddScheme<AuthenticationSchemeOptions, BypassAuthHandler>("BypassAuth", null);

    builder.Services.AddAuthorization(options =>
    {
        options.DefaultPolicy = new AuthorizationPolicyBuilder("BypassAuth")
            .RequireAuthenticatedUser()
            .Build();
    });
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Email:Enabled = false (default, mientras no se decide el proveedor SMTP)
// usa NullEmailService, que solo loguea el correo que se hubiera mandado.
// Cuando se configure Email:Smtp en appsettings, poner Email:Enabled = true
// activa el envio real sin tocar ningun controlador ni NotificacionesService.
var emailEnabled = builder.Configuration.GetValue("Email:Enabled", false);
if (emailEnabled)
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
else
    builder.Services.AddScoped<IEmailService, NullEmailService>();

builder.Services.AddScoped<INotificacionesService, NotificacionesService>();
builder.Services.AddHostedService<SlaAlertaBackgroundService>();

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();