import { CHART_DAYS, chartWindowStart, groupThreatDays } from './workspace';

// Estas pruebas corren con TZ=America/Mexico_City (UTC-6), como el navegador de QA.
describe('Gráfica de amenazas por día', () => {
  // Sábado 21 de noviembre, 20:11 en México = domingo 22, 02:11 UTC.
  const now = new Date('2026-11-22T02:11:00Z');

  it('termina en el día local de hoy, no en el día UTC', () => {
    const days = groupThreatDays([], now);
    expect(days).toHaveLength(CHART_DAYS);
    expect(days.at(-1)?.key).toBe('2026-11-21');
    expect(days[0].key).toBe('2026-11-15');
    expect(chartWindowStart(now).toISOString()).toBe('2026-11-15T06:00:00.000Z');
  });

  it('cuenta cada archivo en el mismo día local que muestra la lista', () => {
    // 19-nov 23:45 en México = 20-nov 05:45 UTC: el backend lo contaba el viernes 20.
    const createdAt = '2026-11-20T05:45:00Z';
    const days = groupThreatDays(
      [
        { status: 'quarantined', createdAt },
        { status: 'error', createdAt: '2026-11-21T18:00:00Z' },
        { status: 'rejected', createdAt: '2026-11-21T18:00:00Z' },
        { status: 'clean', createdAt: '2026-11-21T18:00:00Z' },
        { status: 'quarantined', createdAt: '2026-11-01T00:00:00Z' },
      ],
      now,
    );
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
    expect(byKey['2026-11-19'].quarantined).toBe(1);
    expect(byKey['2026-11-20'].quarantined).toBe(0);
    expect(byKey['2026-11-21']).toMatchObject({ quarantined: 0, rejected: 1, errors: 1 });
  });
});
