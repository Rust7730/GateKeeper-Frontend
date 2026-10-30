import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Vector {
  attack: string;
  layer: string;
}

/** Matriz de pruebas de seguridad de la propuesta (anexo C), tal cual. */
@Component({
  selector: 'gk-test-matrix',
  templateUrl: './test-matrix.html',
  styleUrl: './test-matrix.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestMatrix {
  protected readonly vectors: readonly Vector[] = [
    { attack: 'Script con extensión de imagen', layer: 'Validación de firma' },
    { attack: 'Doble extensión', layer: 'Validación de firma' },
    { attack: 'Nombre con ../ o byte nulo', layer: 'Almacenamiento con UUID' },
    { attack: 'Imagen polyglot', layer: 'Reconstrucción de imagen' },
    { attack: 'PDF con JavaScript o acciones automáticas', layer: 'Saneamiento de PDF' },
    { attack: 'PDF cifrado', layer: 'Rechazo por política' },
    { attack: 'SVG', layer: 'Lista blanca' },
    { attack: 'ZIP', layer: 'Lista blanca' },
    { attack: 'Bomba de píxeles', layer: 'Límite de Pillow' },
    { attack: 'Archivo de 500 MB', layer: 'Límite de Nginx' },
    { attack: 'Archivo de prueba EICAR', layer: 'ClamAV y VirusTotal' },
    { attack: 'Nombre de archivo con HTML/JS', layer: 'Escape en el dashboard' },
    { attack: 'Acceso a archivo de otra aplicación (IDOR)', layer: 'Verificación de propiedad' },
    { attack: '200 subidas en un minuto', layer: 'Rate limiting' },
    { attack: 'Descarga de un archivo pendiente', layer: 'Máquina de estados' },
  ];
}
