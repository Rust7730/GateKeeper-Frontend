export type Verdict = 'clean' | 'quarantined' | 'rejected';

export interface DeclarationCase {
  id: string;
  label: string;
  declared: { name: string; contentType: string; extension: string };
  inspected: { signature: string; signatureNote: string; realType: string; layer: string };
  verdict: Verdict;
  reason: string;
}

export const DECLARATION_CASES: readonly DeclarationCase[] = [
  {
    id: 'script-as-image',
    label: 'JPEG falso',
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
    label: 'PNG con código',
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
    label: 'JPEG válido',
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

export const THREATS = [
  {
    code: 'RIESGO 01 · RCE',
    hue: 'cyan',
    title: 'Ejecución remota de código',
    text: 'Un ejecutable que llega al servidor le da al atacante el control del servidor y de sus datos.',
  },
  {
    code: 'RIESGO 02 · XSS / CONTENIDO ACTIVO',
    hue: 'orchid',
    title: 'Código en el navegador de otros',
    text: 'Un SVG o un PDF con contenido activo se ejecuta en el equipo de quien lo abre, incluido tu equipo administrativo.',
  },
  {
    code: 'RIESGO 03 · FUGA DE DATOS',
    hue: 'citron',
    title: 'Metadatos que nadie quiso publicar',
    text: 'Una foto puede llevar la ubicación GPS de quien la tomó.',
  },
] as const;

export const STATIONS = [
  {
    hue: 'cyan',
    icon: 'signature',
    name: 'Firma real',
    tool: 'python-magic',
    does: 'Lee los primeros bytes y decide el tipo. Solo pasan JPEG, PNG y PDF.',
    stops: 'Scripts con extensión de imagen, doble extensión, SVG, ZIP.',
  },
  {
    hue: 'mint',
    icon: 'rebuild',
    name: 'Reconstrucción',
    tool: 'Pillow · pikepdf',
    does: 'Recodifica las imágenes desde los píxeles y quita EXIF. Limpia el PDF de JavaScript, acciones automáticas y archivos embebidos.',
    stops: 'Imágenes polyglot, PDF con contenido activo, bombas de píxeles.',
  },
  {
    hue: 'citron',
    icon: 'scan',
    name: 'ClamAV',
    tool: 'firmas locales',
    does: 'Escanea con firmas que se actualizan solas, dentro de un worker sin acceso a internet.',
    stops: 'Malware conocido y el archivo de prueba EICAR.',
  },
  {
    hue: 'orchid',
    icon: 'reputation',
    name: 'VirusTotal',
    tool: 'API v3',
    does: 'Consulta la reputación del hash SHA-256. El archivo nunca se sube.',
    stops: 'Archivos que otros motores ya reportaron.',
  },
] as const;

const SAMPLE_ID = '3f2b9c1e-7a41-4c0e-9d2b-5e8f1a6c0d47';
const SAMPLE_URL = 'https://gatekeeper.example/v1/files';

export const INTEGRATION_STEPS = [
  {
    id: 'upload',
    method: 'POST',
    route: '/v1/files',
    title: 'Envía el archivo',
    detail: 'La API responde al instante con un ID. El análisis corre en segundo plano.',
    sessions: {
      bash: {
        command: [
          `curl -i -X POST ${SAMPLE_URL} \\`,
          '  -H "X-API-Key: $GATEKEEPER_API_KEY" \\',
          '  -F "file=@foto.jpg"',
        ],
        output: [
          'HTTP/1.1 202 Accepted',
          'content-type: application/json',
          '',
          `{"id":"${SAMPLE_ID}","status":"pending"}`,
        ],
      },
      powershell: {
        command: [
          `Invoke-RestMethod -Method Post -Uri ${SAMPLE_URL} \``,
          '  -Headers @{ "X-API-Key" = $env:GATEKEEPER_API_KEY } `',
          '  -Form @{ file = Get-Item .\\foto.jpg }',
        ],
        output: [
          '',
          'id                                   status',
          '--                                   ------',
          `${SAMPLE_ID} pending`,
          '',
        ],
      },
    },
  },
  {
    id: 'status',
    method: 'GET',
    route: '/v1/files/{id}',
    title: 'Consulta el resultado',
    detail: 'El estado pasa de pendiente a limpio, en cuarentena o rechazado.',
    sessions: {
      bash: {
        command: [
          `curl -s ${SAMPLE_URL}/${SAMPLE_ID} \\`,
          '  -H "X-API-Key: $GATEKEEPER_API_KEY" | jq',
        ],
        output: [
          '{',
          `  "id": "${SAMPLE_ID}",`,
          '  "status": "clean",',
          '  "detectedType": "image/jpeg"',
          '}',
        ],
      },
      powershell: {
        command: [
          `Invoke-RestMethod -Uri ${SAMPLE_URL}/${SAMPLE_ID} \``,
          '  -Headers @{ "X-API-Key" = $env:GATEKEEPER_API_KEY }',
        ],
        output: [
          '',
          'id                                   status detectedType',
          '--                                   ------ ------------',
          `${SAMPLE_ID} clean  image/jpeg`,
          '',
        ],
      },
    },
  },
  {
    id: 'content',
    method: 'GET',
    route: '/v1/files/{id}/content',
    title: 'Descarga la copia reconstruida',
    detail: 'Solo existe cuando el estado es limpio. El original nunca se entrega.',
    sessions: {
      bash: {
        command: [
          `curl -s ${SAMPLE_URL}/${SAMPLE_ID}/content \\`,
          '  -H "X-API-Key: $GATEKEEPER_API_KEY" \\',
          '  -o foto-limpia.jpg -w "%{http_code}\\n"',
        ],
        output: ['200'],
      },
      powershell: {
        command: [
          `Invoke-WebRequest -Uri ${SAMPLE_URL}/${SAMPLE_ID}/content \``,
          '  -Headers @{ "X-API-Key" = $env:GATEKEEPER_API_KEY } `',
          '  -OutFile foto-limpia.jpg',
        ],
        output: [],
      },
    },
  },
] as const;

export const GUARANTEES = [
  {
    hue: 'cyan',
    tag: 'Política de entrega',
    title: 'Ningún original llega a tu app',
    text: 'Solo se puede descargar la versión reconstruida, y solo cuando el análisis terminó en limpio.',
  },
  {
    hue: 'mint',
    tag: 'Aislamiento de red',
    title: 'El worker no tiene internet',
    text: 'El único componente que abre archivos vive aislado, sin usuario root y con límites de CPU y memoria. Un archivo que explotara una librería no podría comunicarse hacia afuera.',
  },
  {
    hue: 'citron',
    tag: 'Privacidad por diseño',
    title: 'Solo el hash sale a VirusTotal',
    text: 'La consulta de reputación envía el SHA-256. El contenido del archivo nunca deja tu infraestructura.',
  },
  {
    hue: 'orchid',
    tag: 'Saneamiento CDR',
    title: 'Sin metadatos ocultos',
    text: 'La reconstrucción elimina EXIF, incluida la ubicación GPS que suelen llevar las fotos.',
  },
  {
    hue: 'amber',
    tag: 'Auditoría RBAC',
    title: 'Cada liberación deja rastro',
    text: 'Sacar un archivo de cuarentena es una decisión de administrador, con motivo obligatorio, usuario y fecha en la bitácora.',
  },
] as const;

export const VECTOR_GROUPS = [
  { id: 'all', label: 'Todos (15)' },
  { id: 'signature', label: 'Firma y lista blanca' },
  { id: 'cdr', label: 'Reconstrucción y límites' },
  { id: 'malware', label: 'Antimalware' },
  { id: 'api', label: 'API y aislamiento' },
] as const;

export const VECTORS = [
  { attack: 'Script con extensión de imagen', layer: 'Validación de firma', group: 'signature' },
  { attack: 'Doble extensión', layer: 'Validación de firma', group: 'signature' },
  { attack: 'Nombre con ../ o byte nulo', layer: 'Almacenamiento con UUID', group: 'api' },
  { attack: 'Imagen polyglot', layer: 'Reconstrucción de imagen', group: 'cdr' },
  {
    attack: 'PDF con JavaScript o acciones automáticas',
    layer: 'Saneamiento de PDF',
    group: 'cdr',
  },
  { attack: 'PDF cifrado', layer: 'Rechazo por política', group: 'cdr' },
  { attack: 'SVG', layer: 'Lista blanca', group: 'signature' },
  { attack: 'ZIP', layer: 'Lista blanca', group: 'signature' },
  { attack: 'Bomba de píxeles', layer: 'Límite de Pillow', group: 'cdr' },
  { attack: 'Archivo de 500 MB', layer: 'Límite de Nginx', group: 'api' },
  { attack: 'Archivo de prueba EICAR', layer: 'ClamAV y VirusTotal', group: 'malware' },
  { attack: 'Nombre de archivo con HTML/JS', layer: 'Escape en el dashboard', group: 'api' },
  {
    attack: 'Acceso a archivo de otra aplicación (IDOR)',
    layer: 'Verificación de propiedad',
    group: 'api',
  },
  { attack: '200 subidas en un minuto', layer: 'Rate limiting', group: 'api' },
  { attack: 'Descarga de un archivo pendiente', layer: 'Máquina de estados', group: 'api' },
] as const;

export const LIMITS = [
  'Solo acepta JPEG, PNG y PDF. SVG, comprimidos y documentos de Office se rechazan por diseño.',
  'El análisis por firmas puede pasar por alto malware nuevo. La reconstrucción ayuda a eliminar contenido activo de los formatos admitidos.',
  'Limpiar el PDF elimina sus elementos activos, pero no protege contra fallas del lector de PDF de quien lo abre.',
  'No analiza el significado del contenido: un PDF de phishing con texto engañoso puede quedar como limpio.',
  'Los originales en cuarentena se eliminan a los 30 días.',
] as const;
