import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

type StationIcon = 'signature' | 'rebuild' | 'scan' | 'reputation';

interface Station {
  icon: StationIcon;
  name: string;
  tool: string;
  does: string;
  stops: string;
}

/**
 * Las capas de inspección como un riel: el archivo entra por la izquierda y sale reconstruido.
 * El riel se dibuja una sola vez al entrar en pantalla (no se repite al volver a pasar).
 */
@Component({
  selector: 'gk-inspection',
  templateUrl: './inspection.html',
  styleUrl: './inspection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inspection {
  protected readonly visible = signal(false);

  protected readonly stations: readonly Station[] = [
    {
      icon: 'signature',
      name: 'Firma real',
      tool: 'python-magic',
      does: 'Lee los primeros bytes y decide el tipo. Solo pasan JPEG, PNG y PDF.',
      stops: 'Scripts con extensión de imagen, doble extensión, SVG, ZIP.',
    },
    {
      icon: 'rebuild',
      name: 'Reconstrucción',
      tool: 'Pillow · pikepdf',
      does: 'Recodifica las imágenes desde los píxeles y quita EXIF. Limpia el PDF de JavaScript, acciones automáticas y archivos embebidos.',
      stops: 'Imágenes polyglot, PDF con contenido activo, bombas de píxeles.',
    },
    {
      icon: 'scan',
      name: 'ClamAV',
      tool: 'firmas locales',
      does: 'Escanea con firmas que se actualizan solas, dentro de un worker sin acceso a internet.',
      stops: 'Malware conocido y el archivo de prueba EICAR.',
    },
    {
      icon: 'reputation',
      name: 'VirusTotal',
      tool: 'API v3',
      does: 'Consulta la reputación del hash SHA-256. El archivo nunca se sube.',
      stops: 'Archivos que otros motores ya reportaron.',
    },
  ];

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.visible.set(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.visible.set(true);
            observer.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
