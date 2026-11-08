import { describe, expect, it } from 'vitest';
import { localDay } from './local-time';
import {
  dueRun,
  inGamesWindow,
  inWindow,
  isStale,
  nextFullSlot,
  type ScheduleSettings,
  zonedInstant,
} from './scrape-schedule';

const DAKAR: ScheduleSettings = {
  firstDay: '2026-11-01',
  lastDay: '2026-11-13',
  timeZone: 'Africa/Dakar',
  fullTimes: ['07:00', '23:00'],
  windowStart: '08:00',
  windowEnd: '23:00',
  intervalMinutes: 15,
  tickSeconds: 60,
  staleAfterMinutes: 120,
};
const at = (iso: string) => new Date(iso);

describe('zonedInstant and localDay', () => {
  it('008-AS1: turns a local time into the right instant, whatever the time zone', () => {
    expect(zonedInstant('2026-11-02', '23:00', 'Africa/Dakar')).toEqual(at('2026-11-02T23:00:00Z'));
    expect(zonedInstant('2026-11-02', '23:00', 'Europe/Paris')).toEqual(at('2026-11-02T22:00:00Z'));
    expect(zonedInstant('2026-11-02', '23:00', 'Asia/Kolkata')).toEqual(at('2026-11-02T17:30:00Z'));
    expect(localDay(at('2026-11-02T23:30:00Z'), 'Europe/Paris')).toBe('2026-11-03');
  });
});

describe('inWindow and inGamesWindow', () => {
  it('008-AS1: opens at 08:00 and closes after 23:00, to the minute', () => {
    expect(inWindow(at('2026-11-03T07:59:59Z'), DAKAR)).toBe(false);
    expect(inWindow(at('2026-11-03T08:00:00Z'), DAKAR)).toBe(true);
    expect(inWindow(at('2026-11-03T23:00:59Z'), DAKAR)).toBe(true);
    expect(inWindow(at('2026-11-03T23:01:00Z'), DAKAR)).toBe(false);
  });

  it('008-AS1: follows the configured time zone', () => {
    const paris = { ...DAKAR, timeZone: 'Europe/Paris' };
    expect(inWindow(at('2026-11-03T06:59:00Z'), paris)).toBe(false);
    expect(inWindow(at('2026-11-03T07:00:00Z'), paris)).toBe(true);
  });

  it('008-AS1: covers the Games and the day after their last day, nothing else', () => {
    expect(inGamesWindow(at('2026-10-31T23:59:00Z'), DAKAR)).toBe(false);
    expect(inGamesWindow(at('2026-11-01T00:00:00Z'), DAKAR)).toBe(true);
    expect(inGamesWindow(at('2026-11-14T23:59:00Z'), DAKAR)).toBe(true);
    expect(inGamesWindow(at('2026-11-15T00:00:00Z'), DAKAR)).toBe(false);
  });
});

