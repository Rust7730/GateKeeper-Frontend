# 00 · Proyecto

## Qué es

**Gatekeeper** es una API que se coloca entre cualquier aplicación y su almacenamiento de archivos. Cada archivo subido pasa por capas:

1. Validación de **firma real** (magic numbers) contra lista blanca: JPEG, PNG, PDF.
2. **Reconstrucción (CDR)**: imágenes recodificadas desde píxeles y sin EXIF; PDF sin JavaScript, acciones automáticas ni embebidos.
3. **ClamAV** local.
4. **VirusTotal** (solo el hash SHA-256, nunca el archivo).

La app cliente solo puede descargar la versión reconstruida y solo si el archivo terminó en estado _limpio_.

Este repositorio contiene **la landing pública** (`/`, para quien decide adoptar Gatekeeper) y **el dashboard web** (`/app`, para el equipo de seguridad). Ninguno sube ni descarga archivos.

## Usuarios y roles

| Capacidad                       | Analista |  Administrador  |
| ------------------------------- | :------: | :-------------: |
| Resumen / métricas              |    ✔     |        ✔        |
| Archivos (lista y detalle)      |    ✔     |        ✔        |
| Cuarentena (ver)                |    ✔     |        ✔        |
| Cuarentena (liberar con motivo) |    ✖     |        ✔        |
| Alertas en tiempo real          |    ✔     |        ✔        |
| Bitácora de auditoría           |    ✖     |        ✔        |
| API keys (crear / revocar)      |    ✖     |        ✔        |
| MFA con TOTP                    | opcional | **obligatorio** |

## Estados de un archivo

| Estado                        | Significado                                                     | ¿Descargable por la app cliente? |
| ----------------------------- | --------------------------------------------------------------- | -------------------------------- |
| `pending` · Pendiente         | En cola o en análisis                                           | No                               |
| `clean` · Limpio              | Pasó todas las capas; existe versión reconstruida               | Sí (la reconstruida)             |
| `quarantined` · En cuarentena | Detección de malware o sospecha; original guardado 30 días      | No                               |
| `rejected` · Rechazado        | Violó la política (tipo no permitido, cifrado, tamaño, píxeles) | No                               |

## Capas de detección (para badges y métricas)

`signature` · `whitelist` · `cdr` · `clamav` · `virustotal` · `size_limit` · `pixel_limit` · `rate_limit` · `encrypted_pdf`

## Pantallas

| Pantalla          | Ruta                         | Rol                       | Endpoint                                                                      |
| ----------------- | ---------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| Landing           | `/`                          | público                   | —                                                                             |
| Login + TOTP      | `/login`                     | público                   | `POST /v1/auth/login`                                                         |
| Resumen           | `/app`                       | analista                  | `GET /v1/admin/metrics`                                                       |
| Archivos          | `/app/files`                 | analista                  | `GET /v1/admin/files`                                                         |
| Detalle           | `/app/files/:id`             | analista                  | `GET /v1/files/{id}` (vista admin)                                            |
| Cuarentena        | `/app/quarantine`            | analista (liberar: admin) | `GET /v1/admin/files?status=quarantined`, `POST /v1/admin/files/{id}/release` |
| Alertas           | `/app/alerts`                | analista                  | `GET /v1/admin/events` (SSE)                                                  |
| Auditoría         | `/app/audit`                 | admin                     | `GET /v1/admin/audit`                                                         |
| API keys          | `/app/api-keys`              | admin                     | `POST/DELETE /v1/admin/api-keys`                                              |
| 403 / 404 / error | `/forbidden`, `**`, `/error` | —                         | —                                                                             |

## Fuera de alcance del frontend

- Subir o descargar archivos (lo hacen las apps cliente vía API key).
- Vista previa del archivo original: **prohibida**.
- Análisis semántico de contenido.

## Fuentes

- Propuesta original: `Gatekeeper — Propuesta de Proyecto` (PDF).
- OWASP File Upload Cheat Sheet, MITRE CWE Top 25 2025.
