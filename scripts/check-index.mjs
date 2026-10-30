// Verifica que cada carpeta indexada tenga INDEX.md y que liste todo su contenido.
// Uso: node scripts/check-index.mjs [--fix]
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, p, read, write, exists, fail } from './lib.mjs';

const FIX = process.argv.includes('--fix');
const INDEXED_ROOTS = ['src', 'scripts', 'tools'];
const IGNORE = new Set(['INDEX.md', '.gitkeep', '.DS_Store']);
// Archivos que no necesitan fila propia (los cubre el INDEX del padre o son triviales).
const IGNORE_PATTERNS = [/\.spec\.ts$/];

const template = (rel) => `# \`${rel}\`

**Propósito:** ⏳
**Capa:** ⏳
**Módulo que la creó:** ⏳
**Puede importar de:** ⏳

## Contenido

| Archivo / carpeta | Qué es | Módulo |
|---|---|---|
`;

const problems = [];

function walk(dir) {
  const rel = relative(ROOT, dir).replaceAll('\\', '/');
  const entries = readdirSync(dir).filter(
    (e) => !IGNORE.has(e) && !IGNORE_PATTERNS.some((re) => re.test(e)),
  );
  const indexPath = join(dir, 'INDEX.md');

  if (!exists(indexPath)) {
    if (FIX) {
      write(indexPath, template(rel));
      console.log(`+ creado ${rel}/INDEX.md`);
    } else {
      problems.push(`${rel}/ no tiene INDEX.md`);
    }
  }

  if (exists(indexPath)) {
    let text = read(indexPath);
    const missing = entries.filter((e) => {
      const name = statSync(join(dir, e)).isDirectory() ? `${e}/` : e;
      return !text.includes(`\`${name}\``) && !text.includes(`\`${e}\``);
    });
    for (const e of missing) {
      const isDir = statSync(join(dir, e)).isDirectory();
      const name = isDir ? `${e}/` : e;
      if (FIX) {
        text = text.trimEnd() + `\n| \`${name}\` | ⏳ | ⏳ |\n`;
        console.log(`+ fila ${rel}/INDEX.md → ${name}`);
      } else {
        problems.push(`${rel}/INDEX.md no lista \`${name}\``);
      }
    }
    if (FIX && missing.length) write(indexPath, text);
  }

  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full);
  }
}

for (const r of INDEXED_ROOTS) if (exists(p(r))) walk(p(r));

if (problems.length) {
  fail(
    `Índices desactualizados (${problems.length}):\n  - ${problems.join('\n  - ')}\n\n` +
      `Corre "npm run index:fix" y completa las descripciones ⏳.`,
  );
}
console.log('✔ Índices de carpetas al día');
