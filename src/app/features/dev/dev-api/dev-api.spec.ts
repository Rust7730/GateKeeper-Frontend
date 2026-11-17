import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideApi } from '../../../core/http/provide-api';
import { MOCK_BACKEND_STATE } from '../../../core/mocks/mock-backend-state';
import { DevApi } from './dev-api';

describe('DevApi', () => {
  let fixture: ComponentFixture<DevApi>;
  let el: HTMLElement;

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevApi],
      providers: [provideApi({ useMocks: true, apiBaseUrl: '/v1' }), provideHttpClientTesting()],
    }).compileComponents();
    const state = TestBed.inject(MOCK_BACKEND_STATE);
    state.reset();
    state.latency = { min: 0, max: 0 };

    fixture = TestBed.createComponent(DevApi);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  it('lista archivos mock con paginación', async () => {
    expect(el.querySelectorAll('tbody tr').length).toBe(20);
    expect(el.querySelector('caption')?.textContent).toContain('Página 1 de 13');

    const next = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('siguiente'),
    );
    next?.click();
    await settle();
    expect(el.querySelector('caption')?.textContent).toContain('Página 2 de 13');
  });

  it('muestra los nombres hostiles como texto (S1) y oculta los restringidos (K20)', async () => {
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = 'quarantined';
    select.dispatchEvent(new Event('change'));
    await settle();

    expect(el.textContent).toContain('<script>alert(1)</script>.jpg');
    expect(el.querySelector('tbody script')).toBeNull();
    expect(el.querySelector('tbody img')).toBeNull();
    expect(el.textContent).not.toContain('Restringido');

    select.value = 'clean';
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(el.textContent).toContain('Restringido');
  });
});
