import { SolarTermService } from './solar-term.service';

describe('SolarTermService', () => {
  const service = new SolarTermService();

  it('returns winter solstice before first solar term of the year', () => {
    expect(service.getCurrentTerm(new Date('2026-01-01T00:00:00+08:00'))).toBe('冬至');
  });

  it('returns solar term by approximate Gregorian boundary', () => {
    expect(service.getCurrentTerm(new Date('2026-06-21T00:00:00+08:00'))).toBe('夏至');
    expect(service.getCurrentTerm(new Date('2026-06-30T00:00:00+08:00'))).toBe('夏至');
    expect(service.getCurrentTerm(new Date('2026-07-07T00:00:00+08:00'))).toBe('小暑');
  });

  it('returns seasonal label and suitable suggestions', () => {
    const context = service.getTermContext(new Date('2026-06-29T00:00:00+08:00'));

    expect(context.name).toBe('夏至');
    expect(context.label).toBe('夏至 · 今日之念');
    expect(context.suitableFor).toContain('向光而行');
  });
});
