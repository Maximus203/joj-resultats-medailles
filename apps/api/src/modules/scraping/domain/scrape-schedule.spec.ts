import { describe, expect, it } from 'vitest';
import { localDay } from './local-time';
import { dueReason, inGamesWindow, nextDailySlot, zonedInstant } from './scrape-schedule';

const DAKAR = {
  firstDay: '2026-11-01',
  lastDay: '2026-11-13',
  dailyTime: '23:00',
  timeZone: 'Africa/Dakar',
  intervalMinutes: null,
  tickSeconds: 60,
};
const at = (iso: string) => new Date(iso);

describe('zonedInstant and localDay', () => {
  it('007-AS6: turns a local time into the right instant, whatever the time zone', () => {
    expect(zonedInstant('2026-11-02', '23:00', 'Africa/Dakar')).toEqual(at('2026-11-02T23:00:00Z'));
    expect(zonedInstant('2026-11-02', '23:00', 'Europe/Paris')).toEqual(at('2026-11-02T22:00:00Z'));
    expect(zonedInstant('2026-11-02', '23:00', 'Asia/Kolkata')).toEqual(at('2026-11-02T17:30:00Z'));
    expect(localDay(at('2026-11-02T23:30:00Z'), 'Europe/Paris')).toBe('2026-11-03');
  });
});

describe('inGamesWindow', () => {
  it('007-AS6: covers the Games and the day after their last day, nothing else', () => {
    expect(inGamesWindow(at('2026-10-31T23:59:00Z'), DAKAR)).toBe(false);
    expect(inGamesWindow(at('2026-11-01T00:00:00Z'), DAKAR)).toBe(true);
    expect(inGamesWindow(at('2026-11-14T23:59:00Z'), DAKAR)).toBe(true);
    expect(inGamesWindow(at('2026-11-15T00:00:00Z'), DAKAR)).toBe(false);
  });
});

describe('dueReason', () => {
  const lastAttemptAt = at('2026-11-02T23:00:30Z');
  const input = (now: string, patch: Partial<Parameters<typeof dueReason>[0]> = {}) => ({
    now: at(now),
    lastAttemptAt,
    lastSucceededAt: lastAttemptAt,
    startup: false,
    ...patch,
  });

  it('007-AS6: is due at 23:00 in Dakar, once, and not a minute before', () => {
    expect(dueReason(input('2026-11-03T22:59:59Z'), DAKAR)).toBeNull();
    expect(dueReason(input('2026-11-03T23:00:00Z'), DAKAR)).toBe('daily');
    expect(
      dueReason(
        input('2026-11-03T23:01:00Z', { lastAttemptAt: at('2026-11-03T23:00:10Z') }),
        DAKAR,
      ),
    ).toBeNull();
  });

  it('007-AS6: follows the configured time zone', () => {
    const paris = { ...DAKAR, timeZone: 'Europe/Paris' };
    expect(dueReason(input('2026-11-03T21:59:00Z'), paris)).toBeNull();
    expect(dueReason(input('2026-11-03T22:00:00Z'), paris)).toBe('daily');
  });

  it('007-AS6: is never due outside the Games, except on the day after the last one', () => {
    const never = { lastAttemptAt: null, lastSucceededAt: null };
    expect(dueReason(input('2026-10-31T23:30:00Z', never), DAKAR)).toBeNull();
    expect(dueReason(input('2026-11-14T23:00:00Z'), DAKAR)).toBe('daily');
    expect(dueReason(input('2026-11-15T23:00:00Z', never), DAKAR)).toBeNull();
    expect(dueReason(input('2026-11-16T10:00:00Z', { startup: true, ...never }), DAKAR)).toBeNull();
  });

  it('007-AS6: catches up at startup when the last success is over 24 hours old', () => {
    const missed = input('2026-11-04T07:00:00Z', { startup: true });
    expect(dueReason(missed, DAKAR)).toBe('catch-up');
    const fresh = input('2026-11-03T05:00:00Z', {
      startup: true,
      lastAttemptAt: at('2026-11-02T23:00:30Z'),
      lastSucceededAt: at('2026-11-02T23:00:30Z'),
    });
    expect(dueReason(fresh, DAKAR)).toBeNull();
    expect(
      dueReason(input('2026-11-03T05:00:00Z', { startup: true, lastSucceededAt: null }), DAKAR),
    ).toBe('catch-up');
  });

  it('007-AS6: ignores a late beat: no import at 07:00 after a missed 23:00, unless the server starts', () => {
    const missed = { lastAttemptAt: at('2026-11-02T23:00:30Z'), lastSucceededAt: null };
    expect(dueReason(input('2026-11-04T07:00:00Z', missed), DAKAR)).toBeNull();
    expect(dueReason(input('2026-11-03T23:05:00Z', missed), DAKAR)).toBeNull();
    expect(dueReason(input('2026-11-03T23:01:59Z', missed), DAKAR)).toBe('daily');
    expect(dueReason(input('2026-11-04T07:00:00Z', { ...missed, startup: true }), DAKAR)).toBe(
      'catch-up',
    );
  });

  it('007-AS6: adds an interval run when one is configured', () => {
    const every3h = { ...DAKAR, intervalMinutes: 180 };
    expect(dueReason(input('2026-11-03T01:59:00Z'), every3h)).toBeNull();
    expect(dueReason(input('2026-11-03T02:00:30Z'), every3h)).toBe('interval');
    expect(dueReason(input('2026-11-03T02:00:30Z'), DAKAR)).toBeNull();
  });
});

describe('nextDailySlot', () => {
  it('007-AS6: gives tonight, or tomorrow once tonight has passed, within the Games', () => {
    expect(nextDailySlot(at('2026-11-03T10:00:00Z'), DAKAR)).toEqual(at('2026-11-03T23:00:00Z'));
    expect(nextDailySlot(at('2026-11-03T23:00:00Z'), DAKAR)).toEqual(at('2026-11-04T23:00:00Z'));
    expect(nextDailySlot(at('2026-10-20T10:00:00Z'), DAKAR)).toEqual(at('2026-11-01T23:00:00Z'));
    expect(nextDailySlot(at('2026-11-14T23:30:00Z'), DAKAR)).toBeNull();
  });
});
