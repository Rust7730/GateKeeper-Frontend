import { CHART_DAYS, chartWindowStart, formatTime, groupThreatDays } from './workspace';

// Las fechas se construyen en hora local para que las pruebas valgan en cualquier zona
// (CI corre en UTC; QA usa America/Mexico_City).
const local = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

describe('Gráfica de amenazas por día', () => {
  // Sábado 21 de noviembre, 20:11 en la hora local del navegador.
  const now = local(21, 20, 11);

  it('termina en el día local de hoy', () => {
    const days = groupThreatDays([], now);
    expect(days).toHaveLength(CHART_DAYS);
    expect(days.at(-1)?.key).toBe('2026-11-21');
    expect(days[0].key).toBe('2026-11-15');
    expect(chartWindowStart(now).getTime()).toBe(local(15, 0).getTime());
  });

  it('cuenta cada archivo en el mismo día local que muestra la lista', () => {
    // Un archivo de las 23:45 del jueves 19 cuenta el 19, aunque en UTC ya sea otro día.
    const createdAt = local(19, 23, 45).toISOString();
    const days = groupThreatDays(
      [
        { status: 'quarantined', createdAt },
        { status: 'error', createdAt: local(21, 12).toISOString() },
        { status: 'rejected', createdAt: local(21, 12).toISOString() },
        { status: 'clean', createdAt: local(21, 12).toISOString() },
        { status: 'quarantined', createdAt: local(1, 12).toISOString() },
      ],
      now,
    );
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
    expect(byKey['2026-11-19'].quarantined).toBe(1);
    expect(byKey['2026-11-20'].quarantined).toBe(0);
    expect(byKey['2026-11-21']).toMatchObject({ quarantined: 0, rejected: 1, errors: 1 });
    expect(formatTime(createdAt, 'es')).toContain('19');
    expect(formatTime(createdAt, 'en')).toMatch(/Nov 19.*PM/);
  });
});
