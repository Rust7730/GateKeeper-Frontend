// Archivos de ejemplo del escáner de la cabecera. Los bytes son reales para cada tipo de archivo:
// el volcado hexadecimal se calcula a partir de su contenido, no se dibuja a mano.

export type ScanVerdict = 'clean' | 'rejected';

export interface HexRow {
  offset: string;
  hex: string;
  ascii: string;
}

export interface Scan {
  id: string;
  name: string;
  declared: string;
  finding: string;
  layer: string;
  verdict: ScanVerdict;
  rows: HexRow[];
}

const BYTES_PER_ROW = 8;

function hexDump(bytes: readonly number[]): HexRow[] {
  const rows: HexRow[] = [];
  for (let i = 0; i < bytes.length; i += BYTES_PER_ROW) {
    const chunk = bytes.slice(i, i + BYTES_PER_ROW);
    rows.push({
      offset: i.toString(16).padStart(4, '0'),
      hex: chunk.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
      ascii: chunk.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.')).join(''),
    });
  }
  return rows;
}

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

export const HERO_SCANS: readonly Scan[] = [
  {
    id: 'script',
    name: 'foto.jpg',
    declared: 'image/jpeg',
    finding: 'Script PHP, no una imagen',
    layer: 'Validación de firma',
    verdict: 'rejected',
    rows: hexDump(ascii("<?php system($_GET['c']); ?>\n").slice(0, 32)),
  },
  {
    id: 'polyglot',
    name: 'avatar.png',
    declared: 'image/png',
    finding: 'PNG con código tras el final',
    layer: 'Reconstrucción de imagen',
    verdict: 'clean',
    rows: hexDump([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x08, 0x06, 0x00, 0x00, 0x00, 0xf4,
      0x78, 0xd4,
    ]),
  },
  {
    id: 'pdf',
    name: 'tarea-final.pdf',
    declared: 'application/pdf',
    finding: 'PDF con /OpenAction y JavaScript',
    layer: 'Saneamiento de PDF',
    verdict: 'clean',
    rows: hexDump(ascii('%PDF-1.7\n1 0 obj << /OpenAction ').slice(0, 32)),
  },
];

export const SCAN_VERDICT_LABEL: Record<ScanVerdict, string> = {
  clean: 'Reconstruido',
  rejected: 'Rechazado',
};
