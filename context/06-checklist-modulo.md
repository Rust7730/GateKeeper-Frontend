# 06 · Checklist de cierre de módulo

Copiar en la descripción del PR o del commit de cierre. Un módulo **no** se cierra con casillas sin marcar; si algo no aplica, escribir "N/A" y por qué.

## Funcional

- [ ] Todos los criterios de aceptación del módulo en `04-plan-modulos.md` cumplidos.
- [ ] `npm start` (mock) muestra el entregable y se puede navegar.
- [ ] Estados cargando, vacío y error implementados donde haya datos.

## Diseño

- [ ] Comparado contra el frame de Figma correspondiente (captura lado a lado).
- [ ] Sin valores literales de color, tamaño, sombra o radio (stylelint en verde).
- [ ] Dark y light revisados.

## Seguridad

- [ ] Nombres hostiles visibles como texto y sin ejecución.
- [ ] Sin `innerHTML`, `bypassSecurityTrust*`, tokens en storage ni datos sensibles en URL.
- [ ] Sin enlaces a originales.

## Accesibilidad

- [ ] Teclado: todo alcanzable y con foco visible.
- [ ] Botones de ícono con `aria-label`; estado no depende solo de color.

## Calidad

- [ ] `npm run verify` en verde (lint + test + build).
- [ ] Specs nuevas para servicios y componentes del módulo.

## Documentación

- [ ] `INDEX.md` de cada carpeta tocada actualizado.
- [ ] `progreso.md` actualizado (estado, fecha, tag).
- [ ] Errores del módulo registrados en `07-errores.md`.
- [ ] Decisiones de diseño anotadas en `02-sistema-de-diseno.md`.

## Git

- [ ] Commits con formato `tipo(mNN): …`.
- [ ] Merge a `main` y tag `mNN`.
