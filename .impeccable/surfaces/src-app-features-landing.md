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
FIRST VIEWPORT (rediseñado a pedido de la persona, 2026-10-29): barra de navegación flotante en píldora que se solidifica con el scroll. Titular a todo el ancho en tres líneas que suben desde una máscara. Debajo, a la izquierda: texto, «Ver la integración», «Entrar al dashboard» y el comando `curl` real; a la derecha: un escáner que inspecciona archivos de ejemplo con su volcado hexadecimal real y sella el dictamen. El formato de declaración pasa a la sección «Pruébalo», justo debajo.
FORM: Aduana, candidato 1 de la lista ordenada (elegido por la persona sobre el asignado, el 6). seed:ed73d116b716c8b6
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion (actualizado 2026-10-29, pasada «bolder» pedida por la persona)

- Sello del dictamen: único movimiento por acción de la persona.
- Riel de inspección: el trazo se dibuja una vez al entrar en pantalla (900 ms, ease-in-out) y los nodos se encienden en secuencia; no se repite.
- Cursor de la última terminal: parpadeo de terminal real; se detiene con reduced motion.

- Cabecera: entrada orquestada una vez al cargar (barra, titular escalonado 80 ms, texto, escáner). El escáner rota entre 3 archivos cada 5,2 s; se pausa con hover, foco o pestaña oculta y no rota con reduced motion.
- Barra: se solidifica con `animation-timeline: scroll()`, sin JavaScript.

## Signature interaction

Cambiar el caso declarado reescribe la columna Inspeccionado y vuelve a sellar el dictamen (opacidad + escala 0.96→1, ~160 ms, ease-out fuerte). Sin animación con reduced motion.

## Open decisions

- Logotipo: solo texto «Gatekeeper» hasta que exista uno.
- «Entrar al dashboard» va a `/login`, que muestra una página «Próximamente» hasta M05.
