import { fillThreatDays, formatDayLabel } from './workspace';

describe('Gráfica de amenazas por día', () => {
  it('muestra el día que manda el backend sin desplazarlo por la zona horaria', () => {
    // 2026-11-20 fue viernes: en UTC-6 `new Date('2026-11-20')` caía en jueves 19.
    expect(formatDayLabel('2026-11-20', 'es')).toContain('20');
    expect(formatDayLabel('2026-11-20', 'es').toLowerCase()).toContain('vie');
    expect(formatDayLabel('2026-11-20', 'en')).toContain('Fri');
  });

  it('rellena con ceros los 7 días aunque el backend solo mande días con datos', () => {
    const now = Date.parse('2026-11-22T01:49:00Z');
    const days = fillThreatDays(
      [
        { date: '2026-11-20T00:00:00.000Z', blocked: 1, quarantined: 1 },
        { date: '2026-11-21T00:00:00.000Z', blocked: 0, quarantined: 0 },
      ],
      now,
    );
    expect(days.map((d) => d.day)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(days[4]).toEqual({ day: '2026-11-20', blocked: 1, quarantined: 1 });
    expect(days.every((d) => Number.isInteger(d.blocked) && Number.isInteger(d.quarantined))).toBe(
      true,
    );
  });
});
