import type { PodiumRevision, PublishedPodium } from '@joj/shared';

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
});

export const fixture = initial();

export function resetFixture(): void {
  Object.assign(fixture, initial());
}
