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

  it('007-AS6: keeps the automatic import off by default, set for 23:00 in Dakar', () => {
    const config = AppConfig.fromEnv({});
    expect(config.get('SCRAPING_ENABLED')).toBe(false);
    expect(config.get('SCRAPING_DAILY_TIME')).toBe('23:00');
    expect(config.get('SCRAPING_TIMEZONE')).toBe('Africa/Dakar');
    expect(config.get('SCRAPING_FIRST_DAY')).toBe('2026-11-01');
    expect(config.get('SCRAPING_LAST_DAY')).toBe('2026-11-13');
    expect(config.get('SCRAPING_INTERVAL_MINUTES')).toBeUndefined();
  });

  it('007-AS6: reads the import settings and rejects an invalid hour or time zone', () => {
    const config = AppConfig.fromEnv({
      SCRAPING_ENABLED: 'true',
      SCRAPING_DAILY_TIME: '06:30',
      SCRAPING_INTERVAL_MINUTES: '180',
    });
    expect(config.get('SCRAPING_ENABLED')).toBe(true);
    expect(config.get('SCRAPING_DAILY_TIME')).toBe('06:30');
    expect(config.get('SCRAPING_INTERVAL_MINUTES')).toBe(180);
    expect(() => AppConfig.fromEnv({ SCRAPING_DAILY_TIME: '25:00' })).toThrow(
      /SCRAPING_DAILY_TIME/,
    );
    expect(() => AppConfig.fromEnv({ SCRAPING_TIMEZONE: 'Mars/Phobos' })).toThrow(
      /SCRAPING_TIMEZONE/,
    );
  });

  it('007-AS6: treats an empty interval, as a compose file passes it, as no interval', () => {
    expect(
      AppConfig.fromEnv({ SCRAPING_INTERVAL_MINUTES: '' }).get('SCRAPING_INTERVAL_MINUTES'),
    ).toBeUndefined();
  });
});
