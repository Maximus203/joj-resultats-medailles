import type { ScrapingSettings } from '../scraping-settings';

/** Les réglages des Jeux, import allumé, fuseau de Dakar : la base des tests. */
export function testSettings(patch: Partial<ScrapingSettings> = {}): ScrapingSettings {
  return {
    enabled: true,
    firstDay: '2026-11-01',
    lastDay: '2026-11-13',
    timeZone: 'Africa/Dakar',
    fullTimes: ['07:00', '23:00'],
    windowStart: '08:00',
    windowEnd: '23:00',
    intervalMinutes: 15,
    tickSeconds: 60,
    staleAfterMinutes: 120,
    ...patch,
  };
}
