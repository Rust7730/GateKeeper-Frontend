import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Marcador de `/login` hasta que exista el inicio de sesión (M05). */
@Component({
  selector: 'gk-coming-soon',
  imports: [RouterLink],
  template: `
    <main class="page">
      <p class="wordmark">Gatekeeper</p>
      <h1 class="title">El dashboard todavía no está disponible.</h1>
      <p class="text">
        Estamos construyendo el acceso para analistas y administradores. Mientras tanto, puedes ver
        cómo funciona la inspección y cómo se integra la API.
      </p>
      <a class="back" routerLink="/">Volver al inicio</a>
    </main>
  `,
  styles: `
    .page {
      display: grid;
      align-content: center;
      gap: var(--gk-space-16);
      min-height: 100dvh;
      width: min(100%, 40rem);
      margin-inline: auto;
      padding: var(--gk-landing-gutter);
    }
    .wordmark {
      font-weight: var(--gk-weight-semibold);
      color: var(--gk-text-muted);
    }
    .title {
      font-size: var(--gk-landing-heading);
      line-height: 1.15;
    }
    .text {
      color: var(--gk-text-secondary);
    }
    .back {
      justify-self: start;
      margin-top: var(--gk-space-8);
      font-weight: var(--gk-weight-semibold);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {}
