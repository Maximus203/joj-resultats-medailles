# 005 — Résultats d'une journée : plan

**Statut** : Validé

## 1. Résumé

On ajoute au module `podiums` la lecture des podiums : `GET /api/podiums?day=AAAA-MM-JJ` rend les podiums d'un jour (tous sans `day`), les plus récents d'abord, au format `publishedPodiumSchema` qui porte `correctedAt`. Cela demande une colonne `corrected_at` (toujours nulle tant que la spec 006 n'est pas là). Le plan est validé sur le feu vert de l'utilisateur, qui a demandé d'aller vite. Trois tâches. On laisse de côté le regroupement par discipline, les autres filtres et la correction.

| Dans la spec | Dans le code  | Ce que c'est                                                       |
| ------------ | ------------- | ------------------------------------------------------------------ |
| résultats    | `ListPodiums` | le cas d'usage : filtre par jour, trie les plus récents d'abord    |
| correction   | `correctedAt` | la date de dernière correction d'un podium, `null` s'il n'en a pas |

## 2. Fichiers par couche

- **shared** : `listPodiumsQuerySchema` et `podiumListSchema` existent déjà dans `packages/shared/src/results.ts`.
- **domain** : `domain/podium.ts` gagne la propriété `correctedAt: Date | null` (`create` la met à `null`, `restore` la relit).
- **application** : `application/podium.repository.ts` gagne `list(day?)`. `application/use-cases/list-podiums.ts` est `ListPodiums` : il demande la liste au repository puis la trie (date d'enregistrement décroissante, puis nom d'épreuve). `application/testing/in-memory-podium.repository.ts` implémente `list(day?)`. Test : `application/results.application.spec.ts`.
- **infra** : `infra/podiums.schema.ts` gagne `corrected_at` (migration générée `pnpm db:generate --name=add_podium_corrected_at`) ; `infra/podium.mapper.ts` la convertit ; `infra/drizzle-podium.repository.ts` implémente `list(day?)`. Test : `infra/drizzle-podium-list.int.spec.ts`.
- **http** : `http/podiums.controller.ts` gagne `GET /api/podiums` : valide la requête avec `listPodiumsQuerySchema`, appelle `ListPodiums`, répond `200` avec `{ items }` (`podiumListSchema`). Test e2e : `apps/api/test/podium-results.e2e.spec.ts`. La base seed (57 podiums) reste valable : la colonne est nullable.
- **web** : hors périmètre.

## 3. Données

| Colonne        | Type               | Contrainte | Règle protégée                                   |
| -------------- | ------------------ | ---------- | ------------------------------------------------ |
| `corrected_at` | timestamp (ms, tz) | nullable   | `null` tant que le podium n'a jamais été corrigé |

Migration : `pnpm db:generate --name=add_podium_corrected_at`.

## 4. Erreurs

Aucune erreur métier : un jour sans podium donne une liste vide. Un jour mal formé est refusé par le schéma Zod (`400 VALIDATION_FAILED`), sans scénario.

## 5. Tests par scénario

| Scénario | Fichier de test                                                        | Niveau      | Ce que le test vérifie                                                                               |
| -------- | ---------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| AS1, AS2 | `apps/api/src/modules/podiums/application/results.application.spec.ts` | application | filtre par jour ; tous les podiums sans jour                                                         |
| AS3      | `apps/api/src/modules/podiums/application/results.application.spec.ts` | application | le dernier enregistré en premier ; l'épreuve départage à date égale                                  |
| AS4      | `apps/api/src/modules/podiums/application/results.application.spec.ts` | application | un jour sans podium donne une liste vide                                                             |
| AS1, AS2 | `apps/api/src/modules/podiums/infra/drizzle-podium-list.int.spec.ts`   | intégration | la base filtre par jour et relit `correctedAt` à `null`                                              |
| AS1–AS4  | `apps/api/test/podium-results.e2e.spec.ts`                             | e2e         | `200`, `{ items }` conforme à `podiumListSchema`, filtre, ordre, liste vide, `400` si jour mal formé |

## 6. Tâches

- [ ] T01 [005-AS1, AS2, AS3, AS4] Écrire d'abord `apps/api/src/modules/podiums/application/results.application.spec.ts` (« 005-AS1: lists the podiums of one day », « 005-AS2: lists every podium without a day », « 005-AS3: lists the most recently recorded first », « 005-AS4: lists nothing for a day without podium »), puis `correctedAt` du domaine, `list(day?)` du port et du faux repository, et `list-podiums.ts`
- [ ] T02 [005-AS1, AS2] Écrire d'abord `apps/api/src/modules/podiums/infra/drizzle-podium-list.int.spec.ts` (« 005-AS1: the database lists the podiums of one day », « 005-AS2: the database lists every podium »), puis la colonne `corrected_at`, la migration générée, le mapper et `list(day?)` Drizzle
- [ ] T03 [005-AS1, AS2, AS3, AS4] Écrire d'abord `apps/api/test/podium-results.e2e.spec.ts` (« 005-AS1: serves the podiums of a day (200) », « 005-AS2: serves every podium without a day », « 005-AS3: serves the most recent first », « 005-AS4: serves an empty list for a day without podium »), puis la route `GET /api/podiums` du controller
