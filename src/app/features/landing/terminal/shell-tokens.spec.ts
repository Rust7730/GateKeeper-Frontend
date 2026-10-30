import { buildSession, tokenizeOutput, tokenizeShell } from './shell-tokens';

describe('shell-tokens', () => {
  it('marca comando, banderas, URL, cadenas y variables en Bash', () => {
    const kinds = tokenizeShell('curl -X POST https://x.test/v1 -H "K: $KEY"', true)
      .filter((t) => t.text.trim())
      .map((t) => t.kind);
    expect(kinds).toEqual(['command', 'flag', 'plain', 'url', 'flag', 'string']);
  });

  it('reconoce variables y tablas de PowerShell', () => {
    const tokens = tokenizeShell('-Headers @{ "X" = $env:GATEKEEPER_API_KEY }', false);
    expect(tokens.find((t) => t.kind === 'variable')?.text).toBe('$env:GATEKEEPER_API_KEY');
    expect(tokenizeOutput('--   ------')[0].kind).toBe('muted');
  });

  it('el texto hostil sale como texto, sin perder caracteres', () => {
    const hostile = '"<img src=x onerror=alert(1)>"';
    const joined = tokenizeOutput(hostile)
      .map((t) => t.text)
      .join('');
    expect(joined).toBe(hostile);
  });

  it('arma la sesión con entrada, continuación y salida', () => {
    const lines = buildSession(['a \\', '  -b'], ['HTTP/1.1 202 Accepted']);
    expect(lines.map((l) => l.kind)).toEqual(['input', 'continuation', 'output']);
    expect(lines[2].tokens[0].kind).toBe('status');
  });
});
