USE LegalGestiones;

-- 1. Mover usuarios de "Desarrollos Casas" y "Desarrollos Edificios" a "Desarrollos"
UPDATE areas SET unidad_negocio_id = 3 WHERE unidad_negocio_id = 1;
UPDATE areas SET unidad_negocio_id = 3 WHERE unidad_negocio_id = 2;

UPDATE unidades_negocio SET nombre = 'Leasing' WHERE id = 6;
UPDATE unidades_negocio SET activo = 0 WHERE id IN (1, 2);

SELECT id, nombre FROM areas WHERE unidad_negocio_id = 3 ORDER BY id;
select * from unidades_negocio

SELECT id, nombre, activo FROM unidades_negocio ORDER BY id;
