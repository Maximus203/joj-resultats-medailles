# 008 — Rythme de l'import des résultats officiels : plan

**Statut** : Brouillon

## 1. Résumé

On remplace l'horaire unique du module `scraping` (spec 007) par trois rythmes : un import léger toutes les 15 minutes de 08:00 à 23:00, un import complet à 07:00 et 23:00, et le rattrapage complet au démarrage. Le léger ne lit que les calendriers d'aujourd'hui et d'hier et n'ouvre que les finales pas encore en base ; il est sauté (et tracé « sauté ») quand un import tourne déjà. Chaque exécution porte son genre et sa durée, l'état expose `lastSuccessAt` et `stale`, un avertissement est journalisé une fois par épisode de retard, et un bandeau « Données à jour à HH:MM » s'affiche sur le front. Cinq tâches : horaires et configuration, import léger et genres d'exécution, ordonnancement et état, bandeau, déploiement et documentation. Le message Telegram est laissé de côté. La spec est séparée de la 007 parce que celle-ci atteint la limite de 70 lignes.

Choix faits sans que la spec les impose (à contester) :

- **Variables** : `SCRAPING_INTERVAL_MINUTES` (15 par défaut) devient la cadence de l'import léger ; `SCRAPING_DAILY_TIME` est remplacée par `SCRAPING_FULL_TIMES` (liste `07:00,23:00`) ; nouvelles `SCRAPING_WINDOW_START` (08:00), `SCRAPING_WINDOW_END` (23:00, inclus à la minute) et `SCRAPING_STALE_AFTER_MINUTES` (120).
- **Cadence** : un import léger part quand le dernier import (réussi, échoué ou sauté) date de l'intervalle ; un import complet remet le compteur à zéro. Un import sauté compte : le créneau est perdu, on ne le rejoue pas.
- **Import léger** : il n'insère que les épreuves absentes de la base (comparaison par `normalizeEventKey`) ; il ne met à jour, ne compare et ne signale rien (c'est le rôle du complet).
- **Périmé** : `stale` est vrai si l'import est activé, dans les Jeux, dans la fenêtre, et que le dernier succès (ni échoué ni sauté) date de plus que le seuil, ou n'existe pas.
- **Suivi** : la table `scrape_runs` gagne `kind` (`full` par défaut) ; le statut gagne `skipped`. L'état gagne `lastFullRun` (le dernier compte rendu de comparaison, que le léger n'écrase pas dans l'affichage).

| Dans la spec        | Dans le code      | Ce que c'est                                                          |
| ------------------- | ----------------- | --------------------------------------------------------------------- |
| léger, complet      | `ScrapeKind`      | `incremental` ou `full`                                               |
| fenêtre 08:00-23:00 | `inWindow`        | les heures où l'import léger tourne, dans le fuseau configuré         |
| périmé              | `isStale`         | aucun import réussi depuis le seuil, dans la fenêtre                  |
| sauté               | statut `skipped`  | import léger tombé pendant un autre : tracé sans lecture ni erreur    |
| bandeau             | `FreshnessBanner` | composant du front : heure du dernier succès, avertissement si périmé |

## 2. Fichiers par couche

On étend le module `scraping`.

