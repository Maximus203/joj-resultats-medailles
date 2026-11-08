import { describe, expect, it } from 'vitest';
import {
  collectOfficialPodiums,
  daysBetween,
  eventNameOf,
  type OfficialSource,
  parseFinalUnits,
  parseMedalRows,
  podiumIdOf,
  toPodiumDraft,
} from './official-results';
import { medalPage, medalRow, scheduleItem } from '../application/testing/official-pages';

describe('parseFinalUnits', () => {
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
    scheduleItem(
      '',
      'WSTMCHANGCOM----------FNL-000100--',
      'Wushu Taolu',
      'Men&#39;s Changquan Combined Final Changquan',
    ),
    scheduleItem(
      '',
      'RU7MTEAM7-------------FNL-000300--',
      'Rugby Sevens',
      'Men Finals Placing 5-6 Match #18',
    ),
    scheduleItem(
      '',
      'SALWIQFOIL------------FNL-000100--',
      'Sailing',
      'Women&#39;s Windsurfing Opening Series Race 1',
    ),
  ].join('\n');

  it('007-AS1: keeps only the finished finals and decodes their names', () => {
    expect(parseFinalUnits(html, '2026-11-04').map((unit) => unit.code)).toEqual([
      'SWMW50MFR-------------FNL-000100--',
      'WSTMCHANGCOM----------FNL-000100--',
    ]);
    expect(parseFinalUnits(html, '2026-11-04')[0]).toEqual({
      code: 'SWMW50MFR-------------FNL-000100--',
      discipline: 'Swimming',
      competition: "Women's 50m Freestyle Final",
      day: '2026-11-04',
    });
  });

  it('007-AS2: reads a final the site does not flag gold, but not a placing or a race', () => {
    const codes = parseFinalUnits(html, '2026-11-03').map((unit) => unit.code);
    expect(codes).toContain('WSTMCHANGCOM----------FNL-000100--');
    expect(codes).not.toContain('RU7MTEAM7-------------FNL-000300--');
    expect(codes).not.toContain('SALWIQFOIL------------FNL-000100--');
  });
});

describe('eventNameOf', () => {
  it('007-AS1: drops the round and match suffixes, keeps the event', () => {
    expect(eventNameOf("Women's 50m Freestyle Final")).toBe("Women's 50m Freestyle");
    expect(eventNameOf('Men -55 kg Final')).toBe('Men -55 kg');
    expect(eventNameOf('Women Finals Gold Medal Match #54')).toBe('Women');
    expect(eventNameOf("Men's Changquan Combined Final Gunshu")).toBe("Men's Changquan Combined");
    expect(eventNameOf("Men's 400m Freestyle Fastest Heat")).toBe("Men's 400m Freestyle");
    expect(eventNameOf("Men's Individual")).toBe("Men's Individual");
  });
});

describe('parseMedalRows', () => {
  it('007-AS1: reads the medal and the country of each medal row, ignoring detail rows', () => {
    const html = `<table><tbody>${medalRow('Gold', 'CRO')}${medalRow('Silver', 'NZL')}<tr class="detail"><td class="colMedal"></td><td class="noc-column"></td><td>Athlete</td></tr>${medalRow('Bronze', 'BLR')}${medalRow('Bronze', 'FRA')}</tbody></table>`;
    expect(parseMedalRows(html)).toEqual([
      { medal: 'gold', noc: 'CRO' },
      { medal: 'silver', noc: 'NZL' },
      { medal: 'bronze', noc: 'BLR' },
      { medal: 'bronze', noc: 'FRA' },
    ]);
  });
});

