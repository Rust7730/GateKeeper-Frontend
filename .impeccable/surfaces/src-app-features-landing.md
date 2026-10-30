---
version: 1
slug: 'src-app-features-landing'
primary_target: 'src/app/features/landing'
related_targets: []
---

## Scope

Landing pública en `/`. Modo Persuade. Construcción guiada por código (sin generación de imágenes). Brief completo en `context/m01-landing-brief.md`.

## Direction contract

THESIS: La página es una declaración aduanal de un archivo: lo que declara ser frente a lo que la inspección encuentra, con un dictamen sellado. Rechaza el héroe oscuro con escudo, brillo neón y fila de tarjetas iguales.
OWN-WORLD: Fondo `background/canvas` del Figma; formatos con casillas de borde `border/default` y retícula visible; columnas Declarado / Inspeccionado; dictámenes como sellos tipográficos en los colores de estado del Figma, la única fuente de color. Inter Semi Bold para titulares a escala de landing, IBM Plex Mono solo para datos reales (firmas, tipos, hashes, código).
STORY: Quien llega ve que la extensión miente, entiende que Gatekeeper decide por la firma real y entrega solo una copia reconstruida, confirma con la matriz de 15 vectores y los límites declarados, y va a la integración en una llamada.
FIRST VIEWPORT: Un formato de declaración a todo el ancho. Encabezado del formato con el titular. Debajo, dos columnas: Declarado (nombre, tipo declarado) e Inspeccionado (firma, tipo real, capa) con el sello del dictamen. Selector de casos sobre el formato. Acción principal «Ver la integración» y enlace secundario al dashboard visibles sin scroll.
FORM: Aduana, candidato 1 de la lista ordenada (elegido por la persona sobre el asignado, el 6). seed:ed73d116b716c8b6
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion (actualizado 2026-10-29, pasada «bolder» pedida por la persona)

- Sello del dictamen: único movimiento por acción de la persona.
- Riel de inspección: el trazo se dibuja una vez al entrar en pantalla (900 ms, ease-in-out) y los nodos se encienden en secuencia; no se repite.
- Cursor de la última terminal: parpadeo de terminal real; se detiene con reduced motion.

## Signature interaction

Cambiar el caso declarado reescribe la columna Inspeccionado y vuelve a sellar el dictamen (opacidad + escala 0.96→1, ~160 ms, ease-out fuerte). Sin animación con reduced motion.

## Open decisions

- Logotipo: solo texto «Gatekeeper» hasta que exista uno.
- «Entrar al dashboard» va a `/login`, que muestra una página «Próximamente» hasta M05.
