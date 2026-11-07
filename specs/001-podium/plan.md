# 001 — Enregistrer le podium d'une épreuve : plan

**Statut** : Validé

## 1. Résumé

On construit le module `podiums`, qui permet à un journaliste d'enregistrer le podium d'une épreuve : l'or, l'argent et le bronze, chacun étant un pays. À la fin, une requête `POST /api/podiums` enregistre le podium, refuse un second podium pour la même épreuve (conflit) et refuse un podium où un pays apparaît deux fois (règle métier). Le travail tient en cinq tâches, des schémas partagés jusqu'à la fausse API du front. On laisse de côté la lecture des podiums, le tableau des médailles, la correction et l'écran.

Les mots de la spec et leur nom dans le code :

| Dans la spec | Dans le code          | Ce que c'est                                                           |
| ------------ | --------------------- | ---------------------------------------------------------------------- |
| podium       | `Podium`              | l'entité du domaine : une épreuve et ses trois médaillés               |
| épreuve      | `eventName`           | le nom de l'épreuve, nettoyé des espaces en trop                       |
| identité     | `eventKey`            | le nom de l'épreuve en minuscules : sert à reconnaître la même épreuve |
| discipline   | `discipline`          | le nom de la discipline, en texte libre                                |
| jour         | `day`                 | le jour de l'épreuve, au format `AAAA-MM-JJ`                           |
| pays         | code pays (`gold`...) | un code de trois lettres majuscules (SEN, JPN, FRA)                    |
| enregistrer  | `RecordPodium`        | le cas d'usage qui crée et enregistre un podium                        |

## 2. Fichiers par couche

On crée le module `podiums` dans `apps/api/src/modules/podiums/`, organisé comme les modules de référence lus sur `main` (`disciplines`, `volunteers`) : un dossier par couche, plus `podiums.module.ts`.

