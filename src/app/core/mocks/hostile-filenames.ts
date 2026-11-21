// Fixtures hostiles de 05-api-contratos.md § Fixtures hostiles (S11). No editar sin
// actualizar ese archivo. Por K20 solo aparecen en archivos en cuarentena o con malware.
export const HOSTILE_FILENAMES: readonly string[] = [
  '<script>alert(1)</script>.jpg',
  '"><img src=x onerror=alert(1)>.png',
  '../../etc/passwd',
  '..\\..\\windows\\system32\\config\\sam',
  'factura.pdf.exe',
  'foto.jpg\u0000.php',
  '=HYPERLINK("http://evil.test","clic").pdf',
  "{{constructor.constructor('alert(1)')()}}.png",
  '\u202Egnp.exe', // override RTL (escapado: un U+202E literal confunde la lectura del código)
  'comprobante_pago_marzo_2026_cliente_final_version_definitiva_revisada_' +
    /* @__PURE__ */ 'x'.repeat(220) +
    '.pdf',
  '😈💣.pdf',
  '   espacios   .jpg',
];

/** Textos hostiles para campos libres que no son nombres (motivos de liberación en auditoría). */
export const HOSTILE_REASONS: readonly string[] = [
  '=HYPERLINK("http://evil.test","clic") revisado con el equipo de pagos',
  '<img src=x onerror=alert(1)> falso positivo confirmado por el proveedor',
  "{{constructor.constructor('alert(1)')()}} liberado tras revisión manual",
  '+cmd|" /C calc"!A0 falso positivo de firma heurística',
];
