# 008 — Rythme de l'import des résultats officiels

> Spec : specs/008-rythme-import · Statut : ⬜ · Build : — · Testé : —
> Surfaces : [API] [WEB] · Profils : journaliste, supporter

## Préconditions

- **Jamais le vrai site officiel** : faux site `pnpm --filter @joj/api dev:fake-site 4010` (voir `playbooks/007-import-automatique.md`). Réglages à chaud en plus : `GET http://127.0.0.1:4010/__final?day=today&code=NEW-FNL&discipline=Judo&competition=Men%20-73%20kg%20Final&medals=gold:USA,silver:CAN,bronze:ARG` ajoute une finale terminée aujourd'hui (`day` : `today`, `yesterday` ou `AAAA-MM-JJ`) ; `/__set`, `/__fail`, `/__raw`, `/__heal` comme au playbook 007.
- API compilée (`pnpm build`) sur une base neuve : `SCRAPING_ENABLED=true SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp SCRAPING_REQUEST_DELAY_MS=0 SCRAPING_TICK_SECONDS=5 PGLITE_DATA_DIR=.data/playbook-008 PORT=3108 pnpm --filter @joj/api start`. Les imports tournent en heure de Dakar (= UTC). Pour jouer à n'importe quelle heure de la journée, poser `SCRAPING_WINDOW_START=00:00 SCRAPING_WINDOW_END=23:59` ; les scénarios 008-AS1 posent leur propre fenêtre.
- Réglages par défaut du rythme : imports complets à `SCRAPING_FULL_TIMES=07:00,23:00`, léger toutes les `SCRAPING_INTERVAL_MINUTES=15` dans la fenêtre `08:00` à `23:00`, retard après `SCRAPING_STALE_AFTER_MINUTES=120`. Pour accélérer : `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_STALE_AFTER_MINUTES=1`.
- L'état se lit sur `GET http://127.0.0.1:3108/api/scraping` : `lastSuccessAt`, `stale`, `lastRun`, `lastFullRun`, `recentRuns` (genre `kind`, `status`, `durationMs`, `counts`). Le jour courant est la date UTC du poste ; le faux site met ses finales du 1er et 2 novembre, et `__final` les met aujourd'hui ou hier.

## Scénarios

### 008-AS1.1 — [API] Un import léger toutes les minutes dans la fenêtre, rien avant l'ouverture

**Profil** : journaliste
**Priorité** : critique
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_WINDOW_START` réglé sur la minute suivante (heure UTC) et `SCRAPING_WINDOW_END=23:59` ; lire `recentRuns` avant puis après le passage de cette minute, pendant 3 minutes.
**Attendu** : avant l'ouverture, seul le rattrapage au démarrage (`kind: full`, `trigger: startup`) existe ; à l'ouverture, un import `kind: incremental` part, puis un par minute ; aucun import léger ne part avant l'heure d'ouverture.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS1.2 — [API] Une fenêtre qui se ferme arrête les imports légers

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_WINDOW_START=00:00` et `SCRAPING_WINDOW_END` réglé sur la minute qui vient (heure UTC) ; observer 3 minutes.
**Attendu** : des imports légers jusqu'à la minute de fermeture comprise (à la minute près), plus aucun ensuite ; `GET /api/scraping` reste lisible.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS2.1 — [API] Le léger ne lit qu'hier et aujourd'hui, et ne rouvre que les finales nouvelles

