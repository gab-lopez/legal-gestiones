-- ================================================================
-- Agrega a "sociedades" los campos necesarios para la plantilla nueva
-- de arrendamiento (NUEVA PLANTILLA.xml, área legal):
--   {{estado_civil_representante}}  -> sociedades.estado_civil
--   {{banco_razon_social}}          -> sociedades.banco
--   {{numero_de_cuenta_en_letras}}  -> sociedades.numero_cuenta
-- ================================================================
USE LegalGestiones;

ALTER TABLE sociedades ADD estado_civil  VARCHAR(100) NULL;
ALTER TABLE sociedades ADD banco         VARCHAR(150) NULL;
ALTER TABLE sociedades ADD numero_cuenta VARCHAR(50)  NULL;
GO
