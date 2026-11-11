# Gatekeeper · Frontend

Landing pública en Astro y dashboard SecOps en Angular 22 + Angular Material.

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

## Landing pública

```bash
npm ci --prefix landing
npm run landing:dev    # http://localhost:4321
npm run landing:build  # salida estática en landing/dist
```

En desarrollo, el enlace al dashboard abre `http://localhost:4200/login`. En producción apunta a `/login` en el mismo dominio. Si Angular se sirve en otro dominio, define `PUBLIC_DASHBOARD_URL` con la URL completa de inicio de sesión antes de compilar la landing.
