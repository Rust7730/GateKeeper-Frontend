# Gatekeeper · Frontend (landing + dashboard SecOps)

Punto de entrada para cualquier agente o persona que trabaje en este repositorio.
**Antes de escribir una sola línea de código, lee en este orden:**

1. [`context/INDEX.md`](context/INDEX.md) — mapa de toda la documentación.
2. [`context/01-reglas.md`](context/01-reglas.md) — reglas obligatorias (seguridad, código, commits).
3. [`context/07-errores.md`](context/07-errores.md) — errores ya cometidos. **No repetirlos.**
4. [`context/progreso.md`](context/progreso.md) — en qué módulo vamos y qué falta.
5. El archivo del módulo actual dentro de [`context/04-plan-modulos.md`](context/04-plan-modulos.md).

## Resumen en 5 líneas

- Dashboard web de **Gatekeeper**, API que valida, reconstruye (CDR) y analiza con antimalware los archivos que suben otras apps.
- Usuarios: **analistas** y **administradores** de seguridad (RBAC).
- Stack: **Angular (standalone + signals) + Angular Material + RxJS**, sin SSR, servido por Nginx.
- Fuente de verdad visual: **Figma** (ver [`context/08-figma.md`](context/08-figma.md)). No se inventan colores, tipografías ni espaciados.
- Se construye **por módulos** (M00 → M15). **Prioridad: la landing (M01)** antes que el dashboard. Cada módulo termina en un commit/tag servible y comprobable.
- Diseño con las skills **impeccable** (en `.claude/skills/`) y **emil-design-eng** (movimiento). Reglas en `context/01-reglas.md § D2`.

## Flujo de trabajo por sesión

```
leer reglas + errores + progreso
  → abrir módulo actual en el plan
  → revisar nodos de Figma del módulo
  → implementar
  → correr checklist (context/06-checklist-modulo.md)
  → actualizar INDEX.md de carpetas tocadas
  → actualizar progreso.md
  → si hubo error: registrarlo en 07-errores.md
  → commit(s) del módulo + tag
```

## Comandos

| Acción                           | Comando                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| Servir en modo mock              | `npm start` (usa `environment.useMocks = true`)                       |
| Build de producción              | `npm run build`                                                       |
| Lint                             | `npm run lint`                                                        |
| Tests unitarios                  | `npm test`                                                            |
| Verificación completa del módulo | `npm run verify` (lint + índices + seguridad + test + build)          |
| Iniciar / cerrar módulo          | `npm run module:start -- m01 landing` · `npm run module:close -- m01` |
| Registrar un error               | `npm run error:new -- "título" m01 código`                            |
| Revisar / crear índices          | `npm run check:index` · `npm run index:fix`                           |
| Instalar comandos de Claude Code | `npm run setup:claude` (una vez, en tu máquina)                       |

Todas las automatizaciones están descritas en [`context/09-automatizacion.md`](context/09-automatizacion.md).
