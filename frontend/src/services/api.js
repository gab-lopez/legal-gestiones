import axios from 'axios';

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

const api = axios.create({
  baseURL: 'http://localhost:5239/api',
});

// Modo sin login (Auth:Enabled=false en el backend): si hay un usuario de
// prueba elegido en el selector, lo mandamos en un header para que
// BypassAuthHandler "impersone" a ese correo en vez del de appsettings.
if (AUTH_DISABLED) {
  api.interceptors.request.use((config) => {
    const devUser = localStorage.getItem('devUserEmail');
    if (devUser) config.headers['X-Dev-User'] = devUser;
    return config;
  });
}

export const tiposSolicitudService = {
  getAll: () => api.get('/tipossolicitud'),
};

export const estadosService = {
  getAll: () => api.get('/estadossolicitud'),
};

export const empresasService = {
  getAll: () => api.get('/empresas'),
  create: (data) => api.post('/empresas', data),
  update: (id, data) => api.put(`/empresas/${id}`, data),
};

export const proyectosService = {
  getAll: () => api.get('/proyectos'),
  create: (data) => api.post('/proyectos', data),
};

export const usuariosService = {
  getAll: () => api.get('/usuarios'),
  create: (data) => api.post('/usuarios', data),
};

export const solicitudesService = {
  getAll:                    (filtros) => api.get('/solicitudes', { params: filtros }),
  getById:                   (id)      => api.get(`/solicitudes/${id}`),
  create:                    (data)    => api.post('/solicitudes', data),
  cambiarEstado:              (id, data) => api.put(`/solicitudes/${id}/estado`, data),
  getHistorial:               (id)      => api.get(`/solicitudes/${id}/historial`),
  actualizarDatos:            (id, data) => api.put(`/solicitudes/${id}/datos`, data),
  guardarObservaciones:       (id, data) => api.put(`/solicitudes/${id}/observaciones`, data),
  getObservacionesPendientes: (id)      => api.get(`/solicitudes/${id}/observaciones-pendientes`),
  responderCorreccion:        (id, data) => api.put(`/solicitudes/${id}/responder-correccion`, data),
};

export default api;

export const archivosService = {
  subir: (codigoSolicitud, nombreParte, nombreDocumento, archivo, solicitudId, subidoPor) => {
    const formData = new FormData();
    formData.append('codigoSolicitud', codigoSolicitud);
    formData.append('nombreParte',     nombreParte);
    formData.append('nombreDocumento', nombreDocumento);
    formData.append('solicitudId',     solicitudId);
    formData.append('subidoPor',       subidoPor);
    formData.append('archivo',         archivo);
    return api.post('/archivos/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  descargar: (ruta) => api.get(`/archivos/descargar?ruta=${encodeURIComponent(ruta)}`, { responseType: 'blob' }),
  previewUrl: (ruta) => `http://localhost:5239/api/archivos/preview?ruta=${encodeURIComponent(ruta)}`,
};

export const documentosService = {
  generar: (solicitudId, usuarioId) =>
    api.post(`/documentos/generar/${solicitudId}?usuarioId=${usuarioId}`),
};

export const sociedadesService = {
  getAll:  ()       => api.get('/sociedades'),
  update:  (id, data) => api.put(`/sociedades/${id}`, data),
  create:  (data)   => api.post('/sociedades', data),
};

export const unidadesService = {
  getConAreas: () => api.get('/areas/por-unidad-con-usuarios'),
};

export const unidadesNegocioService = {
  getAll:     ()          => api.get('/unidadesnegocio'),
  create:     (data)      => api.post('/unidadesnegocio', data),
  update:     (id, data)  => api.put(`/unidadesnegocio/${id}`, data),
  desactivar: (id)        => api.delete(`/unidadesnegocio/${id}`),
};

export const areasAdminService = {
  create:     (data)      => api.post('/areas', data),
  update:     (id, data)  => api.put(`/areas/${id}`, data),
  desactivar: (id)        => api.delete(`/areas/${id}`),
};

export const usuariosMoverService = {
  moverArea: (usuarioId, areaId) => api.put(`/usuarios/${usuarioId}/mover-area`, areaId),
};

export const rolesService = {
  getAll: () => api.get('/roles'),
};

export const usuariosAdminService = {
  getAll:         ()          => api.get('/usuarios'),
  create:         (data)      => api.post('/usuarios', data),
  actualizarRolArea: (id, data) => api.put(`/usuarios/${id}/rol-area`, data),
  desactivar:     (id)        => api.delete(`/usuarios/${id}`),
};