describe('dueRun', () => {
  const input = (now: string, patch: Partial<Parameters<typeof dueRun>[0]> = {}) => ({
    now: at(now),
    lastAttemptAt: at('2026-11-02T23:00:30Z'),
    lastFullAt: at('2026-11-02T23:00:30Z'),
    lastSucceededAt: at('2026-11-02T23:00:30Z'),
    startup: false,
    ...patch,
  });

  it('008-AS1: starts a light run at 08:00, then every 15 minutes until 23:00, never at 07:59 or 23:01', () => {
    const none = { lastAttemptAt: null };
    expect(dueRun(input('2026-11-03T07:59:00Z', none), DAKAR)).toBeNull();
    expect(dueRun(input('2026-11-03T08:00:00Z', none), DAKAR)).toMatchObject({
      kind: 'incremental',
    });
    const ran = (last: string, now: string) =>
      dueRun(
        input(now, { lastAttemptAt: at(last), lastFullAt: at('2026-11-03T07:00:10Z') }),
        DAKAR,
      );
    expect(ran('2026-11-03T08:00:05Z', '2026-11-03T08:14:00Z')).toBeNull();
    expect(ran('2026-11-03T08:00:05Z', '2026-11-03T08:15:05Z')).toMatchObject({
      kind: 'incremental',
      reason: 'interval',
    });
    expect(ran('2026-11-03T22:45:05Z', '2026-11-03T23:00:00Z')).toMatchObject({ kind: 'full' });
    expect(
      dueRun(
        input('2026-11-03T23:01:00Z', {
          lastAttemptAt: at('2026-11-03T22:45:05Z'),
          lastFullAt: at('2026-11-03T23:00:05Z'),
        }),
        DAKAR,
      ),
    ).toBeNull();
  });

  it('008-AS1: lets the light imports run until 22:45, gives 23:00 to the full import, and stops at 23:01', () => {
    const base = { lastFullAt: at('2026-11-03T07:00:10Z') };
    const light = dueRun(
      input('2026-11-03T22:45:00Z', { ...base, lastAttemptAt: at('2026-11-03T22:30:00Z') }),
      DAKAR,
    );
    const slot = dueRun(
      input('2026-11-03T23:00:00Z', { ...base, lastAttemptAt: at('2026-11-03T22:45:00Z') }),
      DAKAR,
    );
    const after = dueRun(
      input('2026-11-03T23:01:00Z', {
        lastFullAt: at('2026-11-03T23:00:05Z'),
        lastAttemptAt: at('2026-11-03T23:00:05Z'),
      }),
      DAKAR,
    );

    expect(light).toMatchObject({ kind: 'incremental' });
    expect(slot).toMatchObject({ kind: 'full', reason: 'full-slot' });
    expect(after).toBeNull();
  });

  it('008-AS1: never runs outside the Games, except the day after the last one', () => {
    const never = { lastAttemptAt: null, lastFullAt: null, lastSucceededAt: null };
    expect(dueRun(input('2026-10-31T10:00:00Z', never), DAKAR)).toBeNull();
    expect(dueRun(input('2026-11-14T10:00:00Z', never), DAKAR)).toMatchObject({
      kind: 'incremental',
    });
    expect(dueRun(input('2026-11-15T10:00:00Z', never), DAKAR)).toBeNull();
    expect(dueRun(input('2026-11-16T10:00:00Z', { startup: true, ...never }), DAKAR)).toBeNull();
  });

  it('008-AS3: starts a full run at 07:00 and at 23:00, once per slot, and not late', () => {
    const lastFullAt = at('2026-11-02T23:00:30Z');
    expect(dueRun(input('2026-11-03T06:59:00Z', { lastFullAt }), DAKAR)).toBeNull();
    expect(dueRun(input('2026-11-03T07:00:00Z', { lastFullAt }), DAKAR)).toMatchObject({
      kind: 'full',
      reason: 'full-slot',
    });
    const done = {
      lastFullAt: at('2026-11-03T07:00:10Z'),
      lastAttemptAt: at('2026-11-03T07:00:10Z'),
    };
    expect(dueRun(input('2026-11-03T07:01:00Z', done), DAKAR)).toBeNull();
    expect(dueRun(input('2026-11-03T07:05:00Z', { lastFullAt }), DAKAR)).toBeNull();
    expect(
      dueRun(input('2026-11-03T23:05:00Z', { lastFullAt: at('2026-11-03T07:00:10Z') }), DAKAR),
    ).toBeNull();
  });

  it('008-AS4: at startup, runs the full import of a slot that went by while the server was down', () => {
    const fullAt0700 = {
      lastFullAt: at('2026-11-03T07:00:10Z'),
      lastFullSucceededAt: at('2026-11-03T07:00:10Z'),
      lastAttemptAt: at('2026-11-03T22:50:00Z'),
      lastSucceededAt: at('2026-11-03T22:50:00Z'),
    };

    // 22:59 : le complet de 07:00 est le dernier créneau dû, il est fait : rien.
    expect(
      dueRun(input('2026-11-03T22:59:00Z', { ...fullAt0700, startup: true }), DAKAR),
    ).toBeNull();
    // 23:00:30 au redémarrage : le complet de 23:00 est dû et pas fait : complet de rattrapage.
    expect(
      dueRun(input('2026-11-03T23:00:30Z', { ...fullAt0700, startup: true }), DAKAR),
    ).toMatchObject({ kind: 'full', reason: 'catch-up' });
    // 23:00:30 avec le complet de 23:00 déjà fait à 23:00:05 : rien.
    const fullAt2300 = {
      lastFullAt: at('2026-11-03T23:00:05Z'),
      lastFullSucceededAt: at('2026-11-03T23:00:05Z'),
      lastAttemptAt: at('2026-11-03T23:00:05Z'),
      lastSucceededAt: at('2026-11-03T23:00:05Z'),
    };
    expect(
      dueRun(input('2026-11-03T23:00:30Z', { ...fullAt2300, startup: true }), DAKAR),
    ).toBeNull();
    // Un complet échoué ne compte pas : au redémarrage il est retenté.
    expect(
      dueRun(
        input('2026-11-03T23:00:30Z', { ...fullAt2300, lastFullSucceededAt: null, startup: true }),
        DAKAR,
      ),
    ).toMatchObject({ kind: 'full', reason: 'catch-up' });
    // Sans redémarrage, un battement tardif ne lance toujours rien.
    expect(
      dueRun(
        input('2026-11-03T23:30:00Z', { ...fullAt0700, lastAttemptAt: at('2026-11-03T22:50:00Z') }),
        DAKAR,
      ),
    ).toBeNull();
  });

  it('008-AS4: catches up with a full run at startup after over 24 hours, and never on a late beat', () => {
    const stale = {
      lastSucceededAt: at('2026-11-02T23:00:30Z'),
      lastAttemptAt: at('2026-11-02T23:00:30Z'),
    };
    expect(dueRun(input('2026-11-04T05:00:00Z', stale), DAKAR)).toBeNull();
    expect(dueRun(input('2026-11-04T05:00:00Z', { ...stale, startup: true }), DAKAR)).toMatchObject(
      {
        kind: 'full',
        reason: 'catch-up',
      },
    );
    const fresh = {
      lastSucceededAt: at('2026-11-03T22:00:00Z'),
      lastAttemptAt: at('2026-11-03T22:00:00Z'),
      lastFullAt: at('2026-11-03T07:00:10Z'),
    };
    expect(dueRun(input('2026-11-03T22:05:00Z', { ...fresh, startup: true }), DAKAR)).toBeNull();
    expect(
      dueRun(input('2026-11-03T03:00:00Z', { lastSucceededAt: null, startup: true }), DAKAR),
    ).toMatchObject({ reason: 'catch-up' });
  });
});

