# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular (standalone components, signals, TypeScript estricto) + Angular Material + RxJS. Sin SSR; se compila como app estática servida por Nginx.

## Users

Analistas de seguridad y administradores (SecOps). Usan el dashboard durante horas seguidas para monitorear alertas en tiempo real, revisar por qué se bloqueó un archivo y liberar falsos positivos de la cuarentena.

Dos roles con permisos distintos:

- **Analista:** supervisa y revisa.
- **Administrador:** además libera archivos de cuarentena y gestiona API keys (liberar de cuarentena es solo admin).

## Product Purpose

Este es el dashboard web de Gatekeeper, una API de seguridad que recibe los archivos que suben otras aplicaciones, valida su tipo real, los reconstruye para eliminar contenido oculto (CDR, Content Disarm & Reconstruction) y los analiza con ClamAV y VirusTotal antes de entregarlos.

El dashboard existe para:

- supervisar las amenazas bloqueadas;
- gestionar la cuarentena;
- revisar la bitácora de auditoría;
- administrar API keys.

El éxito es que un analista entienda rápido por qué se bloqueó un archivo y que un admin pueda resolver falsos positivos con confianza.

## Positioning

Gatekeeper no solo escanea: valida el tipo real del archivo y lo reconstruye (CDR) antes de entregarlo, combinando ClamAV y VirusTotal. El dashboard es la vista operativa de ese pipeline.

## Operating Context

- Sesiones largas de monitoreo, con alertas en tiempo real.
- Flujo de revisión: alerta o archivo bloqueado → motivo del bloqueo → decisión (mantener en cuarentena o liberar, solo admin).
- Otras aplicaciones suben archivos a la API de Gatekeeper; este dashboard no es el punto de subida de los usuarios finales.
- El diseño debe seguir el maquetado de Figma del usuario (ver Brand Commitments).

## Capabilities and Constraints

Áreas funcionales confirmadas:

- Panel de amenazas bloqueadas (monitoreo en tiempo real).
- Gestión de cuarentena (liberar falsos positivos: solo admin).
- Bitácora de auditoría.
- Administración de API keys.
- Control de acceso por rol (analista / administrador).

Restricciones técnicas: Angular con Material y RxJS, sin SSR, build estático detrás de Nginx.

Sin decidir: método de autenticación del dashboard, endpoints concretos de la API, mecanismo del tiempo real (WebSocket, SSE o polling), idioma de la interfaz.

## Brand Commitments

El diseño visual debe seguir el maquetado de Figma del usuario. Es una restricción vinculante; el archivo o enlace de Figma aún no está en el proyecto.

## Evidence on Hand

Ninguna todavía en el repositorio: no hay código, capturas, datos de ejemplo ni el archivo de Figma. No inventar métricas, volúmenes de amenazas, clientes ni datos de muestra presentados como reales.

## Product Principles

1. **Claridad del veredicto:** cada archivo bloqueado debe explicar por qué (tipo real, CDR, ClamAV, VirusTotal) sin que el analista tenga que investigar.
2. **Acciones destructivas o de riesgo, con fricción justa:** liberar de cuarentena y revocar API keys son decisiones de admin, deliberadas y auditables.
3. **Hecho para sesiones largas:** legible y sin fatiga durante horas, con información densa pero escaneable.
4. **Los permisos se ven:** el rol define qué se puede hacer, y la interfaz lo comunica en vez de fallar en silencio.
5. **Todo deja rastro:** las acciones relevantes quedan en la bitácora de auditoría.

## Accessibility & Inclusion

Sin estándar específico establecido. Por el uso prolongado, tratar legibilidad y contraste como requisito práctico.
