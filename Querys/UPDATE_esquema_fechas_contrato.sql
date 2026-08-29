-- ================================================================
-- Agrega fecha_inicio_contrato y fecha_terminacion_contrato al
-- esquema_json de "Arrendamiento - Local Comercial" (seccion
-- CONDICIONES DEL CONTRATO). Usa JSON_MODIFY con "append" para no
-- reescribir todo el JSON.
--
-- IMPORTANTE: solo actualiza "Arrendamiento - Local Comercial".
-- Cuando el area legal entregue las plantillas de Kiosko y Oficina,
-- si su esquema_json tiene la misma estructura, correr lo mismo
-- cambiando el WHERE.
-- ================================================================
USE LegalGestiones;

UPDATE tipos_solicitud
SET esquema_json = JSON_MODIFY(
    JSON_MODIFY(
        esquema_json,
        'append $.campos',
        JSON_QUERY('{"nombre":"fecha_inicio_contrato","etiqueta":"Fecha de inicio del contrato","tipo":"date","requerido":true}')
    ),
    'append $.campos',
    JSON_QUERY('{"nombre":"fecha_terminacion_contrato","etiqueta":"Fecha de terminación del contrato","tipo":"date","requerido":true}')
)
WHERE nombre = 'Arrendamiento - Local Comercial';

-- Verificar el resultado:
SELECT esquema_json FROM tipos_solicitud WHERE nombre = 'Arrendamiento - Local Comercial';
GO
