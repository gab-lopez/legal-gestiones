# Legal Gestiones — Entorno de desarrollo

## Archivos incluidos
- `docker-compose.yml` → levanta SQL Server en Docker
- `.env`               → credenciales (no subir a git)
- `database.sql`       → crea todas las tablas y datos iniciales

---

## Paso 1 — Levantar SQL Server

Abre PowerShell en esta carpeta y ejecuta:

```powershell
docker compose up -d
```

La primera vez descarga la imagen (~1.5 GB). Espera un minuto y verifica:

```powershell
docker ps
```

Debes ver `legal_sqlserver` con estado `Up`.

---

## Paso 2 — Conectarte desde Azure Data Studio

| Campo          | Valor            |
|----------------|------------------|
| Server         | localhost,1433   |
| Authentication | SQL Login        |
| User           | sa               |
| Password       | LegalGestiones2025! |

---

## Paso 3 — Crear la base de datos y tablas

En Azure Data Studio abre un nuevo query y ejecuta primero:

```sql
CREATE DATABASE LegalGestiones;
```

Luego abre el archivo `database.sql` y ejecútalo completo.

---

## Comandos del día a día

```powershell
docker compose up -d    # encender
docker compose stop     # apagar (datos se conservan)
docker compose down     # eliminar contenedor (datos se conservan en volumen)
docker compose logs -f  # ver logs en vivo
```

---

## Conexión desde .NET (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=LegalGestiones;User Id=sa;Password=LegalGestiones2025!;TrustServerCertificate=True;"
  }
}
```

---

## Cuando migres al servidor

1. Copia esta carpeta al servidor
2. Edita `.env` con la contraseña de producción
3. Ejecuta `docker compose up -d`

Eso es todo.
