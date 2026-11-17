# `src/app/core/mocks`

**Propósito:** Backend simulado: base de datos, fixtures hostiles y estado del mock
**Capa:** core
**Módulo que la creó:** M00 (vacía) · se llena en M04
**Puede importar de:** core/* (nunca features ni shared/components)

## Contenido

| Archivo / carpeta       | Qué es                                                                                                                     | Módulo |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| `hostile-filenames.ts`  | Todos los fixtures hostiles de 05 § Fixtures hostiles y motivos hostiles para auditoría (S11)                              | M04    |
| `mock-db.ts`            | Generador determinista: 250 archivos, 3 apps, 40 de auditoría, 6 API keys, eventos y los 15 vectores; proyección K20 a DTO | M04    |
| `mock-backend-state.ts` | `MockBackendState`: base, rol, sesión expirada, latencia y errores forzados                                                | M04    |

## Notas

- Las filas guardan todos los campos, como el servidor; `toArchivoDto` aplica K20 al responder.
- Los fixtures hostiles solo van en archivos en cuarentena o con malware (K20): cada uno aparece al menos dos veces, una en cuarentena y reciente.
- El vector 13 (IDOR) son archivos de una aplicación ajena a la sesión: existen en la base y responden 404.
- El vector 10 (500 MB) no deja fila: Nginx responde 413 antes de la API.
