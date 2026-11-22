// Respuestas posibles de cada endpoint de la consola, tomadas del backend (GateKeeper-API).
// Los errores del backend responden { "detail": "<frase HTTP>" }; los de validación (422)
// los genera FastAPI con la lista de campos inválidos.

export interface ExampleResponse {
  readonly code: number;
  readonly text: string;
  /** Cuándo ocurre, en español y en inglés. */
  readonly when: string;
  readonly whenEn: string;
  /** Cabecera relevante de la respuesta, si la hay (p. ej. Retry-After). */
  readonly header?: string;
  /** Cuerpo JSON, texto o null si la respuesta no trae cuerpo. */
  readonly body: unknown;
}

const detail = (text: string) => ({ detail: text });
const FILE_ID = '3c7b078b-47f5-475e-a6f5-d0fc32c30b16';
const APP_ID = 'edece295-ab4d-4502-a7ef-c50ebcb82310';

const UNAUTHORIZED_KEY: ExampleResponse = {
  code: 401,
  text: 'Unauthorized',
  when: 'Falta la API key, no es válida o fue revocada.',
  whenEn: 'The API key is missing, invalid or revoked.',
  header: 'WWW-Authenticate: Bearer',
  body: detail('Unauthorized'),
};

const UNAUTHORIZED_SESSION: ExampleResponse = {
  code: 401,
  text: 'Unauthorized',
  when: 'No hay sesión o el token de acceso expiró (dura 15 minutos).',
  whenEn: 'There is no session or the access token expired (it lasts 15 minutes).',
  body: detail('Unauthorized'),
};

const FORBIDDEN_ADMIN: ExampleResponse = {
  code: 403,
  text: 'Forbidden',
  when: 'Tu sesión es de Analista: esta acción es solo para Administradores.',
  whenEn: 'Your session is an Analyst one: this action is for Administrators only.',
  body: detail('Forbidden'),
};

const RATE_LIMITED: ExampleResponse = {
  code: 429,
  text: 'Too Many Requests',
  when: 'Superaste el límite de 120 peticiones por minuto de tu API key (ráfaga de 20). Espera los segundos de Retry-After.',
  whenEn:
    'You exceeded your API key limit of 120 requests per minute (burst of 20). Wait the seconds in Retry-After.',
  header: 'Retry-After: 12',
  body: detail('Too Many Requests'),
};

const REDIS_DOWN: ExampleResponse = {
  code: 503,
  text: 'Service Unavailable',
  when: 'El contador del límite de peticiones no responde; la API falla cerrada y no deja pasar la petición.',
  whenEn: 'The rate-limit counter is not responding; the API fails closed and rejects the request.',
  body: detail('Service Unavailable'),
};

const INVALID_UUID: ExampleResponse = {
  code: 422,
  text: 'Unprocessable Entity',
  when: 'El :id de la URL no es un UUID.',
  whenEn: 'The :id in the URL is not a UUID.',
  body: {
    detail: [
      {
        type: 'uuid_parsing',
        loc: ['path', 'archivo_id'],
        msg: 'Input should be a valid UUID, invalid character: expected an optional prefix of `urn:uuid:` followed by [0-9a-fA-F-], found `x` at 1',
      },
    ],
  },
};

const NOT_FOUND_FILE: ExampleResponse = {
  code: 404,
  text: 'Not Found',
  when: 'El archivo no existe o pertenece a otra aplicación (por seguridad, la respuesta es la misma).',
  whenEn:
    'The file does not exist or belongs to another application (for security, the response is the same).',
  body: detail('Not Found'),
};