**Profil** : supporter
**Priorité** : critique
**Technique** : table-décision
**Action** : après un premier import complet, ajouter une finale aujourd'hui (`__final?day=today&code=NEW-FNL…`), attendre un import léger, puis relire `lastRun.report`. Ajouter une seconde finale et rejouer.
**Attendu** : `lastRun.kind: incremental`, `exhaustiveness.daysRead` = hier et aujourd'hui seulement (jamais le 1er novembre), `imported` contient la finale nouvelle, `finalsKnown` compte les finales déjà en base sans les rouvrir ; une finale déjà importée n'est pas relue ; `updated`, `kept` et `absentFromSource` restent vides.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS3.1 — [API] Un import complet aux heures configurées, une seule fois

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : lancer l'API avec `SCRAPING_FULL_TIMES=<HH:MM dans 2 minutes>,23:00` (heure UTC) et `SCRAPING_TICK_SECONDS=5` ; observer jusqu'à 2 minutes après l'heure.
**Attendu** : à l'heure réglée, une exécution `kind: full`, `trigger: scheduled` (en plus du rattrapage au démarrage) qui lit tous les jours des Jeux jusqu'à aujourd'hui ; une seule exécution complète par créneau ; `nextFullRunAt` rend le créneau suivant.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS3.2 — [API] Une correction des organisateurs n'est reprise que par l'import complet

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après un import complet, `__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA`, attendre un import léger puis lire le podium de la natation ; lancer ensuite `POST /api/scraping/runs` (import complet) et relire.
**Attendu** : après le léger, le podium garde GBR, ITA, FRA ; après l'import complet, il prend ITA, GBR, FRA, l'ancienne version est consultable (`GET /api/podiums/:id/revisions`) et `lastFullRun.report.updated` donne l'ancien et le nouveau.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS4.1 — [API] Le rattrapage au démarrage est complet, jamais un battement tardif

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base neuve ; démarrer l'API une première fois, la laisser faire son import, l'arrêter, la relancer avec la même base ; relire `recentRuns`.
**Attendu** : le premier démarrage lance un import complet `trigger: startup` ; le redémarrage rapide n'en lance pas de nouveau (le dernier succès est récent). Un démarrage après plus de 24 h sans succès lance un complet `startup` (jouable en laissant une base vieille ; sinon noté ⏭️).
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS5.1 — [API] Un import léger tombé pendant un complet est sauté et tracé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : `SCRAPING_REQUEST_DELAY_MS=1000`, `SCRAPING_INTERVAL_MINUTES=1` ; laisser passer une minute après un import, puis `POST /api/scraping/runs` (complet lent) ; relire `recentRuns` pendant et après.
**Attendu** : un import léger dû pendant le complet apparaît avec `status: skipped`, `kind: incremental`, `skippedReason` (« un autre import est en cours »), `errors` vide, sans aucune requête vers le faux site pendant ce temps ; le complet se termine normalement ; aucune erreur dans les logs.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS5.2 — [API] Un import complet manuel pendant un autre est refusé

**Profil** : journaliste
**Priorité** : normal
**Technique** : erreur
**Action** : comme 008-AS5.1, envoyer deux `POST /api/scraping/runs` à la suite.
**Attendu** : le premier `202`, le second `409` `SCRAPE_ALREADY_RUNNING` avec un message en français.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS6.1 — [API] Un compte rendu qui dit le genre, la durée et la fraîcheur

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : après quelques imports légers et un complet, lire `GET /api/scraping`.
**Attendu** : chaque entrée de `recentRuns` porte `kind`, `status`, `durationMs`, `counts` ; `lastSuccessAt` est le début du dernier import ni échoué ni sauté ; `lastRun` est la dernière vraie exécution ; `lastFullRun` garde la comparaison complète même après des imports légers ; `nextFullRunAt` donne le prochain 07:00 ou 23:00.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS7.1 — [API] Retard annoncé une seule fois, puis retour à jour

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : `SCRAPING_STALE_AFTER_MINUTES=1`, fenêtre ouverte toute la journée ; après un import réussi, `GET .../__fail?match=nh%2Fen` (le site tombe), attendre 3 minutes en relisant l'état et les logs ; puis `__heal` et attendre le prochain import.
**Attendu** : `stale: true` dès la deuxième minute sans succès et un seul avertissement « Données périmées » dans les logs (`CheckStaleness`) pendant l'épisode ; après le retour du site et un import réussi, `stale: false` et une ligne « Données de nouveau à jour ».
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS7.2 — [API] Jamais « périmé » hors fenêtre ni importé éteint

**Profil** : supporter
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : lancer l'API sans `SCRAPING_ENABLED`, puis avec la fenêtre `SCRAPING_WINDOW_START=00:00 SCRAPING_WINDOW_END=00:05` hors de l'heure courante ; lire `stale`.
**Attendu** : `stale: false` dans les deux cas, aucun avertissement dans les logs.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 008-AS8.1 — [WEB] Le bandeau « Données à jour à HH:MM » et son avertissement

**Profil** : supporter
**Priorité** : critique
**Technique** : transition-état
**Action** : API activée avec `SCRAPING_STALE_AFTER_MINUTES=1`, front lancé (`pnpm --filter @joj/web dev`) ; ouvrir `/medailles`, `/resultats?day=2026-11-01` puis `/` à 375 px puis 320 px, juste après un import, puis deux minutes après avoir coupé le faux site ; recharger. Éteindre l'import (sans `SCRAPING_ENABLED`) et recharger.
**Attendu** : juste après l'import, un bandeau « Données à jour à HH:MM » (heure du dernier succès, Dakar) sous aucune autre alerte ; après le retard, le bandeau devient « Les résultats sont peut-être en retard » avec « Ils n'ont pas été mis à jour depuis HH:MM. Revenez dans quelques minutes. » ; import éteint : aucun bandeau ; texte lisible sans coupure ni débordement à 320 px, console propre.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

## Session imprévisible

Voir [`transverse.md`](transverse.md) : le bandeau est le seul élément d'écran ajouté ; le testeur vérifie qu'il ne masque ni l'en-tête ni la navigation, qu'il se met à jour sans rechargement (relecture toutes les minutes), et que `GET /api/scraping` renvoyant `404` ou une page d'erreur (ancienne API) laisse la page sans bandeau, sans message d'erreur.
