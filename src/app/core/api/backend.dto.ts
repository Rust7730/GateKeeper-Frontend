// Tipos de transporte (DTO): la forma en que responde el backend.
// Los valores de estado, capa, veredicto y motivo son los reales de api/db/modelos.py y
// api/app/cdr_*.py. Las rutas /v1/admin/* y /v1/auth/* aún no existen (fase F5): sus
// nombres de campo siguen el estilo del backend y son provisionales.
// El adaptador (backend-adapter.ts) nunca confía en estos tipos: lee la respuesta como
// `unknown` y valida cada campo. Los tipos sirven para que el mock responda bien.

export type EstadoArchivoDto = 'pendiente' | 'limpio' | 'en_cuarentena' | 'rechazado' | 'error';
export type CapaDto = 'firma' | 'cdr' | 'clamav' | 'virustotal';
export type VeredictoDto = 'limpio' | 'malicioso' | 'rechazado' | 'error' | 'no_evaluada';

/** `detalle.motivo` de un resultado. `cifrado` y `pdf_cifrado` significan lo mismo. */
export type MotivoDto =
  | 'tipo_no_permitido'
  | 'pixeles'
  | 'imagen_invalida'
  | 'paginas'
  | 'cifrado'
  | 'pdf_cifrado'
  | 'pdf_invalido'
  | 'descompresion'
  | 'salida_grande'
  | 'escaneos'
  | 'flujo_invalido'
  | 'timeout'
  | 'interno';

export interface DetalleDto {
  /** CDR: código del rechazo o error; `ok` cuando el veredicto es limpio. */
  motivo?: MotivoDto | 'ok';
  /** Firma: tipo real detectado (libmagic). El front no lo usa: toma `tipo_detectado`. */
  tipo?: string;
  /** ClamAV: nombre de la firma detectada. Provisional (F3). */
  firma?: string;
  /** VirusTotal: motores que marcan malicioso y total. Provisional (F3). */
  positivos?: number;
  total?: number;
}

export interface ResultadoAnalisisDto {
  capa: CapaDto;
  veredicto: VeredictoDto;
  detalle: DetalleDto;
  duracion_ms: number | null;
}

/**
 * Archivo visto desde el dashboard. Por K20, `nombre_original`, `sha256`,
 * `cuarentena_expira_en` y `resultados` solo vienen de archivos en cuarentena o con
 * malware detectado por alguna capa.
 */
export interface ArchivoDto {
  id: string;
  aplicacion_id: string;
  aplicacion_nombre: string;
  estado: EstadoArchivoDto;
  tipo_detectado: string | null;
  tamano_bytes: number;
  creado_en: string;
  analizado_en: string | null;
  nombre_original?: string;
  sha256?: string;
  cuarentena_expira_en?: string | null;
  resultados?: ResultadoAnalisisDto[];
}

export interface PaginaDto<T> {
  elementos: T[];
  pagina: number;
  tamano_pagina: number;
  total: number;
}

export interface LiberacionDto {
  motivo: string;
}

export type PeriodoDto = '24h' | '7d' | '30d';

export interface MetricasDto {
  periodo: PeriodoDto;
  totales: Record<EstadoArchivoDto | 'procesados', number>;
  amenazas_por_dia: { fecha: string; bloqueados: number; en_cuarentena: number }[];
  por_capa: { capa: CapaDto; motivo: MotivoDto | null; total: number }[];
  top_apps: { aplicacion_id: string; aplicacion_nombre: string; bloqueados: number }[];
}

export type RolDto = 'analista' | 'admin';
export type AccionAuditoriaDto =
  | 'inicio_sesion'
  | 'cierre_sesion'
  | 'liberar_archivo'
  | 'crear_api_key'
  | 'revocar_api_key'
  | 'inicio_fallido';

export interface AuditoriaDto {
  id: string;
  actor: { id: string; correo: string; rol: RolDto };
  accion: AccionAuditoriaDto;
  recurso: string | null;
  motivo: string | null;
  ip: string;
  en: string;
}

export type SeveridadDto = 'baja' | 'media' | 'alta' | 'critica';
export type TipoEventoDto =
  'malware_detectado' | 'rechazo_politica' | 'limite_tasa' | 'archivo_liberado' | 'inicio_fallido';

/** `nombre_archivo` solo viaja en eventos de malware o liberación (K20). */
export interface EventoDto {
  id: string;
  severidad: SeveridadDto;
  tipo: TipoEventoDto;
  archivo_id: string | null;
  aplicacion_nombre: string | null;
  nombre_archivo?: string;
  en: string;
}

export interface ApiKeyDto {
  id: string;
  aplicacion_id: string;
  aplicacion_nombre: string;
  prefijo: string;
  creada_en: string;
  ultimo_uso_en: string | null;
  revocada_en: string | null;
}

export interface ApiKeyCreadaDto extends ApiKeyDto {
  secreto: string;
}

export interface NuevaApiKeyDto {
  aplicacion_id: string;
}

/** Cuerpo de error de FastAPI: `detail` es la frase HTTP estándar (K29). */
export interface ErrorDto {
  detail: string;
}

// ---------------------------------------------------------------------------
// Autenticación (F5.01–F5.04, provisional: la API aún no la implementa)
// ---------------------------------------------------------------------------

/** POST /v1/auth/login */
export interface InicioSesionDto {
  correo: string;
  contrasena: string;
}

/** Paso 1 de un usuario con TOTP obligatorio (admin): todavía no hay sesión. */
export interface DesafioTotpDto {
  mfa_requerido: true;
  desafio_id: string;
}

export interface UsuarioDto {
  id: string;
  correo: string;
  rol: RolDto;
  mfa_activo: boolean;
}

/** Sesión abierta: login sin MFA, TOTP correcto o refresh. El refresh va en cookie HttpOnly. */
export interface SesionDto {
  token_acceso: string;
  expira_en: number; // segundos
  usuario: UsuarioDto;
}

/** POST /v1/auth/totp. El código va en el cuerpo, nunca en la URL (S10). */
export interface VerificacionTotpDto {
  desafio_id: string;
  codigo: string;
}
