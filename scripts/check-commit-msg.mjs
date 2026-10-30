// Rechaza mensajes de commit con atribución a IA o herramientas (regla E6 de context/01-reglas.md).
// Uso (desde .husky/commit-msg): node scripts/check-commit-msg.mjs "$1"
import { read, fail } from './lib.mjs';

const file = process.argv[2];
if (!file) fail('Falta la ruta del mensaje de commit.');

const msg = read(file);
const FORBIDDEN = [
  /^co-authored-by:/im,
  /^claude-session:/im,
  /generated with/i,
  /\bclaude\b/i,
  /\banthropic\b/i,
  /noreply@anthropic\.com/i,
  /🤖/u,
];

const hit = FORBIDDEN.find((re) => re.test(msg));
if (hit) {
  fail(
    'El mensaje de commit contiene atribución a una IA o herramienta (regla E6).\n' +
      `  Patrón: ${hit}\n` +
      '  Quita las líneas Co-Authored-By, Claude-Session, "Generated with" y cualquier mención a la herramienta.',
  );
}
