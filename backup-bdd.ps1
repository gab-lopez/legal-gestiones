# ================================================================
# Respaldo de la base de datos LegalGestiones (contenedor Docker)
# ================================================================
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\backup-bdd.ps1
#
# Requisitos: Docker Desktop corriendo y el contenedor "legal_sqlserver" activo
# (docker compose up -d en la carpeta del proyecto).
#
# Qué hace:
#   1. Corre BACKUP DATABASE dentro del contenedor (genera un .bak en su volumen)
#   2. Copia ese .bak hacia .\backups en tu máquina, con fecha en el nombre
#   3. NO sube este archivo a git (backups/ y *.bak ya están en .gitignore) —
#      guárdalo también en OneDrive/USB/donde prefieras, es tu respaldo real de datos.
# ================================================================

$ErrorActionPreference = "Stop"

$contenedor = "legal_sqlserver"
$baseDatos  = "LegalGestiones"
$fecha      = Get-Date -Format "yyyy-MM-dd_HHmm"
$nombreBak  = "LegalGestiones_$fecha.bak"
$rutaLocal  = Join-Path $PSScriptRoot "backups"

if (-not (Test-Path $rutaLocal)) {
    New-Item -ItemType Directory -Path $rutaLocal | Out-Null
}

Write-Host "Verificando que el contenedor '$contenedor' esté corriendo..." -ForegroundColor Cyan
$estado = docker ps --filter "name=$contenedor" --format "{{.Names}}"
if ($estado -ne $contenedor) {
    Write-Host "El contenedor '$contenedor' no está corriendo. Levántalo con 'docker compose up -d' e intenta de nuevo." -ForegroundColor Red
    exit 1
}

# Pide la contraseña de SA en lugar de leerla de un archivo, para no dejarla en este script
$saPassword = Read-Host "Contraseña de SA (la misma del .env)" -AsSecureString
$saPasswordPlano = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($saPassword)
)

Write-Host "Ejecutando BACKUP DATABASE dentro del contenedor..." -ForegroundColor Cyan
docker exec $contenedor /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U sa -P "$saPasswordPlano" -C `
    -Q "BACKUP DATABASE [$baseDatos] TO DISK = N'/var/opt/mssql/data/$nombreBak' WITH INIT"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Falló el BACKUP DATABASE. Revisa la contraseña o el estado del contenedor." -ForegroundColor Red
    exit 1
}

Write-Host "Copiando el .bak fuera del contenedor..." -ForegroundColor Cyan
docker cp "${contenedor}:/var/opt/mssql/data/$nombreBak" "$rutaLocal\$nombreBak"

Write-Host "Listo. Respaldo guardado en: $rutaLocal\$nombreBak" -ForegroundColor Green
Write-Host "Recuerda copiar este archivo también fuera de esta carpeta (OneDrive, USB, etc.) — no se sube a git." -ForegroundColor Yellow
