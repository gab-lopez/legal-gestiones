namespace backend.Services;

// Punto unico donde se arma el asunto/cuerpo de cada correo del sistema y se
// resuelve a quien va dirigido. Los controladores solo llaman a estos
// metodos con el id de la solicitud — toda la carga de datos y el texto del
// correo vive aqui, para no repetir Include()s ni HTML en cada controlador.
public interface INotificacionesService
{
    Task SolicitudCreadaAsync(int solicitudId);
    Task CambioEstadoAsync(int solicitudId, string estadoAnteriorNombre);
    Task PendienteCorreccionAsync(int solicitudId);
    Task DocumentoGeneradoAsync(int solicitudId, string nombreArchivo);
    Task AlertaSlaProximaAsync(int solicitudId);
    Task SlaVencidoAsync(int solicitudId);
}
