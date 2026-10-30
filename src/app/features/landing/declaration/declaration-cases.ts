// Casos de ejemplo de la declaración. Todos salen de la matriz de pruebas de la propuesta.
// Son datos ilustrativos: la interfaz los marca como «ejemplo».
// EICAR no se incluye aquí: la firma real lo rechazaría antes de llegar a ClamAV, así que
// no demuestra esa capa con honestidad. Aparece en la matriz de pruebas.

export type Verdict = 'clean' | 'quarantined' | 'rejected';

export interface DeclarationCase {
  id: string;
  label: string;
  declared: { name: string; contentType: string; extension: string };
  inspected: { signature: string; signatureNote: string; realType: string; layer: string };
  verdict: Verdict;
  reason: string;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  clean: 'Limpio',
  quarantined: 'En cuarentena',
  rejected: 'Rechazado',
};

export const DECLARATION_CASES: readonly DeclarationCase[] = [
  {
    id: 'script-as-image',
    label: 'Script con extensión de imagen',
    declared: { name: 'foto.jpg', contentType: 'image/jpeg', extension: '.jpg' },
    inspected: {
      signature: '3C 3F 70 68 70',
      signatureNote: '<?php',
      realType: 'Texto: script PHP',
      layer: 'Validación de firma',
    },
    verdict: 'rejected',
    reason: 'La firma no es de JPEG, PNG ni PDF. La extensión y el Content-Type no cuentan.',
  },
  {
    id: 'double-extension',
    label: 'Doble extensión',
    declared: { name: 'comprobante.jpg.php', contentType: 'image/jpeg', extension: '.php' },
    inspected: {
      signature: '3C 3F 70 68 70',
      signatureNote: '<?php',
      realType: 'Texto: script PHP',
      layer: 'Validación de firma',
    },
    verdict: 'rejected',
    reason: 'El nombre se ignora: se guarda con un UUID y se decide por la firma real.',
  },
  {
    id: 'polyglot',
    label: 'Imagen polyglot',
    declared: { name: 'avatar.png', contentType: 'image/png', extension: '.png' },
    inspected: {
      signature: '89 50 4E 47 0D 0A',
      signatureNote: 'PNG válido con datos tras el final',
      realType: 'image/png',
      layer: 'Reconstrucción de imagen',
    },
    verdict: 'clean',
    reason: 'Se recodifica desde los píxeles. El código incrustado no sobrevive a la copia.',
  },
  {
    id: 'pdf-javascript',
    label: 'PDF con JavaScript',
    declared: { name: 'tarea-final.pdf', contentType: 'application/pdf', extension: '.pdf' },
    inspected: {
      signature: '25 50 44 46 2D',
      signatureNote: '%PDF- con /JavaScript y /OpenAction',
      realType: 'application/pdf',
      layer: 'Saneamiento de PDF',
    },
    verdict: 'clean',
    reason: 'Se entrega una copia sin JavaScript, acciones automáticas ni archivos embebidos.',
  },
  {
    id: 'legit',
    label: 'Foto legítima',
    declared: { name: 'ine-frente.jpg', contentType: 'image/jpeg', extension: '.jpg' },
    inspected: {
      signature: 'FF D8 FF E0',
      signatureNote: 'JPEG',
      realType: 'image/jpeg',
      layer: 'Todas las capas',
    },
    verdict: 'clean',
    reason: 'Se entrega la copia reconstruida, sin metadatos EXIF como la ubicación GPS.',
  },
];
