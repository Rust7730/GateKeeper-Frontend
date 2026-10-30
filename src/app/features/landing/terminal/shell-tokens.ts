// Resaltado de sintaxis para las terminales de la landing.
// Produce tokens que la plantilla pinta con interpolación: nunca HTML (regla S1).

export type Shell = 'bash' | 'powershell';

export type TokenKind =
  | 'command'
  | 'flag'
  | 'string'
  | 'variable'
  | 'url'
  | 'operator'
  | 'key'
  | 'status'
  | 'number'
  | 'literal'
  | 'muted'
  | 'plain';

export interface Token {
  kind: TokenKind;
  text: string;
}

export interface TermLine {
  /** `input` lleva prompt; `continuation` lleva el prompt secundario del shell. */
  kind: 'input' | 'continuation' | 'output';
  tokens: Token[];
}

const SHELL_PATTERN =
  /(\s+)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$env:\w+|\$\{?\w+\}?)|(@\{|\}|=)|(https?:\/\/\S+)|((?:^|(?<=\s))-{1,2}[A-Za-z][\w-]*)|(\||\\$|`$)|([^\s"'|=}]+)/gy;

/** Tokeniza una línea de comando. `isStart` indica si la primera palabra es el comando. */
export function tokenizeShell(line: string, isStart: boolean): Token[] {
  const tokens: Token[] = [];
  let expectCommand = isStart;
  SHELL_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SHELL_PATTERN.exec(line)) !== null) {
    const [text, space, str, variable, op, url, flag, pipe, word] = m;
    if (space) tokens.push({ kind: 'plain', text });
    else if (str) tokens.push({ kind: 'string', text });
    else if (variable) tokens.push({ kind: 'variable', text });
    else if (op) tokens.push({ kind: 'operator', text });
    else if (url) tokens.push({ kind: 'url', text });
    else if (flag) tokens.push({ kind: 'flag', text });
    else if (pipe) {
      tokens.push({ kind: 'operator', text });
      expectCommand = text === '|';
      continue;
    } else if (word) {
      tokens.push({ kind: expectCommand ? 'command' : 'plain', text });
      expectCommand = false;
      continue;
    }
    if (!space) expectCommand = false;
  }
  return tokens;
}

const OUTPUT_PATTERN =
  /(\s+)|(HTTP\/[\d.]+\s+\d{3}\s+[\w ]+$)|("(?:[^"\\]|\\.)*"(?=\s*:))|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|(^[\w-]+:(?=\s))|(^-{2,}(?:\s+-{2,})*$)|([{}[\],:])|([^\s"{}[\],:]+)/gy;

/** Tokeniza una línea de salida: estado HTTP, encabezados, JSON y tablas de PowerShell. */
export function tokenizeOutput(line: string): Token[] {
  const tokens: Token[] = [];
  OUTPUT_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = OUTPUT_PATTERN.exec(line)) !== null) {
    const [text, space, status, key, str, num, literal, header, rule, punct] = m;
    if (space) tokens.push({ kind: 'plain', text });
    else if (status) tokens.push({ kind: 'status', text });
    else if (key || header) tokens.push({ kind: 'key', text });
    else if (str) tokens.push({ kind: 'string', text });
    else if (num) tokens.push({ kind: 'number', text });
    else if (literal) tokens.push({ kind: 'literal', text });
    else if (rule || punct) tokens.push({ kind: 'muted', text });
    else tokens.push({ kind: 'plain', text });
  }
  return tokens;
}

/** Convierte un comando (varias líneas) y su salida en líneas de terminal. */
export function buildSession(command: readonly string[], output: readonly string[]): TermLine[] {
  const lines: TermLine[] = command.map((text, i) => ({
    kind: i === 0 ? 'input' : 'continuation',
    tokens: tokenizeShell(text, i === 0),
  }));
  for (const text of output) lines.push({ kind: 'output', tokens: tokenizeOutput(text) });
  return lines;
}
