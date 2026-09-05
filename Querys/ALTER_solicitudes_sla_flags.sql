-- ================================================================
-- Agrega los flags que usa el nuevo SlaAlertaBackgroundService para
-- no reenviar la misma alerta de SLA en cada corrida.
-- ================================================================
USE LegalGestiones;

ALTER TABLE solicitudes ADD alerta_sla_enviada     BIT NOT NULL DEFAULT 0;
ALTER TABLE solicitudes ADD sla_vencido_notificado BIT NOT NULL DEFAULT 0;
GO

-- Verificacion
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'solicitudes'
  AND COLUMN_NAME IN ('alerta_sla_enviada', 'sla_vencido_notificado');
GO
