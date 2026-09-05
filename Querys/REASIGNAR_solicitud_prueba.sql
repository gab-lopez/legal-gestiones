-- ================================================================
-- Reasigna la solicitud mas reciente (creada mientras la sesion
-- estaba fija en el administrador) a un usuario Solicitante real,
-- para poder probar "Mis solicitudes" / bandeja de correcciones
-- con el selector Dev del frontend.
-- ================================================================
USE LegalGestiones;

-- 1) Reasignar la solicitud mas reciente a Heidy Palma (Solicitante)
UPDATE s
SET s.solicitante_id = (SELECT id FROM usuarios WHERE correo = 'hpalma@rvcuatro.com')
FROM solicitudes s
WHERE s.id = (SELECT TOP (1) id FROM solicitudes ORDER BY created_at DESC);

-- 2) (Opcional) Marcarla como "pendiente de correccion" para probar
--    el panel de PanelCorreccion en MisSolicitudes.jsx. Ajusta el
--    nombre_campo por uno que exista de verdad en esa solicitud.
UPDATE TOP (1) s
SET s.bloqueada_por_info = 1,
    s.motivo_bloqueo     = 'Falta aclarar la direccion del inmueble.',
    s.estado_id          = (SELECT id FROM estados_solicitud WHERE nombre = 'Pendiente de info')
FROM solicitudes s
WHERE s.solicitante_id = (SELECT id FROM usuarios WHERE correo = 'hpalma@rvcuatro.com');

-- Necesita tambien un registro en solicitud_historial con tipo_evento
-- 'solicitud_correccion' y un valor_nuevo en JSON tipo {"campo":"observacion"}
-- porque GetObservacionesPendientes lee de ahi el detalle por campo.
INSERT INTO solicitud_historial (solicitud_id, usuario_id, tipo_evento, comentario, valor_nuevo, created_at)
SELECT
    s.id,
    (SELECT id FROM usuarios WHERE correo = 'dvillafuerte@rvcuatro.com'), -- gestor legal que corrige
    'solicitud_correccion',
    'Se solicito corregir la direccion del inmueble.',
    N'{"direccion":"Falta aclarar la direccion del inmueble."}',
    SYSUTCDATETIME()
FROM solicitudes s
WHERE s.solicitante_id = (SELECT id FROM usuarios WHERE correo = 'hpalma@rvcuatro.com')
  AND s.bloqueada_por_info = 1;

-- Verificacion
SELECT s.id, s.codigo, s.solicitante_id, u.correo AS solicitante, s.bloqueada_por_info, s.motivo_bloqueo
FROM solicitudes s
JOIN usuarios u ON u.id = s.solicitante_id
WHERE u.correo = 'hpalma@rvcuatro.com';
GO
