import { describe, expect, it } from 'vitest';
import { AppConfig } from './app-config';

describe('AppConfig', () => {
  it('works without any variable: PGlite on port 3000', () => {
    const config = AppConfig.fromEnv({});
    expect(config.get('PORT')).toBe(3000);
    expect(config.get('DATABASE_URL')).toBeUndefined();
    expect(config.get('PGLITE_DATA_DIR')).toBe('.data/pglite');
  });

  it('accepts a PostgreSQL URL', () => {
    const config = AppConfig.fromEnv({ DATABASE_URL: 'postgres://joj:joj@localhost:5432/joj' });
    expect(config.get('DATABASE_URL')).toBe('postgres://joj:joj@localhost:5432/joj');
  });

  it('rejects an invalid value at startup and names the variable', () => {
    expect(() => AppConfig.fromEnv({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => AppConfig.fromEnv({ DATABASE_URL: 'mysql://localhost' })).toThrow(/DATABASE_URL/);
  });

  it('007-AS6: keeps the automatic import off by default and reads it as on only when asked', () => {
    expect(AppConfig.fromEnv({}).get('SCRAPING_ENABLED')).toBe(false);
    expect(AppConfig.fromEnv({ SCRAPING_ENABLED: 'false' }).get('SCRAPING_ENABLED')).toBe(false);
    expect(AppConfig.fromEnv({ SCRAPING_ENABLED: 'true' }).get('SCRAPING_ENABLED')).toBe(true);
  });

  it('008-AS1: keeps the automatic import off by default, with the rhythm of the Games', () => {
    const config = AppConfig.fromEnv({});
    expect(config.get('SCRAPING_ENABLED')).toBe(false);
    expect(config.get('SCRAPING_FULL_TIMES')).toEqual(['07:00', '23:00']);
    expect(config.get('SCRAPING_WINDOW_START')).toBe('08:00');
    expect(config.get('SCRAPING_WINDOW_END')).toBe('23:00');
    expect(config.get('SCRAPING_INTERVAL_MINUTES')).toBe(15);
    expect(config.get('SCRAPING_STALE_AFTER_MINUTES')).toBe(120);
    expect(config.get('SCRAPING_TIMEZONE')).toBe('Africa/Dakar');
    expect(config.get('SCRAPING_FIRST_DAY')).toBe('2026-11-01');
    expect(config.get('SCRAPING_LAST_DAY')).toBe('2026-11-13');
  });

  it('008-AS1: reads the rhythm settings and rejects an invalid hour, list or time zone', () => {
    const config = AppConfig.fromEnv({
      SCRAPING_ENABLED: 'true',
      SCRAPING_FULL_TIMES: '06:30, 12:00,23:30',
      SCRAPING_WINDOW_START: '09:00',
      SCRAPING_INTERVAL_MINUTES: '30',
    });
    expect(config.get('SCRAPING_ENABLED')).toBe(true);
    expect(config.get('SCRAPING_FULL_TIMES')).toEqual(['06:30', '12:00', '23:30']);
    expect(config.get('SCRAPING_WINDOW_START')).toBe('09:00');
    expect(config.get('SCRAPING_INTERVAL_MINUTES')).toBe(30);
    expect(() => AppConfig.fromEnv({ SCRAPING_FULL_TIMES: '07:00,25:00' })).toThrow(
      /SCRAPING_FULL_TIMES/,
    );
    expect(() => AppConfig.fromEnv({ SCRAPING_FULL_TIMES: '' })).toThrow(/SCRAPING_FULL_TIMES/);
    expect(() => AppConfig.fromEnv({ SCRAPING_TIMEZONE: 'Mars/Phobos' })).toThrow(
      /SCRAPING_TIMEZONE/,
    );
  });

  it('008-AS1: refuses a window that closes before it opens', () => {
    const attempt = () =>
      AppConfig.fromEnv({ SCRAPING_WINDOW_START: '23:00', SCRAPING_WINDOW_END: '08:00' });

    expect(attempt).toThrow(/SCRAPING_WINDOW_START/);
    expect(attempt).toThrow(/doit être avant SCRAPING_WINDOW_END/);
  });

  it('007-AS6: treats an empty interval, as a compose file passes it, as the default', () => {
    expect(
      AppConfig.fromEnv({ SCRAPING_INTERVAL_MINUTES: '' }).get('SCRAPING_INTERVAL_MINUTES'),
    ).toBe(15);
  });

  it('007-AS6: refuses a first day after the last day, naming the variable in French', () => {
    const attempt = () =>
      AppConfig.fromEnv({ SCRAPING_FIRST_DAY: '2026-11-13', SCRAPING_LAST_DAY: '2026-11-01' });

    expect(attempt).toThrow(/SCRAPING_FIRST_DAY/);
    expect(attempt).toThrow(/doit être le même jour que SCRAPING_LAST_DAY ou un jour avant/);
    expect(() =>
      AppConfig.fromEnv({ SCRAPING_FIRST_DAY: '2026-11-05', SCRAPING_LAST_DAY: '2026-11-05' }),
    ).not.toThrow();
  });

  it('007-AS6: explains an invalid value in French, variable by variable', () => {
    const message = (env: Record<string, string>) => {
      try {
        AppConfig.fromEnv(env);
        return '';
      } catch (error) {
        return (error as Error).message;
      }
    };

    expect(message({ SCRAPING_WINDOW_START: '7h30' })).toMatch(
      /heure HH:MM.*SCRAPING_WINDOW_START/s,
    );
    expect(message({ SCRAPING_ENABLED: 'maybe' })).toMatch(/true ou false.*SCRAPING_ENABLED/s);
    expect(message({ SCRAPING_FIRST_DAY: '2026-02-31' })).toMatch(
      /AAAA-MM-JJ.*SCRAPING_FIRST_DAY/s,
    );
    expect(message({ SCRAPING_TICK_SECONDS: '0' })).toMatch(
      /entier positif.*SCRAPING_TICK_SECONDS/s,
    );
    expect(message({ SCRAPING_SOURCE_URL: 'pas-une-url' })).toMatch(/URL.*SCRAPING_SOURCE_URL/s);
    expect(message({ PORT: 'abc' })).toMatch(/entier positif.*PORT/s);
    expect(message({ SCRAPING_TIMEZONE: 'Mars/Phobos' })).toMatch(/fuseau horaire/);
  });

  it('008-AS7: refuses a stale threshold that is not above the light import interval', () => {
    const attempt = (stale: string, interval: string) => () =>
      AppConfig.fromEnv({
        SCRAPING_STALE_AFTER_MINUTES: stale,
        SCRAPING_INTERVAL_MINUTES: interval,
      });

    expect(attempt('15', '15')).toThrow(/SCRAPING_STALE_AFTER_MINUTES/);
    expect(attempt('10', '15')).toThrow(/doit être supérieur à SCRAPING_INTERVAL_MINUTES/);
    expect(attempt('16', '15')).not.toThrow();
  });
});
