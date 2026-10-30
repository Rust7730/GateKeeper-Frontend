// Copia los comandos de Claude Code del repo (tools/claude-commands) a .claude/commands.
// Uso: npm run setup:claude   (correr en tu máquina; el agente remoto no puede escribir en .claude)
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { p } from './lib.mjs';

const src = p('tools', 'claude-commands');
const dest = p('.claude', 'commands');
mkdirSync(dest, { recursive: true });
for (const f of readdirSync(src).filter((f) => f.endsWith('.md') && f !== 'INDEX.md')) {
  copyFileSync(`${src}/${f}`, `${dest}/${f}`);
  console.log(`✔ /${f.replace(/\.md$/, '')} instalado`);
}
