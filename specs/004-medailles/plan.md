# 004 — Tableau des médailles : plan

**Statut** : Validé

## 1. Résumé

On ajoute au module `podiums` le calcul du tableau des médailles : une fonction pure du domaine qui compte les médailles par pays, trie et attribue les rangs, un cas d'usage qui l'applique aux podiums enregistrés, et la route `GET /api/medals`. À la fin, le tableau suit les podiums enregistrés sans aucune saisie. Le plan est validé sur le feu vert de l'utilisateur, qui a demandé d'aller vite. Trois tâches. On laisse de côté la correction (spec 006), les filtres et l'écran.

| Dans la spec | Dans le code      | Ce que c'est                                                    |
| ------------ | ----------------- | --------------------------------------------------------------- |
| tableau      | `MedalRow[]`      | une ligne par pays : rang, pays, or, argent, bronze             |
| calcul       | `buildMedalTable` | fonction pure du domaine : agrège, trie, attribue les rangs     |
| consulter    | `GetMedalTable`   | le cas d'usage qui lit les podiums et appelle `buildMedalTable` |

## 2. Fichiers par couche

Tout reste dans `apps/api/src/modules/podiums/` : le tableau n'a pas de donnée propre, c'est une vue des podiums.

- **shared** : le contrat `medalTableSchema` existe déjà dans `packages/shared/src/results.ts` (non modifié ici).
- **domain** : `domain/medal-table.ts` exporte `buildMedalTable(podiums)`, TypeScript pur : compte les médailles par code pays, trie par or, argent, bronze décroissants puis par code, et donne le rang à la compétition. `domain/medal-table.spec.ts` est son test unitaire.
- **application** : `application/podium.repository.ts` gagne `list()` (tous les podiums). `application/use-cases/get-medal-table.ts` est `GetMedalTable`. `application/testing/in-memory-podium.repository.ts` implémente `list()`. Test : `application/medals.application.spec.ts`.
- **infra** : `infra/drizzle-podium.repository.ts` implémente `list()` (lecture de la table `podiums`, mapper existant).
- **http** : `http/medals.controller.ts` expose `GET /api/medals` : appelle `GetMedalTable`, répond `200` avec `{ items }` (`medalTableSchema`). `podiums.module.ts` l'enregistre. Test e2e : `apps/api/test/medals.e2e.spec.ts`.
- **web** : hors périmètre (un autre agent s'occupe du front et de sa fausse API).

## 3. Données

Aucune nouvelle table ni colonne : le tableau est calculé à chaque lecture à partir de `podiums`. Pas de migration.

## 4. Erreurs

Aucune erreur métier nouvelle : le tableau se lit sans condition, et un tableau vide est une réponse normale (AS3).

## 5. Tests par scénario

| Scénario | Fichier de test                                                       | Niveau      | Ce que le test vérifie                                                           |
| -------- | --------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| AS1      | `apps/api/src/modules/podiums/domain/medal-table.spec.ts`             | unitaire    | comptage par pays et tri or, argent, bronze sur les trois podiums de la spec     |
| AS2      | `apps/api/src/modules/podiums/domain/medal-table.spec.ts`             | unitaire    | égalité parfaite : même rang, suivant au rang 3 ; ordre alphabétique stable      |
| AS3      | `apps/api/src/modules/podiums/domain/medal-table.spec.ts`             | unitaire    | aucun podium : tableau vide                                                      |
| AS1, AS3 | `apps/api/src/modules/podiums/application/medals.application.spec.ts` | application | `GetMedalTable` lit les podiums du repository et rend le tableau, ou rien        |
| AS1, AS3 | `apps/api/test/medals.e2e.spec.ts`                                    | e2e         | `200` avec `{ items }` conforme à `medalTableSchema` ; `200` et `[]` sans podium |
| AS4      | `apps/api/test/medals.e2e.spec.ts`                                    | e2e         | un podium enregistré par `POST` change aussitôt le tableau lu par `GET`          |

## 6. Tâches

- [ ] T01 [004-AS1, AS2, AS3] Écrire d'abord `apps/api/src/modules/podiums/domain/medal-table.spec.ts` (« 004-AS1: counts and sorts medals », « 004-AS2: ranks tied countries together », « 004-AS3: returns an empty table without podiums »), puis `domain/medal-table.ts`
- [ ] T02 [004-AS1, AS3] Écrire d'abord `apps/api/src/modules/podiums/application/medals.application.spec.ts` (« 004-AS1: builds the table from recorded podiums », « 004-AS3: returns an empty table when nothing is recorded »), puis `list()` du port et du faux repository, et `get-medal-table.ts`
- [ ] T03 [004-AS1, AS3, AS4] Écrire d'abord `apps/api/test/medals.e2e.spec.ts` (« 004-AS1: serves the sorted table (200) », « 004-AS3: serves an empty table (200) », « 004-AS4: follows newly recorded podiums »), puis `list()` Drizzle, `medals.controller.ts` et `podiums.module.ts`
