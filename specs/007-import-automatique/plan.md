# 007 — Import automatique des résultats officiels : plan

**Statut** : Validé

## 1. Résumé

On crée le module `scraping` dans l'API : il lit le calendrier et les pages « Medallists » du site officiel, transforme chaque finale terminée en podium, le compare à la base et l'importe sans doublon, puis écrit un compte rendu d'exécution consultable. Une horloge interne le lance chaque jour à 23:00 (Africa/Dakar) pendant les Jeux et le rattrape au démarrage ; une route permet de le lancer à la demande. Six tâches : parsing et script, modèle du podium (second bronze, origine), comparaison et cas d'usage, persistance et source HTTP, horloge et routes, déploiement et documentation. On laisse de côté l'écran et l'affichage du second bronze.

Correction (T02) : l'origine d'un podium se déduit de son identifiant (celui de l'import est stable, celui d'une saisie à la main est aléatoire), il n'y a donc pas de colonne `source` ; `second_bronze` seule est ajoutée, par une migration `add_podium_second_bronze`. La configuration `SCRAPING_*` est ajoutée dès T01, le script en ayant besoin.

Choix faits sans que la spec les impose (à contester) :

- **Règle de conflit** : la clé d'une épreuve est son nom en minuscules (`eventKey`, déjà unique en base). Absente : insertion avec l'identifiant stable de l'import. Identique : rien. Différente : mise à jour seulement si le podium porte l'identifiant stable de l'import et n'a jamais été corrigé ; sinon (saisi à la main, identifiant aléatoire, ou corrigé via TR4) il reste et l'écart est listé.
- **Mise à jour officielle** : elle garde l'ancienne version dans `podium_revisions` mais ne pose pas `corrected_at` (réservé aux corrections du journaliste).
- **Second bronze** : colonne `second_bronze` nullable (judo, lutte, triathlon). Une égalité à l'or ou à l'argent est ignorée (raison `TIED_PLACES`).
- **Finales atypiques** : toute unité terminée dont le code contient `FNL-` est candidate, hors placements, bronze, séries et manches ; sa page « Medallists » dit s'il y a un podium.
- **Exécution asynchrone** : `POST /api/scraping/runs` rend 202 et le résultat se lit sur `GET /api/scraping`. Les jours futurs ne sont pas lus.
- Le code de lecture du site vit dans un seul fichier de `domain/` sans import relatif, pour que le script `pnpm db:scrape` (Node, sans compilation) l'importe tel quel.

| Dans la spec        | Dans le code               | Ce que c'est                                                            |
| ------------------- | -------------------------- | ----------------------------------------------------------------------- |
| finale, podium      | `FinalUnit`, `PodiumDraft` | l'unité du site, et le podium qu'on en tire                             |
| ignorée avec raison | `IgnoredFinal`             | une finale vue mais non importée, avec `reason`                         |
| compte rendu        | `ScrapeRun`                | une exécution : horaires, compteurs, comparaison, exhaustivité          |
| écart               | `PodiumDifference`         | épreuve dont la source diffère de la base, avec les deux podiums        |
| 23:00 à Dakar       | `dueReason`                | décide si une exécution est due (horaire, rattrapage, fenêtre des Jeux) |

## 2. Fichiers par couche

On crée `apps/api/src/modules/scraping/`, organisé comme le module `podiums`.

- **shared** : `packages/shared/src/scraping.ts` porte `scrapeStatusSchema`, `scrapeRunSchema` et `startScrapeResponseSchema` ; `podiums.ts` gagne `secondBronze` (nullable, facultatif) dans les réponses.
- **domain** : `official-results.ts` lit les pages, construit les `PodiumDraft` et collecte (`collectOfficialPodiums`). `podium-reconciliation.ts` compare drafts et base. `scrape-schedule.ts` calcule heure locale et échéances. `scraping.errors.ts` : `SCRAPE_ALREADY_RUNNING`.
- **application** : ports `ResultsSource`, `ImportedPodiumRepository`, `ScrapeRunRepository`, `Clock`, jeton `SCRAPING_SETTINGS` ; cas d'usage `RunScrape` (verrou, collecte, comparaison, écriture, compte rendu), `RunDueScrape` (appelé par l'horloge), `GetScrapeStatus` ; fakes dans `application/testing/`.
- **infra** : `scraping.schema.ts` (table `scrape_runs`), `drizzle-imported-podium.repository.ts`, `drizzle-scrape-run.repository.ts`, `official-site-http.ts` (lecture du site : délai poli, délai maximal, `fetch` injectable, partagé avec le script) et `http-results-source.ts` (adaptateur Nest), `system-clock.ts`, `scrape-scheduler.ts` (minuteur, démarrage).
- **http** : `GET /api/scraping` rend l'état et le dernier compte rendu complet (200) ; `POST /api/scraping/runs` lance une exécution (202), 409 si une tourne. Le POST est protégé en production par l'authentification de Traefik (écritures).
- **podiums** : `podiums.schema.ts` gagne `secondBronze` ; `Podium` et le tableau des médailles comptent le second bronze.
- **config** : `core/config/app-config.ts` gagne les variables `SCRAPING_*` ; `scripts/scrape-results.mts` devient un mince appel à `collectOfficialPodiums`.
- **web** : rien : l'écran est hors périmètre.

