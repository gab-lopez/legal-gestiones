-- ============================================================
--  LegalGestiones — Script de creación de base de datos
--  SQL Server 2022
-- ============================================================

USE LegalGestiones;
GO

-- ------------------------------------------------------------
--  1. ROLES
-- ------------------------------------------------------------
CREATE TABLE roles (
    id          INT           IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    descripcion VARCHAR(255)  NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  2. UNIDADES DE NEGOCIO
-- ------------------------------------------------------------
CREATE TABLE unidades_negocio (
    id     INT          IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    activo BIT          NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  3. AREAS  (departamentos dentro de una unidad)
-- ------------------------------------------------------------
CREATE TABLE areas (
    id                  INT          IDENTITY(1,1) PRIMARY KEY,
    unidad_negocio_id   INT          NOT NULL REFERENCES unidades_negocio(id),
    nombre              VARCHAR(150) NOT NULL,
    activo              BIT          NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  4. USUARIOS
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    rol_id        INT           NOT NULL REFERENCES roles(id),
    area_id       INT           NOT NULL REFERENCES areas(id),
    nombres       VARCHAR(150)  NOT NULL,
    apellidos     VARCHAR(150)  NOT NULL,
    correo        VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    activo        BIT           NOT NULL DEFAULT 1,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
--  5. EMPRESAS  (intercompany + terceros)
-- ------------------------------------------------------------
CREATE TABLE empresas (
    id           INT          IDENTITY(1,1) PRIMARY KEY,
    nombre_legal VARCHAR(200) NOT NULL,
    nit          VARCHAR(50)  NULL,
    es_interna   BIT          NOT NULL DEFAULT 0,
    activo       BIT          NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  6. PROYECTOS
-- ------------------------------------------------------------
CREATE TABLE proyectos (
    id         INT          IDENTITY(1,1) PRIMARY KEY,
    empresa_id INT          NOT NULL REFERENCES empresas(id),
    nombre     VARCHAR(200) NOT NULL,
    codigo     VARCHAR(50)  NULL,
    activo     BIT          NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  7. TIPOS DE SOLICITUD
--     horas_resolucion   → define la prioridad implícita (SLA)
--     horas_alerta_previa → con cuántas horas de anticipación se marca en amarillo
--     esquema_json       → definición de campos del formulario dinámico
-- ------------------------------------------------------------
CREATE TABLE tipos_solicitud (
    id                  INT           IDENTITY(1,1) PRIMARY KEY,
    nombre              VARCHAR(150)  NOT NULL,
    categoria           VARCHAR(100)  NULL,
    horas_resolucion    INT           NOT NULL DEFAULT 24,
    horas_alerta_previa INT           NOT NULL DEFAULT 4,
    requiere_proyecto   BIT           NOT NULL DEFAULT 0,
    requiere_empresa    BIT           NOT NULL DEFAULT 0,
    esquema_json        NVARCHAR(MAX) NULL,  -- definición del formulario
    activo              BIT           NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  8. ESTADOS DE SOLICITUD
-- ------------------------------------------------------------
CREATE TABLE estados_solicitud (
    id              INT          IDENTITY(1,1) PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    orden_flujo     INT          NOT NULL DEFAULT 0,
    es_final        BIT          NOT NULL DEFAULT 0,
    cuenta_para_sla BIT          NOT NULL DEFAULT 1,
    activo          BIT          NOT NULL DEFAULT 1
);
GO

-- ------------------------------------------------------------
--  9. SOLICITUDES
-- ------------------------------------------------------------
CREATE TABLE solicitudes (
    id                   INT           IDENTITY(1,1) PRIMARY KEY,
    codigo               VARCHAR(50)   NOT NULL UNIQUE,
    tipo_solicitud_id    INT           NOT NULL REFERENCES tipos_solicitud(id),
    estado_id            INT           NOT NULL REFERENCES estados_solicitud(id),
    solicitante_id       INT           NOT NULL REFERENCES usuarios(id),
    responsable_id       INT           NULL     REFERENCES usuarios(id),
    proyecto_id          INT           NULL     REFERENCES proyectos(id),
    empresa_id           INT           NULL     REFERENCES empresas(id),
    descripcion          NVARCHAR(MAX) NULL,
    fecha_solicitud      DATETIME2     NOT NULL DEFAULT GETDATE(),
    fecha_limite_sla     DATETIME2     NULL,     -- rojo cuando se supera
    fecha_limite_alerta  DATETIME2     NULL,     -- amarillo cuando se supera
    fecha_cierre         DATETIME2     NULL,
    bloqueada_por_info   BIT           NOT NULL DEFAULT 0,
    motivo_bloqueo       NVARCHAR(MAX) NULL,
    created_at           DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at           DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
--  10. DATOS DE LA SOLICITUD  (campos del formulario en JSON)
-- ------------------------------------------------------------
CREATE TABLE solicitud_datos (
    solicitud_id INT           NOT NULL PRIMARY KEY REFERENCES solicitudes(id),
    datos_json   NVARCHAR(MAX) NOT NULL,
    version      INT           NOT NULL DEFAULT 1,
    updated_at   DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
--  11. PARTES DE LA SOLICITUD
--      (arrendante, arrendatario, fiador, promitente, corredora, etc.)
-- ------------------------------------------------------------
CREATE TABLE solicitud_partes (
    id                    INT          IDENTITY(1,1) PRIMARY KEY,
    solicitud_id          INT          NOT NULL REFERENCES solicitudes(id),
    rol_parte             VARCHAR(100) NOT NULL,  -- 'arrendante', 'promitente_comprador', etc.
    tipo_parte            VARCHAR(50)  NOT NULL,  -- 'persona_individual' | 'persona_juridica'
    nombre                VARCHAR(200) NOT NULL,
    identificacion_tipo   VARCHAR(50)  NULL,      -- 'DPI', 'Pasaporte', etc.
    identificacion_numero VARCHAR(100) NULL,
    correo                VARCHAR(255) NULL,
    telefono              VARCHAR(50)  NULL,
    es_principal          BIT          NOT NULL DEFAULT 0
);
GO

-- ------------------------------------------------------------
--  12. ADJUNTOS DE LA SOLICITUD
--      es_documento_generado = 1  → borrador generado por el sistema
--      es_documento_generado = 0  → archivo subido por usuario o gestor
-- ------------------------------------------------------------
CREATE TABLE solicitud_adjuntos (
    id                    INT           IDENTITY(1,1) PRIMARY KEY,
    solicitud_id          INT           NOT NULL REFERENCES solicitudes(id),
    nombre_archivo        VARCHAR(255)  NOT NULL,
    ruta_archivo          VARCHAR(500)  NOT NULL,
    mime_type             VARCHAR(100)  NULL,
    es_documento_generado BIT           NOT NULL DEFAULT 0,
    version               INT           NOT NULL DEFAULT 1,
    estado_revision       VARCHAR(50)   NULL,     -- 'pendiente' | 'aprobado' | 'rechazado'
    observacion           NVARCHAR(MAX) NULL,
    subido_por            INT           NOT NULL REFERENCES usuarios(id),
    validado_por          INT           NULL     REFERENCES usuarios(id),
    created_at            DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
--  13. HISTORIAL DE LA SOLICITUD
-- ------------------------------------------------------------
CREATE TABLE solicitud_historial (
    id             INT           IDENTITY(1,1) PRIMARY KEY,
    solicitud_id   INT           NOT NULL REFERENCES solicitudes(id),
    usuario_id     INT           NOT NULL REFERENCES usuarios(id),
    tipo_evento    VARCHAR(100)  NOT NULL,  -- 'creacion', 'cambio_estado', 'comentario', etc.
    campo_cambiado VARCHAR(100)  NULL,
    valor_anterior NVARCHAR(MAX) NULL,
    valor_nuevo    NVARCHAR(MAX) NULL,
    comentario     NVARCHAR(MAX) NULL,
    created_at     DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
--  DATOS INICIALES
-- ============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
    ('Administrador',   'Acceso total al sistema'),
    ('Solicitante',     'Puede crear y consultar sus solicitudes'),
    ('Gestor Legal',    'Revisa, procesa y aprueba solicitudes');
GO

-- Estados del flujo
INSERT INTO estados_solicitud (nombre, orden_flujo, es_final, cuenta_para_sla) VALUES
    ('Recibida',            1, 0, 1),
    ('En revisión',         2, 0, 1),
    ('Pendiente de info',   3, 0, 0),  -- bloqueada, no cuenta para SLA
    ('Documento generado',  4, 0, 1),
    ('Aprobada',            5, 1, 0),
    ('Rechazada',           6, 1, 0);
GO

-- Tipos de solicitud con SLA en horas
INSERT INTO tipos_solicitud (nombre, categoria, horas_resolucion, horas_alerta_previa, requiere_proyecto, requiere_empresa) VALUES
    ('Pagaré intercompany',                 'Financiero',   48,  8,  0, 1),
    ('Pagaré comercial',                    'Financiero',   48,  8,  0, 1),
    ('Contrato de arrendamiento',           'Inmuebles',    72, 12,  1, 1),
    ('Contrato de servicios',               'RRHH',         48,  8,  0, 1),
    ('Contrato de servicios profesionales', 'RRHH',         48,  8,  0, 1),
    ('Terminación contrato de servicios',   'RRHH',         24,  4,  0, 1),
    ('Contrato de corretaje',               'Comercial',    72, 12,  1, 1),
    ('Certificado de actas',                'Legal',        24,  4,  0, 1),
    ('ICV',                                 'Ventas',       48,  8,  1, 1),
    ('Modelo PCV',                          'Ventas',       72, 12,  1, 1),
    ('Rescisión PCV',                       'Ventas',       72, 12,  1, 1);
GO
