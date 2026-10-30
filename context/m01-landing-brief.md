# M01 · Brief de la landing

> **Estado:** borrador para confirmación (salida de `/impeccable shape landing`, 2026-10-29). Al confirmarse, se registra como _Direction contract_ con `impeccable surface-brief write` y empieza la construcción.
> Tirada de impeccable degradada (sin retadores de catálogo; servicio no alcanzable). Seed: `seed:ed73d116b716c8b6`. Sin generación de imágenes: construcción guiada por código.

## 1. Trabajo y audiencia

Equipos técnicos que evalúan si integrar Gatekeeper (desarrolladores de PyMEs, instituciones educativas, independientes). Se escribe como producto real. Modo **Persuade**.

## 2. Resultado y prueba

- En segundos, quien llega entiende que la extensión y el `Content-Type` los controla el atacante, y que Gatekeeper decide por la firma real y entrega solo una copia reconstruida.
- **Acción principal:** ver cómo se integra, en su forma de trabajo: `POST /v1/files` → `202` con ID → `GET /v1/files/{id}` → `GET /v1/files/{id}/content`.
- **Prueba (solo hechos de la propuesta):** subida sin restricciones en el lugar 12 del CWE Top 25 2025; matriz de 15 vectores con la capa que detiene cada uno; garantías (ningún original llega a la app, worker sin internet, solo el hash va a VirusTotal, auditoría); limitaciones declaradas.

## 3. Dirección elegida: **Aduana**

- **Tesis:** la página es una declaración aduanal. Cada archivo llega con lo que _dice_ ser (extensión, `Content-Type`) y Gatekeeper dictamina lo que _es_. Rechaza la página típica de seguridad: héroe oscuro con escudo o candado, brillo neón y una fila de tarjetas.
- **Mundo:** formatos de aduana con casillas, columnas **Declarado / Inspeccionado**, dictámenes sellados. Fondo oscuro del Figma (`background/canvas #101215`), tinta clara (`text/primary`). Los colores de estado son los dictámenes: rechazado, cuarentena, limpio, pendiente. Inter para la interfaz e IBM Plex Mono para datos (firmas, hashes, rutas), como en el Figma.
- **Expansión del mundo (pedida):** retícula de formulario visible (casillas con número y borde `border/default`), sellos de dictamen como elementos tipográficos con leve rotación, y escala tipográfica mayor que la del dashboard en los titulares. Todo lo nuevo se añade como tokens de la landing; no cambia los del dashboard.
- **Primera vista:** un formato de declaración a todo el ancho. _Declarado:_ `foto.jpg · image/jpeg`. _Inspeccionado:_ firma `<?php` · no es imagen. _Dictamen:_ **RECHAZADO**. El titular va en el encabezado del formato. La acción principal, «Ver la integración», queda visible sin hacer scroll.
- **Momento firma:** quien visita cambia lo «declarado» entre casos de la matriz (script con extensión de imagen, doble extensión, imagen polyglot, PDF con JavaScript, archivo de prueba EICAR) y la columna «Inspeccionado» responde con lo que el archivo realmente es, la capa que lo detuvo y el dictamen. Los datos están marcados como ejemplo.
- **Riesgo honesto:** es la lectura más esperable de una herramienta de inspección. Debe ganar por precisión del formato, no por disfraz: solo se sella lo que la API realmente decide.

## 4. Alcance y límites

- Una página en `/`, responsive de 390 a 1440 px. Sin backend; la única interacción es el selector de casos (más copiar código).
- No se tocan el dashboard ni los tokens de Figma existentes.
- **Anti-objetivos:** escudos, candados, capuchas, lluvia de código, brillos neón, métricas o clientes inventados, testimonios.

## 5. Estados y rangos

- Selector: 5 casos de la matriz + «archivo legítimo» (JPEG real → reconstruido → limpio), para que no todo sea rechazo.
- Nombres de archivo largos y hostiles se muestran literales y truncados (S1).
- `prefers-reduced-motion`: el sello aparece sin movimiento.

## 6. Interacción y estructura

Orden de lectura:

1. Declaración (primera vista).
2. Por qué la extensión miente (dato CWE).
3. Inspección por capas: firma → reconstrucción → ClamAV → VirusTotal. Es una secuencia real, por eso va numerada.
4. Integración: la llamada en el mismo formato, con copiar.
5. Garantías.
6. Matriz de los 15 vectores como tabla de inspección.
7. Límites declarados.
8. Pie: fuentes (MITRE, OWASP) y acceso al dashboard.

Movimiento (emil-design-eng): solo el sello del dictamen anima (opacidad + escala 0.96 → 1, ~160 ms, `--gk-ease-out`). Nada más se mueve sin acción de la persona; hover detrás de `@media (hover: hover) and (pointer: fine)`.

## 7. Restricciones y decisiones abiertas

- Sin prerender: CSR con metadatos en `index.html` (decidido el 2026-10-29).
- Fuentes empaquetadas (S9); sin CDN.
- **Logotipo:** el Figma no tiene logotipo gráfico, solo el texto «Gatekeeper». Se usa el texto hasta que exista uno.
- **Destino de «Ver la integración»:** la sección 4 de la misma página (no hay sitio de documentación).
- **Acceso al dashboard:** enlace a `/login`, que no existe hasta M05. ¿Se muestra igual o se oculta hasta entonces?
