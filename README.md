# Gatekeeper · Frontend

Landing pública y dashboard SecOps de Gatekeeper (Angular 22 + Angular Material).

## Requisitos

- **Node.js 22.22.3+, 24.15.0+ o 26+** (lo exige Angular CLI 22). Revisa con `node -v`.

## Primeros pasos (en tu máquina)

```bash
npm install          # instala dependencias y activa los hooks de git (husky)
npm run setup:claude # instala /modulo-inicio, /modulo-cierre y /registrar-error en Claude Code
npm start            # http://localhost:4200
npm run verify       # lint + índices + seguridad + tests + build
```

Antes de trabajar, lee [`CLAUDE.md`](CLAUDE.md) y [`context/INDEX.md`](context/INDEX.md).
