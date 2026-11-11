export type Language = 'es' | 'en';

export const englishData: Readonly<Record<string, string>> = {
  'JPEG falso': 'Fake JPEG',
  'Doble extensión': 'Double extension',
  'PNG con código': 'PNG with embedded code',
  'PDF con JavaScript': 'PDF with JavaScript',
  'JPEG válido': 'Valid JPEG',
  'La firma no es de JPEG, PNG ni PDF. La extensión y el Content-Type no cuentan.':
    'The signature does not match JPEG, PNG or PDF. The extension and Content-Type are ignored.',
  'El nombre se ignora: se guarda con un UUID y se decide por la firma real.':
    'Gatekeeper ignores the filename, stores the file under a UUID and checks its actual signature.',
  'PNG válido con datos tras el final': 'Valid PNG with data appended after the end',
  'Se recodifica desde los píxeles. El código incrustado no sobrevive a la copia.':
    'Gatekeeper re-encodes the image from its pixels. The embedded code is removed from the copy.',
  '%PDF- con /JavaScript y /OpenAction': '%PDF- with /JavaScript and /OpenAction',
  'Se entrega una copia sin JavaScript, acciones automáticas ni archivos embebidos.':
    'The resulting copy contains no JavaScript, automatic actions or embedded files.',
  'Se entrega la copia reconstruida, sin metadatos EXIF como la ubicación GPS.':
    'The reconstructed copy strips EXIF metadata such as GPS location.',
  'Firma real': 'File signature',
  'Lee los primeros bytes y decide el tipo. Solo pasan JPEG, PNG y PDF.':
    'Reads the first bytes to identify the type. Only JPEG, PNG and PDF are accepted.',
  'Reconstrucción': 'Reconstruction',
  'Recodifica las imágenes desde los píxeles y quita EXIF. Limpia el PDF de JavaScript, acciones automáticas y archivos embebidos.':
    'Re-encodes images from their pixels and strips EXIF. Removes JavaScript, automatic actions and embedded files from PDFs.',
  'firmas locales': 'Local signatures',
  'Escanea con firmas que se actualizan solas, dentro de un worker sin acceso a internet.':
    'Scans with automatically updated signatures inside a worker with no internet access.',
  'Consulta la reputación del hash SHA-256. El archivo nunca se sube.':
    'Checks the reputation of the SHA-256 hash. The file is never uploaded.',
  'Envía el archivo': 'Send the file',
  'La API responde al instante con un ID. El análisis corre en segundo plano.':
    'The API returns an ID immediately and scans the file in the background.',
  'Consulta el resultado': 'Check the result',
  'El estado pasa de pendiente a limpio, en cuarentena o rechazado.':
    'The status changes from pending to clean, quarantined or rejected.',
  'Descarga la copia reconstruida': 'Download the reconstructed copy',
  'Solo existe cuando el estado es limpio. El original nunca se entrega.':
    'The copy is available when the status is clean. Gatekeeper never delivers the original.',
  'Ningún original llega a tu app': 'Your app never receives the original',
  'Solo se puede descargar la versión reconstruida, y solo cuando el análisis terminó en limpio.':
    'Only the reconstructed copy can be downloaded, and only when the scan finishes with a clean result.',
  'El worker no tiene internet': 'The worker has no internet access',
  'El único componente que abre archivos vive aislado, sin usuario root y con límites de CPU y memoria. Un archivo que explotara una librería no podría comunicarse hacia afuera.':
    'The only component that opens files runs in isolation, without root privileges and with CPU and memory limits. A file exploiting a library would have no network access.',
  'Solo el hash sale a VirusTotal': 'Only the hash goes to VirusTotal',
  'La consulta de reputación envía el SHA-256. El contenido del archivo nunca deja tu infraestructura.':
    'The reputation lookup sends the SHA-256 hash. File contents never leave your infrastructure.',
  'Sin metadatos ocultos': 'Hidden metadata is removed',
  'La reconstrucción elimina EXIF, incluida la ubicación GPS que suelen llevar las fotos.':
    'Reconstruction strips EXIF metadata, including GPS coordinates often embedded in photos.',
  'Cada liberación deja rastro': 'Every release is logged',
  'Sacar un archivo de cuarentena es una decisión de administrador, con motivo obligatorio, usuario y fecha en la bitácora.':
    'An administrator must give a reason to release a quarantined file. The reason, user and date are logged.',
  'Todos (15)': 'All (15)',
  'Firma y lista blanca': 'Signature and allowlist',
  'Reconstrucción y límites': 'Reconstruction and limits',
  'Antimalware': 'Malware scanning',
  'API y aislamiento': 'API and isolation',
  'Script con extensión de imagen': 'Script with an image extension',
  'Validación de firma': 'Signature validation',
  'Nombre con ../ o byte nulo': 'Filename with ../ or a null byte',
  'Almacenamiento con UUID': 'UUID-based storage',
  'Imagen polyglot': 'Polyglot image',
  'Reconstrucción de imagen': 'Image reconstruction',
  'PDF con JavaScript o acciones automáticas': 'PDF with JavaScript or automatic actions',
  'Saneamiento de PDF': 'PDF sanitization',
  'PDF cifrado': 'Encrypted PDF',
  'Rechazo por política': 'Rejected by policy',
  'Lista blanca': 'Allowlist',
  'Bomba de píxeles': 'Pixel bomb',
  'Límite de Pillow': 'Pillow limit',
  'Archivo de 500 MB': '500 MB file',
  'Límite de Nginx': 'Nginx limit',
  'Archivo de prueba EICAR': 'EICAR test file',
  'ClamAV y VirusTotal': 'ClamAV and VirusTotal',
  'Nombre de archivo con HTML/JS': 'Filename containing HTML or JavaScript',
  'Escape en el dashboard': 'Output escaping in the dashboard',
  'Acceso a archivo de otra aplicación (IDOR)': 'Access to another app’s file (IDOR)',
  'Verificación de propiedad': 'Ownership check',
  '200 subidas en un minuto': '200 uploads in one minute',
  'Descarga de un archivo pendiente': 'Download of a pending file',
  'Máquina de estados': 'State machine',
  'Solo acepta JPEG, PNG y PDF. SVG, comprimidos y documentos de Office se rechazan por diseño.':
    'Only JPEG, PNG and PDF are accepted. SVGs, archives and Office documents are rejected by design.',
  'El análisis por firmas puede pasar por alto malware nuevo. La reconstrucción ayuda a eliminar contenido activo de los formatos admitidos.':
    'Signature scans may miss new malware. Reconstruction helps remove active content from supported formats.',
  'Limpiar el PDF elimina sus elementos activos, pero no protege contra fallas del lector de PDF de quien lo abre.':
    'PDF sanitization removes active elements. Vulnerabilities in the PDF reader remain a separate risk.',
  'No analiza el significado del contenido: un PDF de phishing con texto engañoso puede quedar como limpio.':
    'Gatekeeper does not interpret the meaning of file contents. A phishing PDF with misleading text may be marked clean.',
  'Los originales en cuarentena se eliminan a los 30 días.':
    'Quarantined originals are deleted after 30 days.',
};