## 3. Données

`podiums` gagne `second_bronze` varchar(3) nullable (contrainte : différent des trois autres pays). Table `scrape_runs` : `id` uuid clé primaire ; `trigger` (`scheduled`, `manual`, `startup`) ; `status` (`success`, `partial`, `failed`) ; `started_at`, `finished_at` ; `imported`, `updated`, `identical`, `differing`, `absent`, `ignored`, `errors` (entiers, lisibles sans ouvrir le détail) ; `report` jsonb (comparaison, exhaustivité, messages). Index sur `started_at`. Migrations : `pnpm db:generate --name=add_podium_second_bronze`, puis `--name=create_scrape_runs`.

## 4. Erreurs

| Code AppError            | Catégorie | HTTP | Quand                                          | Scénario |
| ------------------------ | --------- | ---- | ---------------------------------------------- | -------- |
| `SCRAPE_ALREADY_RUNNING` | CONFLICT  | 409  | une exécution est en cours, une autre demandée | AS5      |

## 5. Tests par scénario

| Scénario | Fichier de test                                                                                      | Niveau                   | Ce que le test vérifie                                                               |
| -------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| AS1      | `application/run-scrape.application.spec.ts`                                                         | application              | trois podiums, seconde exécution sans effet ; `test/scraping.e2e.spec.ts` sur PGlite |
| AS2      | `domain/official-results.spec.ts`, `domain/medal-table.spec.ts`                                      | unitaire                 | finale non marquée or lue ; deux bronzes comptés                                     |
| AS3      | `domain/official-results.spec.ts`                                                                    | unitaire                 | deux ors : ignorée, raison `TIED_PLACES`                                             |
| AS4      | `application/run-scrape.application.spec.ts`, `infra/drizzle-imported-podium.repository.int.spec.ts` | application, intégration | podium corrigé ou manuel intact, écart listé, pas de doublon                         |
| AS5      | `application/run-scrape.application.spec.ts`                                                         | application              | jour et page en échec, reste importé ; seconde exécution refusée (409)               |
| AS6      | `domain/scrape-schedule.spec.ts`, `application/run-due-scrape.application.spec.ts`                   | unitaire, application    | 23:00 une fois, rattrapage, fenêtre, désactivé                                       |
| AS7      | `test/scraping.e2e.spec.ts`                                                                          | e2e                      | POST 202 puis GET : compteurs, écarts, exhaustivité, ignorées                        |

## 6. Tâches

- [x] T01 [007-AS2, AS3] Écrire d'abord `apps/api/src/modules/scraping/domain/official-results.spec.ts` (« 007-AS2: reads a final not flagged gold », « 007-AS3: ignores a tie with its reason »), puis `official-results.ts` (repris de `scripts/scrape-core.mts`, qui disparaît) et le script `scrape-results.mts` en mince appel
- [x] T02 [007-AS2] Écrire d'abord `podiums/domain/medal-table.spec.ts` (« 007-AS2: counts both bronze countries »), puis `secondBronze` et `source` dans `Podium`, le schéma, la migration générée, le mapper et les schémas partagés
- [x] T03 [007-AS1, AS4, AS5] Écrire d'abord `application/run-scrape.application.spec.ts` (« 007-AS1: … », « 007-AS4: … », « 007-AS5: … »), puis `podium-reconciliation.ts`, les ports, les fakes, `RunScrape`
- [x] T04 [007-AS4, AS5, AS7] Écrire d'abord `infra/drizzle-imported-podium.repository.int.spec.ts` (« 007-AS4: … »), puis `scraping.schema.ts`, la migration générée, les dépôts Drizzle et `http-results-source.ts`
- [x] T05 [007-AS6, AS7, AS1] Écrire d'abord `domain/scrape-schedule.spec.ts` (« 007-AS6: … »), `application/run-due-scrape.application.spec.ts` et `test/scraping.e2e.spec.ts` (« 007-AS7: … »), puis horloge, `RunDueScrape`, `GetScrapeStatus`, contrôleur, schémas partagés, configuration, module
- [x] T06 [007-AS6] Écrire d'abord `app-config.spec.ts` (« 007-AS6: treats an empty interval … » ; le reste du test est écrit en T01), puis variables de `deploy/alpha/docker-compose.yml`, `deploy/alpha/README.md`, `README.md`, `.env.example` et `exhaustivite.md`
