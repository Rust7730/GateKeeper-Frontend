// Añade una nueva entrada a context/07-errores.md.
// Uso: npm run error:new -- "título" [mNN] [tipo]
import { p, read, write, today, fail } from './lib.mjs';

const [title, mod = '—', type = 'código'] = process.argv.slice(2);
if (!title) fail('Falta el título: npm run error:new -- "título" [mNN] [tipo]');

const file = p('context', '07-errores.md');
let text = read(file);

const ids = [...text.matchAll(/\bE-(\d{3})\b/g)].map((m) => Number(m[1]));
const id = `E-${String((ids.length ? Math.max(...ids) : 0) + 1).padStart(3, '0')}`;
const date = today();
const modLabel = mod === '—' ? '—' : mod.toUpperCase();

const row = `| ${id} | ${date} | ${modLabel} | ${type} | ${title} | ⏳ |`;
const rows = [...text.matchAll(/^\| E-\d{3} .*\|$/gm)];
if (!rows.length) fail('No se encontró la tabla "Resumen" en 07-errores.md');
const last = rows.at(-1);
const insertAt = last.index + last[0].length;
text = text.slice(0, insertAt) + '\n' + row + text.slice(insertAt);

text =
  text.trimEnd() +
  `

### ${id}

- **Fecha:** ${date} · **Módulo:** ${modLabel} · **Tipo:** ${type}
- **Qué pasó:** ⏳
- **Causa:** ⏳
- **Corrección:** ⏳
- **Lección / regla:** ⏳
`;

write(file, text);
console.log(
  `✔ ${id} añadido a context/07-errores.md — completa los campos ⏳ antes de corregir el error.`,
);
