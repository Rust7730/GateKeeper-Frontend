import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Station {
  name: string;
  tool: string;
  does: string;
  stops: string;
}

/** Las capas de inspección en el orden real del worker. Es una secuencia, por eso va numerada. */
@Component({
  selector: 'gk-inspection',
  templateUrl: './inspection.html',
  styleUrl: './inspection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inspection {
  protected readonly stations: readonly Station[] = [
    {
      name: 'Firma real',
      tool: 'python-magic',
      does: 'Lee los primeros bytes y decide el tipo. Solo pasan JPEG, PNG y PDF.',
      stops: 'Scripts con extensión de imagen, doble extensión, SVG, ZIP.',
    },
    {
      name: 'Reconstrucción',
      tool: 'Pillow · pikepdf',
      does: 'Recodifica las imágenes desde los píxeles y quita EXIF. Limpia el PDF de JavaScript, acciones automáticas y archivos embebidos.',
      stops: 'Imágenes polyglot, PDF con contenido activo, bombas de píxeles.',
    },
    {
      name: 'ClamAV',
      tool: 'firmas locales',
      does: 'Escanea con firmas que se actualizan solas, dentro de un worker sin acceso a internet.',
      stops: 'Malware conocido y el archivo de prueba EICAR.',
    },
    {
      name: 'VirusTotal',
      tool: 'API v3',
      does: 'Consulta la reputación del hash SHA-256. El archivo nunca se sube.',
      stops: 'Archivos que otros motores ya reportaron.',
    },
  ];
}
