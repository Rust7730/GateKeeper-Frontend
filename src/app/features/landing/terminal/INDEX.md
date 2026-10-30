# `src/app/features/landing/terminal`

**Propósito:** ventana de terminal realista (Bash o PowerShell) con resaltado de sintaxis seguro.
**Capa:** features
**Módulo que la creó:** M01
**Puede importar de:** —

## Contenido

| Archivo / carpeta | Qué es                                                                                            | Módulo |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------ |
| `terminal.ts`     | Componente `gk-terminal`: prompt por shell, copiar comando, cursor opcional                       | M01    |
| `terminal.html`   | Ventana con barra de título y pantalla; excluida de Prettier porque el espacio en `<pre>` importa | M01    |
| `terminal.scss`   | Ventana, colores de sintaxis (`--gk-syntax-*`) y cursor con reduced motion                        | M01    |
| `shell-tokens.ts` | Tokenizador de comandos y salidas; produce tokens, nunca HTML (S1)                                | M01    |
