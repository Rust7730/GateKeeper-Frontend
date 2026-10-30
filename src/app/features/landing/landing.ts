import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Declaration } from './declaration/declaration';
import { Hero } from './hero/hero';
import { Inspection } from './inspection/inspection';
import { Integration } from './integration/integration';
import { TestMatrix } from './test-matrix/test-matrix';

/** Landing pública en «/» (M01, dirección «Aduana»). */
@Component({
  selector: 'gk-landing',
  imports: [RouterLink, Hero, Declaration, Inspection, Integration, TestMatrix],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly guarantees: readonly { title: string; text: string }[] = [
    {
      title: 'Ningún original llega a tu app',
      text: 'Solo se puede descargar la versión reconstruida, y solo cuando el análisis terminó en limpio.',
    },
    {
      title: 'El worker no tiene internet',
      text: 'El único componente que abre archivos vive aislado, sin usuario root y con límites de CPU y memoria. Un archivo que explotara una librería no podría comunicarse hacia afuera.',
    },
    {
      title: 'Solo el hash sale a VirusTotal',
      text: 'La consulta de reputación envía el SHA-256. El contenido del archivo nunca deja tu infraestructura.',
    },
    {
      title: 'Sin metadatos ocultos',
      text: 'La reconstrucción elimina EXIF, incluida la ubicación GPS que suelen llevar las fotos.',
    },
    {
      title: 'Cada liberación deja rastro',
      text: 'Sacar un archivo de cuarentena es una decisión de administrador, con motivo obligatorio, usuario y fecha en la bitácora.',
    },
  ];

  protected readonly limits: readonly string[] = [
    'Solo acepta JPEG, PNG y PDF. SVG, comprimidos y documentos de Office se rechazan por diseño.',
    'El malware nuevo (zero-day) no se detecta por firma; se neutraliza con la reconstrucción.',
    'Limpiar el PDF elimina sus elementos activos, pero no protege contra fallas del lector de PDF de quien lo abre.',
    'No analiza el significado del contenido: un PDF de phishing con texto engañoso puede quedar como limpio.',
    'Los originales en cuarentena se eliminan a los 30 días.',
  ];
}
