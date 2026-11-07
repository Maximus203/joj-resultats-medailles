import { describe, expect, it } from 'vitest';
import { eventNameOf, parseMedalRows, parseMedalUnits, toPodiumRow } from './scrape-core.mts';

function scheduleItem(
  kind: string,
  code: string,
  discipline: string,
  competition: string,
  status = 'Finished',
): string {
  return `<div class="scheduleItem ${kind}"> <div class="link-wrapper"> <a aria-label="x" href="/nh/en/Info/ResultList/${code}"><div class="header-content"><div class="status"><span class="textStatus">${status}</span></div></div><div class="unit-content"><div class="unit-name"><div class="discipline-name"> <div class="sportimage"> <img alt="i" src="/i.svg" /> </div>${discipline} </div><div class="competition-name"> ${competition} </div></div></div></a></div></div>`;
}

function medalRow(medal: string, noc: string): string {
  return `<tr class="False"><td class="colMedal"><div class="medal-icon"><img alt="${medal} medal icon" src="/m.png" /><abbr title="${medal} Medal"> X </abbr></div></td><td class="noc-column"><a title="n" href="/c/${noc}" class="noc-element"><img src="/f.svg" alt="" /><span>${noc}</span></a></td><td class="c-a-l">Someone</td></tr>`;
}

describe('parseMedalUnits', () => {
  const html = [
    scheduleItem('', 'BDMMSINGLES-----------QFNL000200--', 'Badminton', 'Quarterfinals'),
    scheduleItem(
      'medal-match gold',
      'SWMW50MFR-------------FNL-000100--',
      'Swimming',
      'Women&#39;s 50m Freestyle Final',
    ),
    scheduleItem(
      'medal-match bronze',
      'VBVWTEAM2-------------FNL-000200--',
      'Beach Volleyball',
      'Women Finals Bronze Medal Match #53',
    ),
    scheduleItem(
      'medal-match gold',
      'WRBM60KG--------------FNL-000100--',
      'Beach Wrestling',
      'Men 60kg Finals Gold Medal Match #66',
      'Scheduled',
    ),
  ].join('\n');

  it('002-AS1: keeps only the finished gold-medal units and decodes their names', () => {
    expect(parseMedalUnits(html, '2026-11-04')).toEqual([
      {
        code: 'SWMW50MFR-------------FNL-000100--',
        discipline: 'Swimming',
        competition: "Women's 50m Freestyle Final",
        day: '2026-11-04',
      },
    ]);
  });
});

describe('eventNameOf', () => {
  it('002-AS2: drops the round and match suffixes, keeps the event', () => {
    expect(eventNameOf("Women's 50m Freestyle Final")).toBe("Women's 50m Freestyle");
    expect(eventNameOf('Men -55 kg Final')).toBe('Men -55 kg');
    expect(eventNameOf('Women Finals Gold Medal Match #54')).toBe('Women');
    expect(eventNameOf("Men's Changquan Combined Final Gunshu")).toBe("Men's Changquan Combined");
    expect(eventNameOf("Men's 400m Freestyle Fastest Heat")).toBe("Men's 400m Freestyle");
    expect(eventNameOf("Men's Individual")).toBe("Men's Individual");
  });
});

describe('parseMedalRows', () => {
  it('002-AS3: reads the medal and the country of each medal row, ignoring detail rows', () => {
    const html = `<table><tbody>${medalRow('Gold', 'CRO')}${medalRow('Silver', 'NZL')}<tr class="detail"><td class="colMedal"></td><td class="noc-column"></td><td>Athlete</td></tr>${medalRow('Bronze', 'BLR')}${medalRow('Bronze', 'FRA')}</tbody></table>`;
    expect(parseMedalRows(html)).toEqual([
      { medal: 'gold', noc: 'CRO' },
      { medal: 'silver', noc: 'NZL' },
      { medal: 'bronze', noc: 'BLR' },
      { medal: 'bronze', noc: 'FRA' },
    ]);
  });
});

describe('toPodiumRow', () => {
  const unit = {
    code: 'JUDM55KG--------------FNL-000100--',
    discipline: 'Judo',
    competition: 'Men -55 kg Final',
    day: '2026-11-01',
  };
  const now = new Date('2026-11-07T12:00:00.000Z');
  const rows = [
    { medal: 'gold' as const, noc: 'AZE' },
    { medal: 'silver' as const, noc: 'CRO' },
    { medal: 'bronze' as const, noc: 'MGL' },
    { medal: 'bronze' as const, noc: 'ZAM' },
  ];

  it('002-AS4: builds a podiums row named after the discipline, with the first bronze', () => {
    const row = toPodiumRow(unit, rows, now);
    expect(row).toMatchObject({
      event_name: 'Judo – Men -55 kg',
      event_key: 'judo – men -55 kg',
      discipline: 'Judo',
      day: '2026-11-01',
      gold: 'AZE',
      silver: 'CRO',
      bronze: 'MGL',
      created_at: '2026-11-07T12:00:00.000Z',
    });
    expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('002-AS5: gives the same id to the same event, so a re-run changes nothing', () => {
    expect(toPodiumRow(unit, rows, now).id).toBe(toPodiumRow(unit, rows, new Date()).id);
  });

  it('002-AS6: refuses an event without a full podium of distinct countries', () => {
    expect(() => toPodiumRow(unit, rows.slice(0, 2), now)).toThrow(/gold, silver and bronze/);
    expect(() =>
      toPodiumRow(unit, [rows[0]!, { medal: 'silver', noc: 'AZE' }, rows[2]!], now),
    ).toThrow(/distinct/);
  });
});
