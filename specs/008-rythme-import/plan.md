# 008 — Rythme de l'import des résultats officiels : plan

**Statut** : Validé

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
- **outillage** : `apps/api/scripts/fake-official-site.mts` (script `dev:fake-site`) sert un faux site officiel pour la QA et gagne la route `/__final` qui ajoute une finale terminée à chaud (aujourd'hui, hier ou un jour donné).

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
- [x] T02 [008-AS2, AS5] Écrire d'abord `application/run-scrape.application.spec.ts` (« 008-AS2: … »), puis le genre `incremental` dans `RunScrape` et `collectOfficialPodiums` (épreuves connues non relues), le statut `skipped`, la colonne `kind` (migration générée) et les dépôts
- [x] T03 [008-AS1, AS3, AS5, AS6, AS7] Écrire d'abord `run-due-scrape.application.spec.ts`, `check-staleness.application.spec.ts` et `test/scraping.e2e.spec.ts` (« 008-AS6: … »), puis `RunDueScrape`, `CheckStaleness`, `GetScrapeStatus`, le planificateur, le schéma partagé et le contrôleur
- [x] T04 [008-AS8] Écrire d'abord `features/scraping/freshness-banner.test.tsx` (« 008-AS8: … »), puis `FreshnessBanner`, la requête, la fausse API et l'affichage sous l'en-tête
- [x] T05 [008-AS1] Écrire d'abord `app-config.spec.ts` (« 008-AS1: reads the rhythm settings … »), puis mettre à jour `deploy/alpha/docker-compose.yml`, `deploy/alpha/README.md`, `README.md` et `apps/api/.env.example` avec les nouvelles variables, sans secret

## Corrections

Passage 3 (relectures indépendantes). Chaque ligne cite un test écrit d'abord et vu en échec quand c'est du code.

- [x] T06 [008-AS5] Écrire d'abord (« 008-AS5: traces as skipped a light import … », « … does not lose a full slot … », « … traces a full slot as skipped only when it expires … ») dans `infra/scrape-scheduler.spec.ts`, sur le vrai planificateur, le vrai `RunDueScrape` et le vrai `RunScrape` (horloge et battements simulés), puis la suppression du verrou `busy` du planificateur : le garde de chevauchement est celui de `RunScrape`, l'import léger tombé pendant un autre est tracé `skipped`, le créneau complet dû pendant un import est retenu et retenté, tracé seulement s'il expire
- [x] T07 [008-AS3] Renforcer `application/run-due-scrape.application.spec.ts` (« 008-AS3: the 07:00 and 23:00 full imports apply the organizers corrections, and spare a TR4 correction ») : un podium importé corrigé par les organisateurs est mis à jour avec révision à 07:00 puis à 23:00, un podium corrigé à la main (TR4) reste protégé. Le comportement existait : le test ne pouvait pas être vu en échec
- [x] T08 [008-AS1] Amender la spec (AS1 : léger jusqu'à 22:45, à 23:00 le complet prend le créneau parce qu'il couvre un léger, rien à 23:01) et verrouiller ce choix par un test au niveau du domaine (`scrape-schedule.spec.ts`) et de l'application (`run-due-scrape.application.spec.ts`) : « 008-AS1: lets the light imports run until 22:45 … ». Le comportement existait : les tests ne pouvaient pas être vus en échec
- [x] T09 [008-AS6] Renforcer `test/scraping.e2e.spec.ts` (« 008-AS6: tells the kind, a real duration … ») : un import léger et un complet, durées non nulles obtenues en faisant avancer l'horloge injectée à chaque lecture de la source simulée (`onRead`), compteurs assertés par valeur
- [x] T10 [008-AS8] Corriger l'assertion négative de `freshness-banner.test.tsx` (« 008-AS8: says when the data was last updated … ») pour qu'elle puisse échouer (le texte réel est « n’ont pas été mis à jour »), et écrire dans la spec que « à jour » vaut l'heure de lancement du dernier import réussi (`lastSuccessAt`)
- [x] T11 [008-AS7] Ajouter l'outillage (`fake-official-site.mts`, route `/__final`, script `dev:fake-site`) à « Fichiers par couche » ; l'avertissement de retard est journalisé une seule fois par épisode : prouvé par `check-staleness.application.spec.ts` et, sur le vrai planificateur, par « 008-AS7: logs the stale warning once for the whole episode, over many beats » (`infra/scrape-scheduler.spec.ts`, Logger espionné)

Passe finale.

- [x] T12 [008-AS6] Écrire d'abord `domain/scrape-run.spec.ts` (« 008-AS6: gives the duration of a run … »), puis `durationMsOf` dans `scrape-run.ts` : le contrôleur ne fait plus que sérialiser
- [x] T13 [008-AS8] Écrire d'abord « 008-AS8: warns plainly when the data is stale and no import ever succeeded » dans `freshness-banner.test.tsx`, puis le cas `lastSuccessAt` nul et `stale` vrai dans `FreshnessMessage`

Passage 4 (QA rejouée sur 7b4ecfd).

- [x] T14 [008-AS8] Écrire d'abord quatre tests de `freshness-banner.test.tsx` (« … never claims a freshness it cannot check … », « … unreachable from the start », « … silent on … 404 », « … turns into a warning by itself … »), puis `FreshnessBanner` : échec de la lecture de l'état = avertissement « Impossible de vérifier la fraîcheur des données » (sauf 404), heure courante rafraîchie chaque minute et `isImportExpected` pour recompter le retard côté client. Les tests simulent la date (`Date` seule) pour ne pas dépendre du jour
- [x] T15 [008-AS8] Écrire d'abord « 008-AS8: leaves the freshness to the banner, with no second « Mis à jour le » line » (`routes/medailles.test.tsx`), puis la suppression de la ligne `dataUpdatedAt` de `routes/medailles.tsx` : le bandeau est la seule source de fraîcheur
