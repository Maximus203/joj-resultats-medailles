# 006 — Corriger un podium : plan

**Statut** : Validé

## 1. Résumé

On ajoute au module `podiums` la correction : `PUT /api/podiums/:id` remplace les trois pays d'un podium publié, garde l'ancienne version dans une table de révisions et date la correction ; `GET /api/podiums/:id/revisions` rend les versions remplacées, la plus récente d'abord. Une correction identique à la version publiée est acceptée sans révision. Le plan est validé sur le feu vert de l'utilisateur, qui a demandé d'aller vite. Quatre tâches. On laisse de côté la correction de l'épreuve, du jour et de la discipline, et l'écran.

| Dans la spec       | Dans le code          | Ce que c'est                                                             |
| ------------------ | --------------------- | ------------------------------------------------------------------------ |
| corriger           | `CorrectPodium`       | le cas d'usage : trouve le podium, applique `Podium.correct`, enregistre |
| version remplacée  | `PodiumRevision`      | trois pays et la date à laquelle ils ont cessé d'être publiés            |
| consulter versions | `ListPodiumRevisions` | le cas d'usage qui rend les révisions d'un podium                        |

## 2. Fichiers par couche

- **shared** : `correctPodiumSchema`, `podiumRevisionListSchema` existent dans `packages/shared/src/results.ts`.
- **domain** : `domain/podium.ts` gagne `correct({ gold, silver, bronze }, now)` qui rend `{ podium, revision }` : trois pays différents exigés (`PODIUM_COUNTRIES_NOT_DISTINCT`) ; si les pays sont ceux déjà publiés, le podium est rendu tel quel et `revision` vaut `null`. `domain/podium-revision.ts` définit `PodiumRevision`. `domain/podiums.errors.ts` gagne `PODIUM_NOT_FOUND`. Test : `domain/podium-correction.spec.ts`.
- **application** : `podium.repository.ts` gagne `findById(id)`, `saveCorrection(podium, revision)` et `revisionsOf(id)`. Cas d'usage `use-cases/correct-podium.ts` et `use-cases/list-podium-revisions.ts` (`PODIUM_NOT_FOUND` si l'id est inconnu). Le faux repository implémente les trois méthodes. Test : `application/correction.application.spec.ts`.
- **infra** : `podiums.schema.ts` gagne la table `podium_revisions` (migration générée `pnpm db:generate --name=create_podium_revisions`). `drizzle-podium.repository.ts` implémente les trois méthodes ; `saveCorrection` met à jour le podium et insère la révision dans une même transaction. Test : `infra/drizzle-podium-revisions.int.spec.ts`.
- **http** : `http/podiums.controller.ts` gagne `PUT /api/podiums/:id` (corps `correctPodiumSchema`, `200` avec `publishedPodiumSchema`) et `GET /api/podiums/:id/revisions` (`200`, `podiumRevisionListSchema`). Un identifiant qui n'est pas un UUID est traité comme inconnu (`404`). Test e2e : `apps/api/test/podium-correction.e2e.spec.ts`.
- **web** : hors périmètre.

## 3. Données

Table `podium_revisions` (une ligne par version remplacée) :

| Colonne        | Type               | Contrainte                          | Règle protégée                                |
| -------------- | ------------------ | ----------------------------------- | --------------------------------------------- |
| `id`           | uuid               | clé primaire, défaut aléatoire      | identifie la révision                         |
| `podium_id`    | uuid               | non nul, clé étrangère `podiums.id` | une révision appartient à un podium           |
| `gold`         | varchar(3)         | non nul                             | l'or de la version remplacée                  |
| `silver`       | varchar(3)         | non nul                             | l'argent de la version remplacée              |
| `bronze`       | varchar(3)         | non nul                             | le bronze de la version remplacée             |
| `corrected_at` | timestamp (ms, tz) | non nul                             | AS4 : le moment où la version a été remplacée |

