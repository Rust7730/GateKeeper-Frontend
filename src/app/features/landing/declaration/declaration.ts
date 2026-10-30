import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DECLARATION_CASES, DeclarationCase, VERDICT_LABEL } from './declaration-cases';

/**
 * Primera vista de la landing: un formato de declaración aduanal de un archivo.
 * Cambiar el caso reescribe la columna «Inspeccionado» y vuelve a sellar el dictamen.
 */
@Component({
  selector: 'gk-declaration',
  imports: [RouterLink],
  templateUrl: './declaration.html',
  styleUrl: './declaration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Declaration {
  protected readonly cases = DECLARATION_CASES;
  protected readonly verdictLabel = VERDICT_LABEL;
  protected readonly selectedId = signal(DECLARATION_CASES[0].id);
  protected readonly current = computed<DeclarationCase>(
    () => this.cases.find((c) => c.id === this.selectedId()) ?? this.cases[0],
  );

  /** Una lista de un solo elemento: el `track` por id recrea el sello en cada cambio de caso. */
  protected readonly stamped = computed(() => [this.current()]);

  protected select(id: string): void {
    this.selectedId.set(id);
  }
}
