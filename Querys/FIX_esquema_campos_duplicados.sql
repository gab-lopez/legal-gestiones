-- ================================================================
-- Limpia campos duplicados en el esquema_json de "Arrendamiento -
-- Local Comercial" (ocurrio porque UPDATE_esquema_fechas_contrato.sql
-- se corrio dos veces con JSON_MODIFY 'append', que no revisa si el
-- campo ya existia).
--
-- Reconstruye el arreglo "campos" quedandose con la PRIMERA aparicion
-- de cada "nombre" de campo, en el mismo orden original.
-- ================================================================
USE LegalGestiones;

DECLARE @esquema NVARCHAR(MAX) = (
    SELECT esquema_json FROM tipos_solicitud WHERE nombre = 'Arrendamiento - Local Comercial'
);

DECLARE @camposLimpios NVARCHAR(MAX);

;WITH campos AS (
    SELECT
        CAST([key] AS INT) AS idx,
        value AS campo_json,
        JSON_VALUE(value, '$.nombre') AS nombre_campo,
        ROW_NUMBER() OVER (PARTITION BY JSON_VALUE(value, '$.nombre') ORDER BY CAST([key] AS INT)) AS rn
    FROM OPENJSON(@esquema, '$.campos')
)
SELECT @camposLimpios = '[' + STRING_AGG(campo_json, ',') WITHIN GROUP (ORDER BY idx) + ']'
FROM campos
WHERE rn = 1;

UPDATE tipos_solicitud
SET esquema_json = JSON_MODIFY(@esquema, '$.campos', JSON_QUERY(@camposLimpios))
WHERE nombre = 'Arrendamiento - Local Comercial';

-- Verificacion: cuenta cuantas veces aparece cada nombre de campo (todo debe dar 1)
SELECT JSON_VALUE(value, '$.nombre') AS nombre_campo, COUNT(*) AS veces
FROM tipos_solicitud t
CROSS APPLY OPENJSON(t.esquema_json, '$.campos')
WHERE t.nombre = 'Arrendamiento - Local Comercial'
GROUP BY JSON_VALUE(value, '$.nombre')
HAVING COUNT(*) > 1;
-- ^ si esta consulta no devuelve filas, ya no hay duplicados

SELECT esquema_json FROM tipos_solicitud WHERE nombre = 'Arrendamiento - Local Comercial';
GO