describe('toPodiumDraft', () => {
  const unit = {
    code: 'JUDM66KG--------------FNL-000100--',
    discipline: 'Judo',
    competition: 'Men -66 kg Final',
    day: '2026-11-01',
  };
  const rows = [
    { medal: 'gold' as const, noc: 'UKR' },
    { medal: 'silver' as const, noc: 'CAN' },
    { medal: 'bronze' as const, noc: 'ARG' },
    { medal: 'bronze' as const, noc: 'SEN' },
  ];

  it('007-AS2: keeps both bronze countries and names the event after its discipline', () => {
    const result = toPodiumDraft(unit, rows);
    expect(result).toMatchObject({
      ok: true,
      draft: {
        eventName: 'Judo – Men -66 kg',
        eventKey: 'judo – men -66 kg',
        day: '2026-11-01',
        gold: 'UKR',
        silver: 'CAN',
        bronze: 'ARG',
        secondBronze: 'SEN',
      },
    });
  });

  it('007-AS1: gives the same id to the same event, so a re-run changes nothing', () => {
    const first = toPodiumDraft(unit, rows);
    const second = toPodiumDraft(unit, rows.slice(0, 3));
    expect(first.ok && second.ok && first.draft.id === second.draft.id).toBe(true);
    expect(podiumIdOf('judo – men -66 kg')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('007-AS3: ignores a tie for gold, and says why', () => {
    const tie = [
      { medal: 'gold' as const, noc: 'GRE' },
      { medal: 'gold' as const, noc: 'POR' },
      { medal: 'bronze' as const, noc: 'BEL' },
    ];
    expect(toPodiumDraft(unit, tie)).toMatchObject({ ok: false, reason: 'TIED_PLACES' });
  });

  it('007-AS3: refuses an event without a full podium of distinct countries', () => {
    expect(toPodiumDraft(unit, [])).toMatchObject({ ok: false, reason: 'NO_MEDALS' });
    expect(toPodiumDraft(unit, rows.slice(0, 2))).toMatchObject({
      ok: false,
      reason: 'INCOMPLETE_PODIUM',
    });
    expect(
      toPodiumDraft(unit, [rows[0]!, { medal: 'silver', noc: 'UKR' }, rows[2]!]),
    ).toMatchObject({ ok: false, reason: 'SAME_COUNTRY' });
    expect(toPodiumDraft(unit, [...rows, { medal: 'bronze' as const, noc: 'FRA' }])).toMatchObject({
      ok: false,
      reason: 'TOO_MANY_BRONZE',
    });
  });
});

describe('collectOfficialPodiums', () => {
  const schedule = [
    scheduleItem('medal-match gold', 'AAA-FNL-000100--', 'Judo', 'Men -66 kg Final'),
    scheduleItem('', 'WST-FNL-000100--', 'Wushu Taolu', 'Men&#39;s Changquan Combined Final A'),
    scheduleItem('', 'WST-FNL-000200--', 'Wushu Taolu', 'Men&#39;s Changquan Combined Final B'),
    scheduleItem('medal-match gold', 'TIE-FNL-000100--', 'Swimming', 'Men 50m Butterfly Final'),
  ].join('');
  const pages: Record<string, string> = {
    'AAA-FNL-000100--': medalPage(['Gold', 'UKR'], ['Silver', 'CAN'], ['Bronze', 'ARG']),
    'WST-FNL-000100--': medalPage(['Gold', 'CHN'], ['Silver', 'INA'], ['Bronze', 'IRI']),
    'WST-FNL-000200--': medalPage(['Gold', 'CHN'], ['Silver', 'INA'], ['Bronze', 'IRI']),
    'TIE-FNL-000100--': medalPage(['Gold', 'GRE'], ['Gold', 'POR'], ['Bronze', 'BEL']),
  };
  const requested: string[] = [];
  const source: OfficialSource = {
    schedule: async (day) => {
      if (day === '2026-11-02') throw new Error('HTTP 500');
      return schedule;
    },
    medalList: async (code) => {
      requested.push(code);
      return pages[code] ?? '';
    },
  };

  it('007-AS2: imports every event once, reads one unit per event, and lists the ignored ones', async () => {
    const result = await collectOfficialPodiums(source, ['2026-11-01', '2026-11-02']);
    expect(result.drafts.map((draft) => draft.eventName)).toEqual([
      'Judo – Men -66 kg',
      "Wushu Taolu – Men's Changquan Combined",
    ]);
    expect(requested).not.toContain('WST-FNL-000200--');
    expect(result.finalsSeen).toBe(3);
    expect(result.ignored).toMatchObject([{ code: 'TIE-FNL-000100--', reason: 'TIED_PLACES' }]);
    expect(result.daysRead).toEqual(['2026-11-01']);
    expect(result.daysFailed).toEqual(['2026-11-02']);
  });
});

describe('daysBetween', () => {
  it('007-AS7: lists the days of the Games, both ends included', () => {
    expect(daysBetween('2026-11-01', '2026-11-03')).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ]);
  });
});
