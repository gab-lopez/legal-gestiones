use LegalGestiones;

-- Hash SHA256 de 'Temporal2025!' = 
-- b5a3d8e2f1c4b7a9e0d3f6c8b1a4e7d0f3c6b9a2e5d8f1c4b7a0e3d6f9c2b5a8
UPDATE usuarios SET password_hash = 'b5a3d8e2f1c4b7a9e0d3f6c8b1a4e7d0f3c6b9a2e5d8f1c4b7a0e3d6f9c2b5a8';a

USE LegalGestiones;

INSERT INTO usuarios (rol_id, area_id, nombres, apellidos, correo, password_hash, activo)
VALUES (1, 21, 'Darvin', 'Gabriel', 'dgabriel@rvcuatro.com', '', 1);

select * from usuarios;