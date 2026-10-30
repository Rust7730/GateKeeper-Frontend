// Busca en src/ los patrones prohibidos por context/01-reglas.md § B.
// Uso: node scripts/check-security.mjs
import { readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { ROOT, p, read, fail } from './lib.mjs';

const RULES = [
  {
    id: 'S1',
    re: /\[innerHTML\]|\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML/,
    msg: 'HTML sin sanitizar: usa interpolación {{ }}',
  },
  { id: 'S1', re: /bypassSecurityTrust\w*/, msg: 'bypassSecurityTrust* está prohibido' },
  { id: 'S1', re: /document\.write\s*\(/, msg: 'document.write está prohibido' },
  {
    id: 'S2',
    re: /(localStorage|sessionStorage)\.setItem\(\s*['"`][^'"`]*(token|jwt|auth|refresh|secret)/i,
    msg: 'Tokens o secretos en storage del navegador',
  },
  {
    id: 'S6',
    re: /new\s+EventSource\s*\(/,
    msg: 'EventSource no permite header Authorization: usa fetch-event-source',
  },
  { id: 'S6', re: /[?&](access_?token|token|jwt)=/i, msg: 'Token en la URL' },
  { id: 'S10', re: /[?&](totp|otp|code|reason|motivo)=/i, msg: 'Dato sensible en query string' },
];

const EXT = new Set(['.ts', '.html']);
const findings = [];

function walk(dir) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full);
    else if (EXT.has(extname(e)) && !e.endsWith('.spec.ts')) scan(full);
  }
}

function scan(file) {
  const lines = read(file).split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('security-check: allow')) return; // excepción explícita y revisable
    for (const r of RULES) {
      if (r.re.test(line)) {
        findings.push(`${relative(ROOT, file)}:${i + 1}  [${r.id}] ${r.msg}`);
      }
    }
  });
}

walk(p('src'));

if (findings.length) {
  fail(
    `Patrones prohibidos encontrados (${findings.length}):\n  ${findings.join('\n  ')}\n\n` +
      `Ver context/01-reglas.md § B. Una excepción justificada lleva el comentario "security-check: allow" y una entrada en 07-errores.md o 02 § 5.`,
  );
}
console.log('✔ Sin patrones de seguridad prohibidos');