- **shared** : `packages/shared/src/scraping.ts` : genre, durée, statut `skipped`, `finalsKnown`, `lastSuccessAt`, `stale`, `lastFullRun`, et l'horaire (`fullTimes`, fenêtre, seuil).
- **domain** : `scrape-schedule.ts` décide du genre et du motif (créneaux complets, fenêtre, intervalle, rattrapage) et de `isStale` ; `official-results.ts` sait ne pas relire une épreuve connue ; `scrape-run.ts` gagne `kind` et `skipped`.
- **application** : `RunScrape.execute(trigger, kind)` (léger : jours d'hier et d'aujourd'hui, insertions seules) et `recordSkipped` ; `RunDueScrape` décide et saute ; `CheckStaleness` journalise le passage à périmé ; `GetScrapeStatus` expose les nouveaux champs.
- **infra** : `scraping.schema.ts` (colonne `kind`, migration générée), dépôts Drizzle et en mémoire (`lastStartedAt`, `lastAttemptAt`), `scrape-scheduler.ts` appelle aussi `CheckStaleness`.
- **http** : `GET /api/scraping` rend les nouveaux champs ; `POST /api/scraping/runs` lance toujours un import complet.
- **config** : `env-schema.ts` : nouvelles variables, cohérence (fenêtre, heures).
- **web** : `features/scraping/` (appel, requête, `FreshnessBanner`), affiché sous l'en-tête des pages publiques ; la fausse API gagne `GET /api/scraping`.

## 3. Données

`scrape_runs` gagne `kind` varchar(11) non nul, défaut `full` (migration `add_scrape_run_kind`). Le champ `report.exhaustiveness.finalsKnown` vit dans le JSON ; les anciens comptes rendus sont lus avec la valeur 0.

## 4. Erreurs

| Code AppError            | Catégorie | HTTP | Quand                                             | Scénario |
| ------------------------ | --------- | ---- | ------------------------------------------------- | -------- |
| `SCRAPE_ALREADY_RUNNING` | CONFLICT  | 409  | un import complet manuel demandé pendant un autre | AS5      |

## 5. Tests par scénario

| Scénario | Fichier de test                                                                                                  | Niveau                     | Ce que le test vérifie                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| AS1      | `domain/scrape-schedule.spec.ts`, `application/run-due-scrape.application.spec.ts`                               | unitaire, application      | bornes 07:59, 08:00, 23:00, 23:01, quart d'heure, fuseau, hors Jeux    |
| AS2      | `application/run-scrape.application.spec.ts`                                                                     | application                | deux calendriers lus, pages des médaillés seulement pour les nouvelles |
| AS3      | `domain/scrape-schedule.spec.ts`, `application/run-due-scrape.application.spec.ts`                               | unitaire, application      | 07:00 et 23:00 : complet, une fois par créneau                         |
| AS4      | `domain/scrape-schedule.spec.ts`                                                                                 | unitaire                   | rattrapage complet, pas de battement tardif                            |
| AS5      | `application/run-due-scrape.application.spec.ts`                                                                 | application                | léger sauté et tracé `skipped`                                         |
| AS6      | `test/scraping.e2e.spec.ts`                                                                                      | e2e                        | genre, durée, `lastSuccessAt`, `lastFullRun`                           |
| AS7      | `domain/scrape-schedule.spec.ts`, `application/check-staleness.application.spec.ts`, `test/scraping.e2e.spec.ts` | unitaire, application, e2e | seuil, fenêtre, un seul avertissement par épisode                      |
| AS8      | `apps/web/src/features/scraping/freshness-banner.test.tsx`                                                       | écran                      | « Données à jour à 14:07 » puis avertissement                          |

## 6. Tâches

- [x] T01 [008-AS1, AS3, AS4, AS7] Écrire d'abord `domain/scrape-schedule.spec.ts` (« 008-AS1: … », « 008-AS3: … », « 008-AS4: … », « 008-AS7: … ») et `app-config.spec.ts`, puis `scrape-schedule.ts` (genre, créneaux, fenêtre, `isStale`) et les variables de `env-schema.ts`
- [ ] T02 [008-AS2, AS5] Écrire d'abord `application/run-scrape.application.spec.ts` (« 008-AS2: … »), puis le genre `incremental` dans `RunScrape` et `collectOfficialPodiums` (épreuves connues non relues), le statut `skipped`, la colonne `kind` (migration générée) et les dépôts
- [ ] T03 [008-AS1, AS3, AS5, AS6, AS7] Écrire d'abord `run-due-scrape.application.spec.ts`, `check-staleness.application.spec.ts` et `test/scraping.e2e.spec.ts` (« 008-AS6: … »), puis `RunDueScrape`, `CheckStaleness`, `GetScrapeStatus`, le planificateur, le schéma partagé et le contrôleur
- [ ] T04 [008-AS8] Écrire d'abord `features/scraping/freshness-banner.test.tsx` (« 008-AS8: … »), puis `FreshnessBanner`, la requête, la fausse API et l'affichage sous l'en-tête
- [ ] T05 [008-AS1] Écrire d'abord `app-config.spec.ts` (« 008-AS1: reads the rhythm settings … »), puis mettre à jour `deploy/alpha/docker-compose.yml`, `deploy/alpha/README.md`, `README.md` et `apps/api/.env.example` avec les nouvelles variables, sans secret