Un index sur `podium_id` accélère la lecture des révisions. La colonne `podiums.corrected_at` existe déjà (spec 005) : elle prend la date de la dernière correction.

## 4. Erreurs

| Code AppError                   | Catégorie     | HTTP | Quand                                                   | Scénario |
| ------------------------------- | ------------- | ---- | ------------------------------------------------------- | -------- |
| `PODIUM_COUNTRIES_NOT_DISTINCT` | BUSINESS_RULE | 422  | deux des trois pays corrigés sont le même (existe déjà) | AS2      |
| `PODIUM_NOT_FOUND`              | NOT_FOUND     | 404  | aucun podium pour cet identifiant                       | AS3      |

## 5. Tests par scénario

| Scénario | Fichier de test                                                           | Niveau      | Ce que le test vérifie                                                                                     |
| -------- | ------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| AS1      | `apps/api/src/modules/podiums/domain/podium-correction.spec.ts`           | unitaire    | `correct` change les pays, date la correction, rend l'ancienne version                                     |
| AS2      | `apps/api/src/modules/podiums/domain/podium-correction.spec.ts`           | unitaire    | `correct` refuse un pays répété sans rien changer                                                          |
| AS5      | `apps/api/src/modules/podiums/domain/podium-correction.spec.ts`           | unitaire    | mêmes pays : podium inchangé, pas de révision, pas de date                                                 |
| AS1, AS5 | `apps/api/src/modules/podiums/application/correction.application.spec.ts` | application | `CorrectPodium` enregistre la correction ; une correction identique n'ajoute rien                          |
| AS3      | `apps/api/src/modules/podiums/application/correction.application.spec.ts` | application | id inconnu : `PODIUM_NOT_FOUND` pour corriger et pour lister les versions                                  |
| AS4      | `apps/api/src/modules/podiums/application/correction.application.spec.ts` | application | deux corrections : deux versions, la plus récente d'abord                                                  |
| AS4      | `apps/api/src/modules/podiums/infra/drizzle-podium-revisions.int.spec.ts` | intégration | la base conserve les révisions avec leur date, et la correction est atomique                               |
| AS1–AS5  | `apps/api/test/podium-correction.e2e.spec.ts`                             | e2e         | `200`, `422`, `404` (PUT et révisions), deux révisions ordonnées, correction identique, tableau mis à jour |

## 6. Tâches

- [ ] T01 [006-AS1, AS2, AS5] Écrire d'abord `apps/api/src/modules/podiums/domain/podium-correction.spec.ts` (« 006-AS1: corrects the three countries and returns the replaced version », « 006-AS2: refuses a repeated country », « 006-AS5: an identical correction changes nothing »), puis `Podium.correct`, `domain/podium-revision.ts` et `PODIUM_NOT_FOUND`
- [ ] T02 [006-AS1, AS3, AS4, AS5] Écrire d'abord `apps/api/src/modules/podiums/application/correction.application.spec.ts` (« 006-AS1: records a correction », « 006-AS3: refuses an unknown podium », « 006-AS4: lists replaced versions, most recent first », « 006-AS5: an identical correction leaves no revision »), puis le port, le faux repository, `correct-podium.ts` et `list-podium-revisions.ts`
- [ ] T03 [006-AS4] Écrire d'abord `apps/api/src/modules/podiums/infra/drizzle-podium-revisions.int.spec.ts` (« 006-AS4: the database keeps replaced versions with their date »), puis la table `podium_revisions`, la migration générée et les trois méthodes Drizzle
- [ ] T04 [006-AS1, AS2, AS3, AS4, AS5] Écrire d'abord `apps/api/test/podium-correction.e2e.spec.ts` (« 006-AS1: corrects a podium (200) », « 006-AS2: refuses a repeated country (422) », « 006-AS3: refuses an unknown podium (404) », « 006-AS4: serves replaced versions », « 006-AS5: accepts an identical correction without revision »), puis les routes `PUT` et `GET .../revisions` du controller
