# 08 · Figma

Archivo: `ItzT18fsJUYYggQyqe9Zlx` ("Sin título" — conviene renombrarlo a "Gatekeeper · Dashboard").

| Página                | Nodo  | Link                                                                                     | Se usa en     |
| --------------------- | ----- | ---------------------------------------------------------------------------------------- | ------------- |
| Sistema de diseño     | `0:1` | [abrir](https://www.figma.com/design/ItzT18fsJUYYggQyqe9Zlx/Sin-t%C3%ADtulo?node-id=0-1) | M02, M03      |
| Vistas desktop        | `3:2` | [abrir](https://www.figma.com/design/ItzT18fsJUYYggQyqe9Zlx/Sin-t%C3%ADtulo?node-id=3-2) | M05–M13       |
| Vistas tablet / móvil | `3:3` | [abrir](https://www.figma.com/design/ItzT18fsJUYYggQyqe9Zlx/Sin-t%C3%ADtulo?node-id=3-3) | M14           |
| Flujos (prototipo)    | `3:4` | [abrir](https://www.figma.com/design/ItzT18fsJUYYggQyqe9Zlx/Sin-t%C3%ADtulo?node-id=3-4) | M05, M09, M13 |

## Mapa de frames → módulos

Se completa en M02 con `get_metadata` sobre `3:2`, `3:3` y `3:4`.

| Frame (nombre en Figma) | Nodo | Pantalla / estado                      | Módulo |
| ----------------------- | ---- | -------------------------------------- | ------ |
| ⏳                      | ⏳   | Login                                  | M05    |
| ⏳                      | ⏳   | Login · TOTP                           | M05    |
| ⏳                      | ⏳   | Resumen                                | M10    |
| ⏳                      | ⏳   | Archivos                               | M07    |
| ⏳                      | ⏳   | Detalle de archivo                     | M08    |
| ⏳                      | ⏳   | Cuarentena + modal liberar             | M09    |
| ⏳                      | ⏳   | Alertas                                | M11    |
| ⏳                      | ⏳   | Auditoría                              | M12    |
| ⏳                      | ⏳   | API keys + modales                     | M13    |
| ⏳                      | ⏳   | 403 / 404 / error / sesión por expirar | M06    |

## Procedimiento de extracción (con el conector MCP de Figma)

1. Cargar la skill `figma:figma-design-to-code` antes de `get_design_context`.
2. `get_metadata` sobre `0:1` → listar componentes, variantes y frames.
3. `get_variable_defs` sobre `0:1` → colores (Dark/Light), espaciado, radios. Copiar a `02-sistema-de-diseno.md`.
4. `get_screenshot` de cada componente → guardar en `context/figma-snapshots/` para comparar.
5. Por pantalla: `get_design_context` del frame en `3:2` justo antes de maquetarla (no todo de golpe).
6. Si un valor del frame no corresponde a ninguna variable (hex suelto), **no** se usa: se registra en `02 § Decisiones pendientes`.

## Si el conector no está disponible

Pedir al usuario:

- Exportación de variables (plugin "Variables Export" o Dev Mode → JSON), o
- Capturas de la página de sistema de diseño y de cada frame, con Dev Mode abierto para ver valores.

No avanzar a CSS sin valores reales (ver [E-002](07-errores.md#e-002)).
