import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { API_ENDPOINTS, groupEndpoints } from './api-endpoints';
import { ConsolePage } from './console-page';

describe('ConsolePage', () => {
  let fixture: ComponentFixture<ConsolePage>;

  const create = (folder?: string) => {
    fixture = TestBed.createComponent(ConsolePage);
    if (folder) fixture.componentRef.setInput('folder', folder);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConsolePage] }).compileComponents();
  });

  it('selecciona el primer endpoint de su carpeta', () => {
    const page = create('quarantine');
    expect(page.selectedEndpoint().folder).toBe('quarantine');
  });

  it('sin carpeta muestra todo el catálogo', () => {
    const page = create();
    expect(page.selectedEndpoint().id).toBe(API_ENDPOINTS[0].id);
    expect(page.groups().length).toBeGreaterThan(1);
  });

  it('cambia el endpoint seleccionado', () => {
    const page = create();
    page.selectEndpoint(API_ENDPOINTS[2]);
    expect(page.selectedEndpoint().id).toBe('files-download');
  });

  it('agrupa los endpoints por carpeta', () => {
    expect(groupEndpoints('files')).toHaveLength(1);
  });
});
