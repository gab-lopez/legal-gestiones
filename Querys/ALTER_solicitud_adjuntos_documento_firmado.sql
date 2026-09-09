-- ================================================================
-- Agrega el flag que distingue el documento final firmado (subido
-- por el gestor) del borrador que genera el sistema automaticamente.
-- ================================================================
USE LegalGestiones;

ALTER TABLE solicitud_adjuntos ADD es_documento_firmado BIT NOT NULL DEFAULT 0;
GO

-- Verificacion
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'solicitud_adjuntos'
  AND COLUMN_NAME = 'es_documento_firmado';
GO
