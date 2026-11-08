import type { PodiumRevision, PublishedPodium, ScrapeStatus } from '@joj/shared';

/**
 * Les données de la fausse API, en mémoire. Les handlers les lisent et les modifient comme la
 * vraie base ; `resetFixture()` (appelé après chaque test par `mockControl.reset()`) les remet
 * dans cet état, pour qu'un test ne dépende jamais de ce qu'un autre a créé ou supprimé.
 * Chaque ressource de l'API y ajoute sa liste, avec ses valeurs de départ.
 */
const initial = () => ({
  podiums: [] as PublishedPodium[],
  /** Les versions remplacées de chaque podium (clé : identifiant), la plus récente en premier. */
  revisions: new Map<string, PodiumRevision[]>(),
  /** L'état de l'import automatique : éteint par défaut, comme l'API en développement. */
  scraping: {
    enabled: false,
    running: false,
    schedule: {
      timeZone: 'Africa/Dakar',
      fullTimes: ['07:00', '23:00'],
      windowStart: '08:00',
      windowEnd: '23:00',
      intervalMinutes: 15,
      staleAfterMinutes: 120,
      firstDay: '2026-11-01',
      lastDay: '2026-11-13',
    },
    nextFullRunAt: null,
    lastSuccessAt: null,
    stale: false,
    lastRun: null,
    lastFullRun: null,
    recentRuns: [],
  } as ScrapeStatus,
});

export const fixture = initial();

export function resetFixture(): void {
  Object.assign(fixture, initial());
}
