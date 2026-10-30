import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Hero } from './hero';
import { HERO_SCANS } from './hero-scans';

describe('Hero', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Hero);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('el titular es el h1 de la página', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Gatekeeper revisa lo que es');
  });

  it('el volcado hexadecimal sale de los bytes reales del archivo', () => {
    const script = HERO_SCANS.find((s) => s.id === 'script');
    expect(script?.rows[0].hex.startsWith('3C 3F 70 68 70')).toBe(true);
    expect(script?.rows[0].ascii.startsWith('<?php')).toBe(true);
    const png = HERO_SCANS.find((s) => s.id === 'polyglot');
    expect(png?.rows[0].ascii).toBe('.PNG....');
  });

  it('los puntos cambian el archivo inspeccionado', async () => {
    const { fixture, el } = await render();
    el.querySelectorAll<HTMLButtonElement>('.dot')[2].click();
    await fixture.whenStable();
    expect(el.querySelector('.file-name')?.textContent).toContain('tarea-final.pdf');
    expect(el.querySelector('.stamp')?.textContent?.trim()).toBe('Reconstruido');
  });
});