- **shared** : `packages/shared/src/podiums.ts` contient les schémas Zod : `recordPodiumSchema` (la requête : nom d'épreuve de 1 à 100 caractères après nettoyage, discipline de 1 à 100 caractères, jour au format `AAAA-MM-JJ`, trois codes pays de la forme `[A-Z]{3}`) et `podiumSchema` (la réponse). Il est exporté par `packages/shared/src/index.ts`.
- **domain** :
  - `domain/podium.ts` contient la classe `Podium`. `Podium.create()` nettoie le nom de l'épreuve (espaces retirés aux extrémités et réduits entre les mots), calcule `eventKey`, et lève `PODIUM_COUNTRIES_NOT_DISTINCT` si deux pays sont identiques. `Podium.restore()` relit un podium sans rejouer les règles.
  - `domain/podiums.errors.ts` contient `PodiumError` et les deux erreurs métier du tableau de la section 4.
  - `domain/podium.spec.ts` est son test unitaire.
- **application** :
  - `application/podium.repository.ts` est le port : la classe abstraite `PodiumRepository` avec une seule méthode, `add(podium)`, qui lève `PODIUM_ALREADY_RECORDED` si l'épreuve a déjà un podium.
  - `application/use-cases/record-podium.ts` est le cas d'usage `RecordPodium` : il crée le `Podium`, puis appelle `add`.
  - `application/testing/in-memory-podium.repository.ts` est le faux repository des tests : même contrat que le vrai, sans base.
  - `application/podiums.application.spec.ts` teste le cas d'usage avec ce faux.
- **infra** :
  - `infra/podiums.schema.ts` décrit la table `podiums` (section 3).
  - `infra/podium.mapper.ts` convertit une ligne en `Podium` et inversement.
  - `infra/drizzle-podium.repository.ts` implémente `add` et traduit la violation d'unicité en `PODIUM_ALREADY_RECORDED`, comme `DrizzleSlotRepository` le fait pour l'email.
  - `infra/drizzle-podium.repository.int.spec.ts` le teste sur une base en mémoire.
- **http** : `http/podiums.controller.ts` expose `POST /api/podiums` : il valide le corps avec `recordPodiumSchema`, appelle `RecordPodium`, répond `201` avec le podium enregistré (`podiumSchema`). Aucune règle métier dedans. `podiums.module.ts` relie `PodiumRepository` à `DrizzlePodiumRepository`, et `apps/api/src/app.module.ts` l'ajoute à ses `imports`. Le test e2e est `apps/api/test/podiums.e2e.spec.ts`.
- **web** : pas d'écran. Mais toute route de l'API a son pendant dans la fausse API du front : on ajoute `POST /api/podiums` dans `apps/web/src/mocks/handlers.ts` (mêmes schémas, mêmes codes d'erreur), une liste `podiums` dans `apps/web/src/mocks/fixture.ts`, le titre `422` dans `TITLES`, et les tests dans `apps/web/src/mocks/handlers.test.ts`.

## 3. Données

On stocke un podium par ligne, dans la table `podiums`. Migration : `pnpm db:generate --name=create_podiums`.

| Colonne      | Type               | Contrainte          | Règle protégée                          |
| ------------ | ------------------ | ------------------- | --------------------------------------- |
| `id`         | uuid               | clé primaire        | identifie le podium                     |
| `event_name` | varchar(100)       | non nul             | le nom affiché de l'épreuve             |
| `event_key`  | varchar(100)       | non nul, **unique** | AS2 : une épreuve n'a qu'un seul podium |
| `discipline` | varchar(100)       | non nul             | la discipline, en texte libre           |
| `day`        | date               | non nul             | le jour de l'épreuve                    |
| `gold`       | varchar(3)         | non nul             | le pays médaillé d'or                   |
| `silver`     | varchar(3)         | non nul             | le pays médaillé d'argent               |
| `bronze`     | varchar(3)         | non nul             | le pays médaillé de bronze              |
| `created_at` | timestamp (ms, tz) | non nul             | la date d'enregistrement                |

Une contrainte `CHECK` de la table vérifie que `gold`, `silver` et `bronze` sont trois valeurs différentes : elle protège AS3 même si le domaine est contourné. L'index unique s'appelle `podiums_event_key_key`.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`) avec un code stable. La validation d'entrée (nom vide, pays mal formé, jour invalide) est faite par le schéma Zod et répond `400` avec le code générique de validation : elle n'a pas de scénario.

| Code AppError                   | Catégorie     | HTTP | Quand                                      | Scénario |
| ------------------------------- | ------------- | ---- | ------------------------------------------ | -------- |
| `PODIUM_ALREADY_RECORDED`       | CONFLICT      | 409  | l'épreuve a déjà un podium                 | AS2      |
| `PODIUM_COUNTRIES_NOT_DISTINCT` | BUSINESS_RULE | 422  | deux des trois médaillés sont le même pays | AS3      |

## 5. Tests par scénario

| Scénario | Fichier de test                                                            | Niveau      | Ce que le test vérifie                                                                |
| -------- | -------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| AS1      | `apps/api/src/modules/podiums/application/podiums.application.spec.ts`     | application | le podium est enregistré avec épreuve, discipline, jour et trois médaillés            |
| AS1      | `apps/api/test/podiums.e2e.spec.ts`                                        | e2e         | `201`, le corps contient le podium, et la base contient bien une ligne                |
| AS2      | `apps/api/src/modules/podiums/application/podiums.application.spec.ts`     | application | le second podium est refusé avec `PODIUM_ALREADY_RECORDED`, le premier reste inchangé |
| AS2      | `apps/api/src/modules/podiums/infra/drizzle-podium.repository.int.spec.ts` | intégration | l'index unique refuse le doublon, même avec un nom écrit autrement (casse, espaces)   |
| AS2      | `apps/api/test/podiums.e2e.spec.ts`                                        | e2e         | `409`, code `PODIUM_ALREADY_RECORDED`, une seule ligne en base                        |
| AS3      | `apps/api/src/modules/podiums/domain/podium.spec.ts`                       | unitaire    | `Podium.create` refuse deux pays identiques avec `PODIUM_COUNTRIES_NOT_DISTINCT`      |
| AS3      | `apps/api/test/podiums.e2e.spec.ts`                                        | e2e         | `422`, code `PODIUM_COUNTRIES_NOT_DISTINCT`, aucune ligne en base                     |
| AS1–AS3  | `apps/web/src/mocks/handlers.test.ts`                                      | mock front  | la fausse API répond `201`, `409` et `422` avec les mêmes codes que la vraie          |

## 6. Tâches

- [x] T01 [001-AS3] Écrire d'abord `apps/api/src/modules/podiums/domain/podium.spec.ts` (« 001-AS3: refuses a podium with a repeated country »), puis `packages/shared/src/podiums.ts`, `domain/podium.ts` et `domain/podiums.errors.ts`
- [x] T02 [001-AS1, AS2] Écrire d'abord `apps/api/src/modules/podiums/application/podiums.application.spec.ts` (« 001-AS1: records a podium », « 001-AS2: refuses a second podium for the same event »), puis `podium.repository.ts`, `in-memory-podium.repository.ts` et `record-podium.ts`
- [x] T03 [001-AS2] Écrire d'abord `apps/api/src/modules/podiums/infra/drizzle-podium.repository.int.spec.ts` (« 001-AS2: refuses a duplicate event even written differently »), puis `podiums.schema.ts`, la migration générée, `podium.mapper.ts` et `drizzle-podium.repository.ts`
- [ ] T04 [001-AS1, AS2, AS3] Écrire d'abord `apps/api/test/podiums.e2e.spec.ts` (« 001-AS1: records a podium (201) », « 001-AS2: refuses a second podium (409) », « 001-AS3: refuses a repeated country (422) »), puis `podiums.controller.ts`, `podiums.module.ts` et l'import dans `app.module.ts`
- [ ] T05 [001-AS1, AS2, AS3] Écrire d'abord `apps/web/src/mocks/handlers.test.ts` (« 001-AS1: mock records a podium », « 001-AS2: mock refuses a second podium », « 001-AS3: mock refuses a repeated country »), puis le handler, la fixture et le titre `422`
