import type { PublishedPodium } from '@joj/shared';
import { fixture } from '@/mocks/fixture';

let counter = 0;

/** Ajoute un podium aux données de la fausse API (le plus récent en tête, comme l'API). */
export function seedPodium(overrides: Partial<PublishedPodium> = {}): PublishedPodium {
  counter += 1;
  const podium: PublishedPodium = {
    id: crypto.randomUUID(),
    eventName: `Épreuve ${counter}`,
    discipline: 'Lutte',
    day: '2026-11-05',
    gold: 'SEN',
    silver: 'JPN',
    bronze: 'FRA',
    createdAt: new Date(Date.UTC(2026, 10, 5, 18, 12 + counter)).toISOString(),
    correctedAt: null,
    ...overrides,
  };
  fixture.podiums.unshift(podium);
  return podium;
}

/** Fait croire au navigateur que le réseau est coupé (ou revenu), et prévient la page. */
export function setOnline(online: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}
