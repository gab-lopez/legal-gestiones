-- ============================================================
--  LegalGestiones — Datos iniciales reales
-- ============================================================

USE LegalGestiones;
GO

-- ------------------------------------------------------------
--  EMPRESAS (unidades intercompany)
-- ------------------------------------------------------------
INSERT INTO empresas (nombre_legal, nit, es_interna, activo) VALUES
    ('Dorado',  NULL, 1, 1),
    ('Phien',   NULL, 1, 1),
    ('SB4',     NULL, 1, 1);
GO

-- ------------------------------------------------------------
--  UNIDADES DE NEGOCIO
-- ------------------------------------------------------------
INSERT INTO unidades_negocio (nombre, activo) VALUES
    ('Desarrollos Casas',     1),   -- id 1
    ('Desarrollos Edificios', 1),   -- id 2
    ('Desarrollos',           1),   -- id 3
    ('Corporativo',           1),   -- id 4
    ('Lotificaciones',        1),   -- id 5
    ('Administración',        1);   -- id 6
GO

-- ------------------------------------------------------------
--  AREAS (departamentos)
--  Dorado → unidades 1,2,3  |  Phien → 4,5  |  SB4 → 6
-- ------------------------------------------------------------

-- Desarrollos Casas (unidad 1)
INSERT INTO areas (unidad_negocio_id, nombre, activo) VALUES
    (1, 'Comercial',          1),
    (1, 'Operaciones',        1),
    (1, 'Créditos y Cartera', 1),
    (1, 'COO',                1);

-- Desarrollos Edificios (unidad 2)
INSERT INTO areas (unidad_negocio_id, nombre, activo) VALUES
    (2, 'Comercial',                    1),
    (2, 'Operaciones',                  1),
    (2, 'Créditos y Cartera Armonía',   1),
    (2, 'SAC',                          1),
    (2, 'Mercadeo',                     1),
    (2, 'COO',                          1);

-- Desarrollos (unidad 3)
INSERT INTO areas (unidad_negocio_id, nombre, activo) VALUES
    (3, 'Finanzas',               1),
    (3, 'IT',                     1),
    (3, 'Innovación y Desarrollo', 1);

-- Corporativo Phien (unidad 4)
INSERT INTO areas (unidad_negocio_id, nombre, activo) VALUES
    (4, 'Auditoría',              1),
    (4, 'Contabilidad',           1),
    (4, 'Dirección',              1),
    (4, 'Dirección General',      1),
    (4, 'Finanzas',               1),
    (4, 'Inteligencia de Negocios', 1),
    (4, 'IT',                     1),
    (4, 'Legal',                  1),
    (4, 'Recursos Humanos',       1),
    (4, 'Tesorería',              1),
    (4, 'JFS',                    1),
    (4, 'MMBDS',                  1);

-- Lotificaciones Phien (unidad 5)
INSERT INTO areas (unidad_negocio_id, nombre, activo) VALUES
    (5, 'Lotificaciones', 1),
    (5, 'Finanzas',       1);

-- Administración SB4 (unidad 6)
INSERT INTO areas (unidad_negocio_id, nombre, activo) VALUES
    (6, 'Administración Inmuebles',              1),
    (6, 'Administración Condominios',            1),
    (6, 'Administración Edificios - Ascend',     1),
    (6, 'Administración Edificios - EON',        1),
    (6, 'Administración Edificios - Salucentro', 1),
    (6, 'Administración Edificios - Armonía',    1),
    (6, 'Administración Edificios - Providencia', 1),
    (6, 'Administración Condominios - Bosques de Pinula',   1),
    (6, 'Administración Condominios - Condado Santa Elena', 1),
    (6, 'Administración Condominios - Reserva del Bosque',  1),
    (6, 'Administración Condominios - Santa Elena',         1);
GO

-- ------------------------------------------------------------
--  PROYECTOS
-- ------------------------------------------------------------
INSERT INTO proyectos (empresa_id, nombre, codigo, activo) VALUES
    (1, 'Bosques de Pinula',    'BDP',  1),
    (1, 'Bosques de Santa Elena', 'BSE', 1),
    (1, 'Condado Santa Elena',  'CSE',  1),
    (2, 'Legado Cobán',         'LCO',  1),
    (2, 'Bosques de Jalapa',    'BJA',  1);
GO

-- ------------------------------------------------------------
--  USUARIOS
--  Roles: 1=Administrador, 2=Solicitante, 3=Gestor Legal
--  password_hash = SHA256 de 'Temporal2025!' para todos
-- ------------------------------------------------------------

-- Gestor legal (del área Legal de Corporativo Phien — area_id 21)
INSERT INTO usuarios (rol_id, area_id, nombres, apellidos, correo, password_hash, activo) VALUES
    (3, 21, 'Dania Marjony',   'Villafuerte Maldonado', 'dania.villafuerte@empresa.com',  'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1);

INSERT INTO usuarios (rol_id, area_id, nombres, apellidos, correo, password_hash, activo) VALUES
    (1, 21, 'Alejandro',       'Menegazzo Mena',        'amenegazzo@rvcuatro.com', 'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1);

-- Solicitantes de muestra de distintas áreas
INSERT INTO usuarios (rol_id, area_id, nombres, apellidos, correo, password_hash, activo) VALUES
    -- Comercial Desarrollos Casas (area_id 1)
    (2, 1,  'Heidy Arely',     'Palma Barrientos',      'hpalma@rvcuatro.com',         'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    (2, 1,  'Fredy Alberto',   'Jimenez Marroquin',     'fjimenez@rvcuatro.com',       'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    -- Finanzas Desarrollos (area_id 11)
    (2, 11, 'Mayra Gabriela',  'Castellanos Flores',    'mgcastellanos@rvcuatro.com',   'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    (2, 11, 'Juan José',       'Lima Vásquez',          'jlima@rvcuatro.com',       'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    -- RRHH Corporativo (area_id 22)
    (2, 22, 'María de Lourdes', 'García Aquino',        'mlgarcia@rvcuatro.com',      'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    (2, 22, 'Carlos Javier',   'Ordoñez Torcelli',      'cordonez@rvcuatro.com',      'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    -- Administración SB4 (area_id 29)
    (2, 29, 'Eddy Rolando',    'Caxaj Interiano',       'ecaxaj@rvcuatro.com',          'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1),
    -- Lotificaciones (area_id 26)
    (2, 26, 'Juan Francisco',  'Lantan Morales',        'jlantan@rvcuatro.com',         'e3b67a8d2c9f1a0b4c5e6f7d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', 1);
GO

SELECT 'Datos insertados correctamente' AS resultado;

UPDATE usuarios
SET correo = 'dvillafuerte@rvcuatro.com'
WHERE id = 1;

select * from usuarios;
GO
