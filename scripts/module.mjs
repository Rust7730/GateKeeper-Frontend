// Inicia o cierra un módulo del plan.
// Uso: npm run module:start -- m01 landing
//      npm run module:close -- m01
import { p, read, write, today, sh, shOut, fail, normalizeModule } from './lib.mjs';

const [action, rawMod, ...nameParts] = process.argv.slice(2);
const MOD = normalizeModule(rawMod);
const tag = MOD.toLowerCase();
const progress = p('context', 'progreso.md');

function updateRow(transform) {
  const text = read(progress);
  const re = new RegExp(`^\\| ${MOD} [^\\n]*$`, 'm');
  const m = re.exec(text);
  if (!m) fail(`${MOD} no aparece en context/progreso.md`);
  const cells = m[0]
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
  const next = transform(cells);
  const line = `| ${next.join(' | ')} |`;
  let out = text.replace(m[0], line);
  return out;
}

if (action === 'start') {
  const name =
    nameParts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') || 'trabajo';
  const branch = `feat/${tag}-${name}`;
  const status = shOut('git status --porcelain --untracked-files=no');
  if (status) fail('Hay cambios sin commit. Haz commit o stash antes de iniciar un módulo.');
  sh(`git switch -c ${branch}`);
  let text = updateRow(([mod, , , cierre, t, notas]) => [
    mod,
    '🟨 en curso',
    today(),
    cierre,
    t,
    notas,
  ]);
  text = text.replace(/^\*\*Módulo actual:\*\*.*$/m, `**Módulo actual:** ${MOD}`);
  write(progress, text);
  console.log(
    `✔ ${MOD} iniciado en la rama ${branch}. Siguiente: abre ${MOD} en context/04-plan-modulos.md.`,
  );
} else if (action === 'close') {
  sh('npm run verify');
  const text = updateRow(([mod, , inicio, , , notas]) => [
    mod,
    '✅ cerrado',
    inicio,
    today(),
    tag,
    notas,
  ]);
  write(progress, text);
  sh('git add context/progreso.md');
  sh(`git commit -m "docs(context): cerrar ${tag}"`);
  sh(`git tag -a ${tag} -m "${MOD} cerrado"`);
  console.log(`✔ ${MOD} cerrado y etiquetado como ${tag}. Revisa y haz merge a main.`);
} else {
  fail('Acción desconocida. Usa "start" o "close".');
}
