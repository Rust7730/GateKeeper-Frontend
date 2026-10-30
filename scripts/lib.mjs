// Utilidades compartidas por los scripts del proyecto. Sin dependencias externas.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const p = (...parts) => join(ROOT, ...parts);

export const read = (file) => readFileSync(file, 'utf8');
export const write = (file, text) => writeFileSync(file, text, 'utf8');
export const exists = existsSync;

export const today = () => new Date().toISOString().slice(0, 10);

export function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

export function shOut(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

export function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

export function normalizeModule(arg) {
  const m = /^m?(\d{1,2})$/i.exec(arg ?? '');
  if (!m) fail(`Módulo inválido: "${arg}". Usa el formato m01, m07…`);
  return `M${m[1].padStart(2, '0')}`;
}