const ADMIN_FILE = {
  id: FILE_ID,
  aplicacion_id: APP_ID,
  aplicacion_nombre: 'Portal Escolar',
  estado: 'en_cuarentena',
  tipo_detectado: 'application/pdf',
  tamano_bytes: 138452,
  creado_en: '2026-11-21T18:12:04Z',
  analizado_en: '2026-11-21T18:12:09Z',
  nombre_original: 'tarea-final.pdf',
  sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  cuarentena_expira_en: '2026-12-21T18:12:09Z',
  resultados: [
    { capa: 'firma', veredicto: 'limpio', detalle: { tipo: 'application/pdf' }, duracion_ms: 3 },
    {
      capa: 'clamav',
      veredicto: 'malicioso',
      detalle: { firma: 'Pdf.Exploit.CVE_2018_4993-1' },
      duracion_ms: 412,
    },
  ],
};

export const ENDPOINT_RESPONSES: Readonly<Record<string, readonly ExampleResponse[]>> = {
  'files-upload': [
    {
      code: 202,
      text: 'Accepted',
      when: 'El archivo se recibió y el análisis sigue en segundo plano. Guarda el id para consultarlo.',
      whenEn:
        'The file was received and analysis continues in the background. Keep the id to check it.',
      body: { id: FILE_ID, estado: 'pendiente' },
    },
    {
      code: 400,
      text: 'Bad Request',
      when: 'El multipart es inválido, no trae la parte «file» o el archivo está vacío.',
      whenEn: 'The multipart body is invalid, has no “file” part or the file is empty.',
      body: detail('Bad Request'),
    },
    UNAUTHORIZED_KEY,
    {
      code: 408,
      text: 'Request Timeout',
      when: 'La subida tardó más de 60 segundos.',
      whenEn: 'The upload took longer than 60 seconds.',
      body: detail('Request Timeout'),
    },
    {
      code: 413,
      text: 'Request Entity Too Large',
      when: 'El archivo supera 10 MiB.',
      whenEn: 'The file is larger than 10 MiB.',
      body: detail('Request Entity Too Large'),
    },
    {
      code: 415,
      text: 'Unsupported Media Type',
      when: 'La petición no es multipart/form-data.',
      whenEn: 'The request is not multipart/form-data.',
      body: detail('Unsupported Media Type'),
    },
    RATE_LIMITED,
    {
      code: 429,
      text: 'Too Many Requests',
      when: 'Tu aplicación ya tiene 20 archivos en análisis (pendiente). Reintenta cuando termine alguno; esta respuesta no trae Retry-After.',
      whenEn:
        'Your application already has 20 files being analysed (pending). Retry when one finishes; this response has no Retry-After.',
      body: detail('Too Many Requests'),
    },
    REDIS_DOWN,
  ],
  'files-status': [
    {
      code: 200,
      text: 'OK',
      when: 'Devuelve el estado actual. Si sigue en «pendiente», vuelve a consultar en unos segundos.',
      whenEn:
        'Returns the current status. If it is still “pendiente”, check again in a few seconds.',
      body: {
        id: FILE_ID,
        estado: 'limpio',
        tipo_detectado: 'image/jpeg',
        tamano_bytes: 48213,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        creado_en: '2026-11-21T18:12:04Z',
        analizado_en: '2026-11-21T18:12:06Z',
      },
    },
    UNAUTHORIZED_KEY,
    NOT_FOUND_FILE,
    INVALID_UUID,
    RATE_LIMITED,
    REDIS_DOWN,
  ],
  'files-download': [
    {
      code: 200,
      text: 'OK',
      when: 'El estado es «limpio»: llega el binario reconstruido como adjunto. Nunca se entrega el original.',
      whenEn:
        'The status is “limpio”: the reconstructed binary arrives as an attachment. The original is never returned.',
      header: 'Content-Disposition: attachment; filename="3c7b078b.jpg"',
      body: '(contenido binario de la copia reconstruida)',
    },
    UNAUTHORIZED_KEY,
    NOT_FOUND_FILE,
    {
      code: 409,
      text: 'Conflict',
      when: 'El archivo no está «limpio» (sigue pendiente, se rechazó, está en cuarentena o falló).',
      whenEn: 'The file is not “limpio” (still pending, rejected, quarantined or failed).',
      body: detail('Conflict'),
    },
    INVALID_UUID,
    RATE_LIMITED,
    {
      code: 500,
      text: 'Internal Server Error',
      when: 'El archivo quedó «limpio» pero falta su copia reconstruida. La API falla cerrada y no entrega el original.',
      whenEn:
        'The file is “limpio” but its reconstructed copy is missing. The API fails closed and never returns the original.',
      body: detail('Internal Server Error'),
    },
    REDIS_DOWN,
  ],
  'quarantine-list': [
    {
      code: 200,
      text: 'OK',
      when: 'Página de archivos en cuarentena con el detalle completo de cada uno.',
      whenEn: 'Page of quarantined files with the full detail of each one.',
      body: { elementos: [ADMIN_FILE], pagina: 1, tamano_pagina: 25, total: 1 },
    },
    {
      code: 400,
      text: 'Bad Request',
      when: 'Algún filtro tiene un valor que no existe (por ejemplo, un estado mal escrito).',
      whenEn: 'A filter has a value that does not exist (for example, a misspelt status).',
      body: detail('Bad Request'),
    },
    UNAUTHORIZED_SESSION,
    {
      code: 422,
      text: 'Unprocessable Entity',
      when: 'La paginación está fuera de rango (pagina ≥ 1, tamano_pagina entre 1 y 100).',
      whenEn: 'Pagination is out of range (pagina ≥ 1, tamano_pagina between 1 and 100).',
      body: {
        detail: [
          {
            type: 'less_than_equal',
            loc: ['query', 'tamano_pagina'],
            msg: 'Input should be less than or equal to 100',
          },
        ],
      },
    },
  ],
  'quarantine-release': [
    {
      code: 202,
      text: 'Accepted',
      when: 'El motivo quedó en la bitácora y el archivo vuelve al CDR. Seguirá en cuarentena hasta que la reconstrucción termine.',
      whenEn:
        'The reason was written to the audit log and the file goes back to CDR. It stays quarantined until reconstruction finishes.',
      body: { id: FILE_ID, estado: 'en_cuarentena', reencolado: true },
    },
    {
      code: 400,
      text: 'Bad Request',
      when: 'El motivo, sin espacios al inicio ni al final, no tiene entre 20 y 500 caracteres o trae caracteres de control.',
      whenEn:
        'The reason, without leading or trailing spaces, is not 20 to 500 characters long or contains control characters.',
      body: detail('Bad Request'),
    },
    UNAUTHORIZED_SESSION,
    FORBIDDEN_ADMIN,
    NOT_FOUND_FILE,
    {
      code: 409,
      text: 'Conflict',
      when: 'El archivo ya no está en cuarentena.',
      whenEn: 'The file is no longer quarantined.',
      body: detail('Conflict'),
    },
    {
      code: 422,
      text: 'Unprocessable Entity',
      when: 'Falta el campo «motivo», el cuerpo no es JSON o el :id no es un UUID.',
      whenEn: 'The “motivo” field is missing, the body is not JSON or the :id is not a UUID.',
      body: {
        detail: [
          {
            type: 'string_too_short',
            loc: ['body', 'motivo'],
            msg: 'String should have at least 20 characters',
          },
        ],
      },
    },
    {
      code: 503,
      text: 'Service Unavailable',
      when: 'La cola de análisis no está disponible; el archivo no se tocó. Reintenta más tarde.',
      whenEn: 'The analysis queue is unavailable; the file was not changed. Retry later.',
      body: detail('Service Unavailable'),
    },
  ],
  'admin-files-list': [
    {
      code: 200,
      text: 'OK',
      when: 'Página de archivos. Solo los que están en cuarentena o tienen malware detectado traen nombre, SHA-256 y capas (K20).',
      whenEn:
        'Page of files. Only quarantined files or files with detected malware include name, SHA-256 and layers (K20).',
      body: {
        elementos: [
          {
            id: '8a1f4c2e-0b7d-4e55-9a31-6c2f1d0e9b44',
            aplicacion_id: APP_ID,
            aplicacion_nombre: 'Portal Escolar',
            estado: 'limpio',
            tipo_detectado: 'image/png',
            tamano_bytes: 20480,
            creado_en: '2026-11-21T17:40:11Z',
            analizado_en: '2026-11-21T17:40:12Z',
          },
          ADMIN_FILE,
        ],
        pagina: 1,
        tamano_pagina: 25,
        total: 2,
      },
    },
    {
      code: 400,
      text: 'Bad Request',
      when: 'Algún filtro tiene un valor que no existe o la búsqueda trae caracteres no permitidos.',
      whenEn:
        'A filter has a value that does not exist or the search contains forbidden characters.',
      body: detail('Bad Request'),
    },
    UNAUTHORIZED_SESSION,
    {
      code: 422,
      text: 'Unprocessable Entity',
      when: 'La paginación o un filtro de fecha tienen un formato inválido.',
      whenEn: 'Pagination or a date filter has an invalid format.',
      body: {
        detail: [
          { type: 'int_parsing', loc: ['query', 'pagina'], msg: 'Input should be a valid integer' },
        ],
      },
    },
  ],
  'admin-metrics': [
    {
      code: 200,
      text: 'OK',
      when: 'Totales por estado, amenazas por día (en UTC), bloqueos por capa y las aplicaciones con más bloqueos.',
      whenEn:
        'Totals by status, threats per day (in UTC), blocks by layer and the applications with the most blocks.',
      body: {
        periodo: '7d',
        totales: {
          pendiente: 0,
          limpio: 42,
          en_cuarentena: 1,
          rechazado: 3,
          error: 1,
          procesados: 47,
        },
        amenazas_por_dia: [{ fecha: '2026-11-20', bloqueados: 2, en_cuarentena: 1 }],
        por_capa: [{ capa: 'firma', motivo: 'tipo_no_permitido', total: 3 }],
        top_apps: [{ aplicacion_id: APP_ID, aplicacion_nombre: 'Portal Escolar', bloqueados: 2 }],
      },
    },
    UNAUTHORIZED_SESSION,
    {
      code: 422,
      text: 'Unprocessable Entity',
      when: 'El periodo no es 24h, 7d ni 30d.',
      whenEn: 'The period is not 24h, 7d or 30d.',
      body: {
        detail: [
          {
            type: 'literal_error',
            loc: ['query', 'periodo'],
            msg: "Input should be '24h', '7d' or '30d'",
          },
        ],
      },
    },
  ],
  'admin-api-keys': [
    {
      code: 200,
      text: 'OK',
      when: 'Lista de claves con su prefijo y estado. El secreto nunca vuelve a mostrarse.',
      whenEn: 'List of keys with their prefix and status. The secret is never shown again.',
      body: [
        {
          id: '504c98ca-9730-44db-8922-0daed4ea2571',
          aplicacion_id: APP_ID,
          aplicacion_nombre: 'Portal Escolar',
          prefijo: 'gk_0ef1493ec94b',
          creada_en: '2026-09-07T22:30:00Z',
          ultimo_uso_en: null,
          revocada_en: null,
        },
      ],
    },
    UNAUTHORIZED_SESSION,
    FORBIDDEN_ADMIN,
  ],
  'system-health': [
    {
      code: 200,
      text: 'OK',
      when: 'El proceso de la API responde. No revisa la base de datos ni Redis.',
      whenEn: 'The API process is responding. It does not check the database or Redis.',
      body: { estado: 'ok' },
    },
    {
      code: 502,
      text: 'Bad Gateway',
      when: 'Nginx no logra hablar con la API (el contenedor está detenido o reiniciándose).',
      whenEn: 'Nginx cannot reach the API (the container is stopped or restarting).',
      body: '(página de error de nginx)',
    },
  ],
};
