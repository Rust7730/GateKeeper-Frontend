import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Landing } from './landing';

describe('Landing', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('tiene un único h1 y todas las secciones del brief', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1').length).toBe(1);
    for (const id of ['como-funciona', 'integracion', 'garantias', 'pruebas', 'limites']) {
      expect(el.querySelector(`#${id}`), id).toBeTruthy();
    }
  });

  it('la matriz tiene los 15 vectores de la propuesta', async () => {
    const el = await render();
    expect(el.querySelectorAll('.matrix tbody tr').length).toBe(15);
  });

  it('el acceso al dashboard apunta a /login', async () => {
    const el = await render();
    const links = [...el.querySelectorAll('a')].filter((a) => a.textContent?.includes('dashboard'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach((a) => expect(a.getAttribute('href')).toBe('/login'));
  });
});
