export const WORKSPACE_NAV = [
  { path: '/app', label: 'Resumen', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { path: '/app/archivos', label: 'Archivos', icon: 'M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6' },
  {
    path: '/app/cuarentena',
    label: 'Cuarentena',
    icon: 'M12 3l8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6zM12 8v5m0 3h.01',
  },
  { path: '/app/alertas', label: 'Alertas', icon: 'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 20h4' },
  { path: '/app/auditoria', label: 'Auditoría', icon: 'M6 4h12v16H6zM9 9h6m-6 4h6m-6 4h4' },
  {
    path: '/app/claves',
    label: 'Obtener clave API',
    icon: 'M14 9a4 4 0 1 0-6 3.5L3 18v3h3l2-2v-2h2l2-2m2-6h.01',
  },
  { path: '/app/explorador', label: 'Consola de pruebas', icon: 'M9 6l-6 6 6 6m6-12 6 6-6 6' },
  {
    path: '/app/documentacion',
    label: 'Documentación',
    icon: 'M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4zM12 7v14',
  },
] as const;

export const WORKSPACE_PAGES = {
  login: { title: 'Acceso al dashboard', description: 'Abre la demostración de Gatekeeper.' },
  summary: {
    title: 'Resumen',
    description: 'Supervisa la inspección de archivos y las amenazas detectadas.',
  },
  files: {
    title: 'Archivos',
    description: 'Consulta el estado y el resultado de cada inspección.',
  },
  detail: {
    title: 'Detalle del archivo',
    description: 'Consulta el resultado y la trazabilidad de la inspección.',
  },
  quarantine: {
    title: 'Cuarentena',
    description: 'Revisa archivos aislados y sus motivos de retención.',
  },
  alerts: { title: 'Alertas', description: 'Revisa las detecciones y los rechazos recientes.' },
  audit: {
    title: 'Auditoría',
    description: 'Consulta el registro de acciones sobre archivos y claves.',
  },
  keys: {
    title: 'Obtener clave API',
    description: 'Genera una clave local para practicar la autenticación en la consola de pruebas.',
  },
  explorer: {
    title: 'Consola de pruebas',
    description: 'Prepara una solicitud y revisa la respuesta en un entorno simulado.',
  },
  docs: {
    title: 'Documentación',
    description: 'Integra la inspección de archivos en tu aplicación.',
  },
  missing: {
    title: 'Página no encontrada',
    description: 'La dirección solicitada ya no existe o no está disponible.',
  },
} as const;

export type WorkspaceView = keyof typeof WORKSPACE_PAGES;
export type FileStatus = 'Limpio' | 'En cuarentena' | 'Rechazado' | 'Pendiente' | 'Liberado';

export interface InspectedFile {
  id: string;
  name: string;
  type: string;
  status: FileStatus;
  size: string;
  time: string;
  reason: string;
}

export const SAMPLE_FILES: InspectedFile[] = [
  {
    id: 'gk-1048',
    name: 'contrato-firmado.pdf',
    type: 'application/pdf',
    status: 'Limpio',
    size: '1.8 MB',
    time: '14:42',
    reason: 'Se reconstruyó una copia sin JavaScript ni acciones automáticas.',
  },
  {
    id: 'gk-1047',
    name: 'eicar.com',
    type: 'text/plain',
    status: 'En cuarentena',
    size: '68 B',
    time: '14:38',
    reason: 'ClamAV detectó la firma de prueba EICAR.',
  },
  {
    id: 'gk-1046',
    name: 'factura-marzo.pdf.exe',
    type: 'application/x-msdownload',
    status: 'Rechazado',
    size: '426 KB',
    time: '14:33',
    reason:
      'La firma real corresponde a un ejecutable. El formato está fuera de la lista permitida.',
  },
  {
    id: 'gk-1045',
    name: 'avatar-cliente.png',
    type: 'image/png',
    status: 'Limpio',
    size: '244 KB',
    time: '14:25',
    reason: 'Se generó una copia reconstruida a partir de los píxeles.',
  },
  {
    id: 'gk-1044',
    name: 'nombre-largo-con-caracteres-especiales-y-una-extension-jpg.pdf',
    type: 'application/pdf',
    status: 'Pendiente',
    size: '3.2 MB',
    time: '14:19',
    reason: 'El archivo está en la cola de inspección.',
  },
  {
    id: 'gk-1043',
    name: 'reporte-adjunto.pdf',
    type: 'application/pdf',
    status: 'En cuarentena',
    size: '890 KB',
    time: '14:05',
    reason: 'El archivo quedó aislado después de la comprobación de reputación.',
  },
];

export const THREAT_SERIES = [
  { day: 'Lun', quarantined: 12, rejected: 7 },
  { day: 'Mar', quarantined: 16, rejected: 12 },
  { day: 'Mié', quarantined: 8, rejected: 5 },
  { day: 'Jue', quarantined: 21, rejected: 9 },
  { day: 'Vie', quarantined: 17, rejected: 14 },
  { day: 'Sáb', quarantined: 11, rejected: 6 },
  { day: 'Dom', quarantined: 25, rejected: 10 },
] as const;

export interface AuditEvent {
  action: string;
  resource: string;
  actor: string;
  time: string;
  note?: string;
}

export interface DemoKey {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
}

export const SAMPLE_AUDIT: AuditEvent[] = [
  { action: 'Archivo aislado', resource: 'gk-1047', actor: 'ClamAV', time: '14:38' },
  { action: 'Carga rechazada', resource: 'gk-1046', actor: 'Inspección de firma', time: '14:33' },
  {
    action: 'Clave creada',
    resource: 'Integración de pruebas',
    actor: 'Administrador de ejemplo',
    time: '13:10',
  },
];

export const SAMPLE_KEYS: DemoKey[] = [
  { id: 'demo-01', name: 'Integración de pruebas', prefix: 'gk_demo_9b1c', revoked: false },
  { id: 'demo-02', name: 'Carga de documentos', prefix: 'gk_demo_36e2', revoked: false },
  { id: 'demo-03', name: 'Integración anterior', prefix: 'gk_demo_5dc2', revoked: true },
];