describe('isStale', () => {
  it('008-AS7: is stale when nothing succeeded for over 2 hours inside the window', () => {
    const last = at('2026-11-03T07:30:00Z');
    expect(isStale({ now: at('2026-11-03T09:30:00Z'), lastSucceededAt: last }, DAKAR)).toBe(false);
    expect(isStale({ now: at('2026-11-03T09:30:01Z'), lastSucceededAt: last }, DAKAR)).toBe(true);
    expect(isStale({ now: at('2026-11-03T10:00:00Z'), lastSucceededAt: null }, DAKAR)).toBe(true);
  });

  it('008-AS7: is never stale outside the daily window or outside the Games', () => {
    const last = at('2026-11-03T01:00:00Z');
    expect(isStale({ now: at('2026-11-03T07:59:00Z'), lastSucceededAt: last }, DAKAR)).toBe(false);
    expect(isStale({ now: at('2026-11-03T23:30:00Z'), lastSucceededAt: last }, DAKAR)).toBe(false);
    expect(isStale({ now: at('2026-11-20T12:00:00Z'), lastSucceededAt: null }, DAKAR)).toBe(false);
    expect(isStale({ now: at('2026-10-20T12:00:00Z'), lastSucceededAt: null }, DAKAR)).toBe(false);
  });
});

describe('nextFullSlot', () => {
  it('008-AS3: gives the next 07:00 or 23:00 within the Games', () => {
    expect(nextFullSlot(at('2026-11-03T10:00:00Z'), DAKAR)).toEqual(at('2026-11-03T23:00:00Z'));
    expect(nextFullSlot(at('2026-11-03T23:00:00Z'), DAKAR)).toEqual(at('2026-11-04T07:00:00Z'));
    expect(nextFullSlot(at('2026-10-20T10:00:00Z'), DAKAR)).toEqual(at('2026-11-01T07:00:00Z'));
    expect(nextFullSlot(at('2026-11-14T23:30:00Z'), DAKAR)).toBeNull();
  });
});
