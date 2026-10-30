import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Declaration } from './declaration';
import { DECLARATION_CASES } from './declaration-cases';

describe('Declaration', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Declaration],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Declaration);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra el primer caso con su dictamen', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Gatekeeper revisa lo que es');
    expect(el.textContent).toContain('foto.jpg');
    expect(el.querySelector('.stamp')?.getAttribute('data-verdict')).toBe('rejected');
  });

  it('cambia la inspección y el dictamen al elegir otro caso', async () => {
    const { fixture, el } = await render();
    const polyglot = DECLARATION_CASES.findIndex((c) => c.id === 'polyglot');
    const radios = el.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    radios[polyglot].click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Reconstrucción de imagen');
    expect(el.querySelector('.stamp')?.getAttribute('data-verdict')).toBe('clean');
  });

  it('el dictamen se comunica con texto e ícono, no solo con color', async () => {
    const { el } = await render();
    const stamp = el.querySelector('.stamp');
    expect(stamp?.textContent?.trim()).toBe('Rechazado');
    expect(stamp?.querySelector('svg')).toBeTruthy();
  });
});
