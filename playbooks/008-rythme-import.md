# 008 — Rythme de l'import des résultats officiels

> Spec : specs/008-rythme-import · Statut : 🟡 · Build : journee @4b00d9f (worktree propre à ce commit, API compilée par le testeur, une base PGlite neuve par scénario, faux site ; horloge du processus décalée par un préchargement `Date` hors du dépôt pour les frontières 07:58, 08:00, 22:58, 23:00, 23:01) · Testé : 2026-11-08 (rejeu 3 : tous les 🟡 de la campagne précédente et les scénarios dont l'Attendu a changé, plus passage rapide ; non rejoués, observés sur 7b4ecfd : AS1.2, AS2.2, AS4.1, AS5.2, AS5.4, AS6.1, AS7.2, AS8.2) · Rejeu 4 sur journee @b2d6cc2 (worktree propre, faux site) : 008-AS7.1, AS7.3, AS8.1, AS8.3 (✅) ; session U10 (anti_slop) non rejouée.
> Surfaces : [API] [WEB] · Profils : journaliste, supporter

## Préconditions

- **Jamais le vrai site officiel** : faux site `pnpm --filter @joj/api dev:fake-site 4010` (voir `playbooks/007-import-automatique.md`). Réglages à chaud en plus : `GET http://127.0.0.1:4010/__final?day=today&code=NEW-FNL&discipline=Judo&competition=Men%20-73%20kg%20Final&medals=gold:USA,silver:CAN,bronze:ARG` ajoute une finale terminée aujourd'hui (`day` : `today`, `yesterday` ou `AAAA-MM-JJ`) ; `/__set`, `/__fail`, `/__raw`, `/__heal` comme au playbook 007.
- API compilée (`pnpm build`) sur une base neuve : `SCRAPING_ENABLED=true SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp SCRAPING_REQUEST_DELAY_MS=0 SCRAPING_TICK_SECONDS=5 PGLITE_DATA_DIR=.data/playbook-008 PORT=3108 pnpm --filter @joj/api start`. Les imports tournent en heure de Dakar (= UTC). Pour jouer à n'importe quelle heure de la journée, poser `SCRAPING_WINDOW_START=00:00 SCRAPING_WINDOW_END=23:59` ; les scénarios 008-AS1 posent leur propre fenêtre.
- Réglages par défaut du rythme : imports complets à `SCRAPING_FULL_TIMES=07:00,23:00`, léger toutes les `SCRAPING_INTERVAL_MINUTES=15` dans la fenêtre `08:00` à `23:00`, retard après `SCRAPING_STALE_AFTER_MINUTES=120`. Pour accélérer : `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_STALE_AFTER_MINUTES=2` (le seuil doit être strictement supérieur à l’intervalle : `STALE_AFTER=1` est refusé au démarrage).
- L'état se lit sur `GET http://127.0.0.1:3108/api/scraping` : `lastSuccessAt`, `stale`, `lastRun`, `lastFullRun`, `recentRuns` (genre `kind`, `status`, `durationMs`, `counts`). Le jour courant est la date UTC du poste ; le faux site met ses finales du 1er et 2 novembre, et `__final` les met aujourd'hui ou hier.

## Scénarios

### 008-AS1.1 — [API] Un import léger toutes les minutes dans la fenêtre, rien avant l'ouverture

**Profil** : journaliste
**Priorité** : critique
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_WINDOW_START` réglé sur la minute suivante (heure UTC) et `SCRAPING_WINDOW_END=23:59` ; lire `recentRuns` avant puis après le passage de cette minute, pendant 3 minutes.
**Attendu** : avant l'ouverture, seul le rattrapage au démarrage (`kind: full`, `trigger: startup`) existe ; à l'ouverture, un import `kind: incremental` part, puis un par minute ; aucun import léger ne part avant l'heure d'ouverture.
**Observé** : Rejeu 3 sur 4b00d9f, `INTERVAL=1`, `STALE_AFTER=5`, tick 5 s, horloge décalée : démarrage à 07:58:00, fenêtre par défaut 08:00-23:00 : `full` `startup` à 07:58:03, aucun léger à 07:59:xx, premier `incremental` `scheduled` à 08:00:03.
**Verdict** : ✅
**Issue** : —

### 008-AS1.2 — [API] Une fenêtre qui se ferme arrête les imports légers

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_WINDOW_START=00:00` et `SCRAPING_WINDOW_END` réglé sur la minute qui vient (heure UTC) ; observer 3 minutes.
**Attendu** : des imports légers jusqu'à la minute de fermeture comprise (à la minute près), plus aucun ensuite ; `GET /api/scraping` reste lisible.
**Observé** : `WINDOW_START=00:00`, `WINDOW_END=15:44`, intervalle 1 minute, démarrage 15:42:25 : `startup` 15:42:25, légers à 15:43:25 et 15:44:25 (minute de fermeture comprise), plus aucun ensuite jusqu'à 15:48 ; `GET /api/scraping` reste lisible (`running: false`).
**Verdict** : ✅
**Issue** : —

### 008-AS2.1 — [API] Le léger ne lit qu'hier et aujourd'hui, et ne rouvre que les finales nouvelles

**Profil** : supporter
**Priorité** : critique
**Technique** : table-décision
**Action** : après un premier import complet, ajouter une finale aujourd'hui (`__final?day=today&code=NEW-FNL…`), attendre un import léger, puis relire `lastRun.report`. Ajouter une seconde finale et rejouer.
**Attendu** : `lastRun.kind: incremental`, `exhaustiveness.daysRead` = hier et aujourd'hui seulement (jamais le 1er novembre), `imported` contient la finale nouvelle, `finalsKnown` compte les finales déjà en base sans les rouvrir ; une finale déjà importée n'est pas relue ; `updated`, `kept` et `absentFromSource` restent vides.
**Observé** : Rejeu 3 : après un complet (5 importés), `__final?day=today&code=NEW-FNL…` : l'import léger suivant rend `kind: incremental`, `imported: [Judo – Men -73 kg]`, `daysRead: [2026-11-07, 2026-11-08]` (hier et aujourd'hui, jamais le 1er novembre), `updated`, `kept`, `absentFromSource` vides.
**Verdict** : ✅
**Issue** : —

### 008-AS3.1 — [API] Un import complet aux heures configurées, une seule fois

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : lancer l'API avec `SCRAPING_FULL_TIMES=<HH:MM dans 2 minutes>,23:00` (heure UTC) et `SCRAPING_TICK_SECONDS=5` ; observer jusqu'à 2 minutes après l'heure.
**Attendu** : à l'heure réglée, une exécution `kind: full`, `trigger: scheduled` (en plus du rattrapage au démarrage) qui lit tous les jours des Jeux jusqu'à aujourd'hui ; une seule exécution complète par créneau ; `nextFullRunAt` rend le créneau suivant.
**Observé** : `SCRAPING_FULL_TIMES=15:50,23:00`, tick 5 s, démarrage 15:48:43 : `full` `startup` à 15:48:43, puis une seule `full` `scheduled` à 15:50:03 qui lit les 8 jours du 1er au 8 novembre (`daysRead` complet, 7 identiques) ; aucune seconde exécution complète à 15:50:08 ni à 15:51:54 ; `nextFullRunAt: 2026-11-08T23:00:00.000Z`, `schedule.fullTimes: [15:50, 23:00]`.
**Verdict** : ✅
**Issue** : —

### 008-AS3.2 — [API] Une correction des organisateurs n'est reprise que par l'import complet

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après un import complet, `__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA`, attendre un import léger puis lire le podium de la natation ; lancer ensuite `POST /api/scraping/runs` (import complet) et relire.
**Attendu** : après le léger, le podium garde GBR, ITA, FRA ; après l'import complet, il prend ITA, GBR, FRA, l'ancienne version est consultable (`GET /api/podiums/:id/revisions`) et `lastFullRun.report.updated` donne l'ancien et le nouveau.
**Observé** : Rejeu 3 : `__set?code=S50-FNL&medals=gold:FRA,silver:ITA,bronze:GBR` alors que la base a ITA/GBR/FRA : après un import léger, le podium reste ITA/GBR/FRA ; après `POST /api/scraping/runs` (complet) il prend FRA/ITA/GBR, `lastFullRun.report.updated` donne `current.gold: ITA` et `source.gold: FRA`.
**Verdict** : ✅
**Issue** : —

### 008-AS4.1 — [API] Le rattrapage au démarrage est complet, jamais un battement tardif

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base neuve ; démarrer l'API une première fois, la laisser faire son import, l'arrêter, la relancer avec la même base ; relire `recentRuns`.
**Attendu** : le premier démarrage lance un import complet `trigger: startup` ; le redémarrage rapide n'en lance pas de nouveau (le dernier succès est récent). Un démarrage après plus de 24 h sans succès lance un complet `startup` (jouable en laissant une base vieille ; sinon noté ⏭️).
**Observé** : Base neuve : premier démarrage `full` `startup` (7 importés) ; redémarrage 20 s plus tard sur la même base : aucune exécution `startup` de plus (une seule ligne dans `recentRuns`) ; redémarrage avec l'horloge décalée de 25 h : nouveau `full` `startup` (7 identiques). Aucun battement tardif ne lance d'import : voir 008-AS1.3 pour les heures de frontière.
**Verdict** : ✅
**Issue** : —

### 008-AS5.1 — [API] Un import léger tombé pendant un complet est sauté et tracé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : `SCRAPING_REQUEST_DELAY_MS=1000`, `SCRAPING_INTERVAL_MINUTES=1` ; laisser passer une minute après un import, puis `POST /api/scraping/runs` (complet lent) ; relire `recentRuns` pendant et après.
**Attendu** : un import léger dû pendant le complet apparaît avec `status: skipped`, `kind: incremental`, `skippedReason` (« un autre import est en cours »), `errors` vide, sans aucune requête vers le faux site pendant ce temps ; le complet se termine normalement ; aucune erreur dans les logs.
**Observé** : Rejeu 3 : `SCRAPING_REQUEST_DELAY_MS=6000`, `INTERVAL=1` : pendant le complet (84 s) les imports légers dus à 16:58:42, 16:59:42 puis, pendant le complet manuel (17:00:35), à 17:00:42 et 17:01:42, apparaissent dans `GET /api/scraping` `recentRuns` avec `kind: incremental`, `trigger: scheduled`, `status: skipped`, `durationMs: 0`, `skippedReason: « un autre import est en cours »` ; les complets finissent `success` ; journal « Import incremental scheduled sauté : un autre import est en cours », aucune ligne `ERROR`. Corrigé depuis la campagne précédente. Réserve : à 1000 ms de retard le complet est plus court que l'intervalle et rien n'est sauté (retard réglé à 6000 ms, choix du testeur) ; chaque saut occupe une des dix lignes de `recentRuns` (quatre sauts pour un complet de 84 s).
**Verdict** : ✅
**Issue** : —

### 008-AS5.2 — [API] Un import complet manuel pendant un autre est refusé

**Profil** : journaliste
**Priorité** : normal
**Technique** : erreur
**Action** : comme 008-AS5.1, envoyer deux `POST /api/scraping/runs` à la suite.
**Attendu** : le premier `202`, le second `409` `SCRAPE_ALREADY_RUNNING` avec un message en français.
**Observé** : Deux `POST /api/scraping/runs` à la suite : premier `202`, second `409` `SCRAPE_ALREADY_RUNNING`, `detail` « Un import est déjà en cours : attends qu’il se termine avant d’en lancer un autre. » (français).
**Verdict** : ✅
**Issue** : —

### 008-AS6.1 — [API] Un compte rendu qui dit le genre, la durée et la fraîcheur

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : après quelques imports légers et un complet, lire `GET /api/scraping`.
**Attendu** : chaque entrée de `recentRuns` porte `kind`, `status`, `durationMs`, `counts` ; `lastSuccessAt` est le début du dernier import ni échoué ni sauté ; `lastRun` est la dernière vraie exécution ; `lastFullRun` garde la comparaison complète même après des imports légers ; `nextFullRunAt` donne le prochain 07:00 ou 23:00.
**Observé** : Après un démarrage, une dizaine de légers, un complet manuel et un complet planifié : chaque entrée de `recentRuns` porte `kind`, `status`, `durationMs`, `counts` (jamais `report`) ; `lastSuccessAt` = début du dernier import ni échoué ni sauté (15:47:24 alors que 15:46:24 était sauté) ; `lastRun` = dernière vraie exécution ; `lastFullRun` garde le complet (avec son `report.updated`) pendant que `lastRun` est un léger ; `nextFullRunAt` = 2026-11-08T23:00:00Z à 15:42 et 2026-11-09T07:00:00Z après 23:00.
**Verdict** : ✅
**Issue** : —

### 008-AS7.1 — [API] Retard annoncé une seule fois, puis retour à jour

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_STALE_AFTER_MINUTES=2`, fenêtre ouverte toute la journée ; après un import réussi, `GET .../__fail?match=nh%2Fen` (le site tombe), attendre 3 minutes en relisant l'état et les logs ; puis `__heal` et attendre le prochain import.
**Attendu** : `stale: true` dès la deuxième minute sans succès et un seul avertissement « Données périmées » dans les logs (`CheckStaleness`) pendant l'épisode ; après le retour du site et un import réussi, `stale: false` et une ligne « Données de nouveau à jour ».
**Observé** : Rejeu 4 : Action jouée telle qu'écrite (`INTERVAL=1`, `STALE_AFTER=2`, tick 5 s, fenêtre par défaut 08:00-23:00, jouée à 18 h) : site coupé 18:02:41, `stale: true` à 18:04:33 (la 2e minute), un seul « Données périmées » (18:04:32), site rétabli 18:06:46, `stale: false` 18:07:37 et une ligne « Données de nouveau à jour ». Lisibilité de l'Action mise à jour : claire sur les deux variables et l'épisode ; mais « fenêtre ouverte toute la journée » ne dit pas comment (il n'existe pas de variable à cet effet : il faut jouer dans 08:00-23:00 ou poser `SCRAPING_WINDOW_START/END`), l'URL est abrégée (`GET .../__fail`), et `SCRAPING_SOURCE_URL` du faux site n'est pas rappelé. Exécutable sans devinette dans la journée.
**Verdict** : ✅
**Issue** : —

### 008-AS7.2 — [API] Jamais « périmé » hors fenêtre ni importé éteint

**Profil** : supporter
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : lancer l'API sans `SCRAPING_ENABLED`, puis avec la fenêtre `SCRAPING_WINDOW_START=00:00 SCRAPING_WINDOW_END=00:05` hors de l'heure courante ; lire `stale`.
**Attendu** : `stale: false` dans les deux cas, aucun avertissement dans les logs.
**Observé** : Import éteint (`SCRAPING_ENABLED=false`) : `stale: false`, aucune ligne `CheckStaleness`. Site en panne, import actif, `STALE_AFTER=1`, fenêtre `00:00-00:05` hors de l'heure : `stale: false`, `lastSuccessAt: null`, aucune ligne `CheckStaleness` ; même panne avec fenêtre ouverte toute la journée (témoin) : `stale: true` et un avertissement.
**Verdict** : ✅
**Issue** : —

### 008-AS8.1 — [WEB] Le bandeau « Données à jour à HH:MM » et son avertissement

**Profil** : supporter
**Priorité** : critique
**Technique** : transition-état
**Action** : API activée avec `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_STALE_AFTER_MINUTES=2`, front lancé (`pnpm --filter @joj/web dev`) ; ouvrir `/medailles`, `/resultats?day=2026-11-01` puis `/` à 375 px puis 320 px, juste après un import, puis deux minutes après avoir coupé le faux site ; recharger. Éteindre l'import (sans `SCRAPING_ENABLED`) et recharger.
**Attendu** : juste après l'import, un bandeau « Données à jour à HH:MM » (heure du dernier succès, Dakar) sous aucune autre alerte ; après le retard, le bandeau devient « Les résultats sont peut-être en retard » avec « Ils n'ont pas été mis à jour depuis HH:MM. Revenez dans quelques minutes. » ; import éteint : aucun bandeau ; texte lisible sans coupure ni débordement à 320 px, console propre.
**Observé** : Rejeu 4 : API `INTERVAL=1`, `STALE_AFTER=2`, faux site, front Vite ; `/medailles` à 375 px et `/` à 320 px ouvertes ensemble, sans recharger : « Données à jour à 18:02 » (18:03) ; site coupé 18:02:41, passage à « Les résultats sont peut-être en retard / Ils n’ont pas été mis à jour depuis 18:02. Revenez dans quelques minutes. » à 18:05:28 (relecture d'une minute, `stale` API à 18:04:33) ; site rétabli 18:06:46, « Données à jour à 18:07 » à 18:08:29, sans rechargement ; `scrollWidth` = largeur dans tous les états. Captures `.test-shots/008-AS8.1-rejeu4-etat1…4-*`. Lisibilité de l'Action : la séquence (juste après l'import, puis 2 min après la coupure, recharger, éteindre) se lit et se joue ; il manque seulement la variable `SCRAPING_SOURCE_URL` du faux site et les deux minutes ne suffisent pas à voir l'alerte à l'écran (compter jusqu'à trois minutes à cause de la relecture d'une minute). Import éteint non rejoué (inchangé).
**Verdict** : ✅
**Issue** : —

### 008-AS1.3 — [API] Frontières d'horloge : 07:59, 08:00, 22:59, 23:00, 23:01 (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : valeurs-limites
**Action** : réglages par défaut du rythme (fenêtre 08:00-23:00, complets 07:00 et 23:00), `SCRAPING_INTERVAL_MINUTES=1`, tick 5 s, horloge du processus décalée par un préchargement `Date` (`FAKE_NOW`) : démarrer à 07:58:00 ; à 22:58:30 ; à 23:01:00 ; relire `recentRuns` de chaque base pendant 3 minutes.
**Attendu** : rien de léger avant 08:00 ; premier léger à l'ouverture ; à 23:00 un complet `scheduled` (et non un léger) ; rien de léger après 23:00:59 ; un démarrage à 23:01 fait son rattrapage complet puis plus rien.
**Observé** : Rejeu 3, fenêtre par défaut, `INTERVAL=1`, `STALE_AFTER=5`, tick 5 s, trois bases en parallèle, horloge décalée : démarrage à 07:58:00 → `full` `startup` 07:58:03, aucun léger avant 08:00, premier `incremental` 08:00:03 ; à 22:58:30 → `startup` 22:58:33, léger 22:59:33, `full` `scheduled` à 23:00:03 (et non un léger), rien ensuite, `nextFullRunAt: 2026-11-09T07:00:00Z` ; à 23:01:00 → `full` `startup` 23:01:03, puis plus rien. Limite : l'heure est décalée par un préchargement `Date` du processus, pas par l'horloge du système.
**Verdict** : ✅
**Issue** : —

### 008-AS4.2 — [API] Redémarrage à 22:59:00 et à 23:00:30 (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base avec un succès de 22:55 (horloge décalée), arrêter l'API, la relancer à 22:59:00 ; refaire avec un redémarrage à 23:00:30.
**Attendu** : pas de rattrapage (succès récent) ; le complet de 23:00 a lieu à 22:59 ; redémarré à 23:00:30, le créneau de 23:00 est manqué, personne ne le rattrape un battement tardif.
**Observé** : Rejeu 3, horloge décalée, base avec un complet réussi à 22:55:02 : redémarrage à 22:59:00 → aucun `startup`, le complet `scheduled` à 23:00:01 (`identical: 5`) ✅. Même base redémarrée à 23:00:30 (complet de 23:00:01 fait) → aucune exécution de plus ✅. Copie de la base d'avant 23:00 (dernier complet à 22:55:02) redémarrée à 23:00:30 → un complet `startup` à 23:00:31 : le créneau de 23:00 manqué pendant l'arrêt est rattrapé au redémarrage ✅ (`nextFullRunAt: 2026-11-09T07:00:00Z`). Corrigé depuis la campagne précédente, où un redémarrage à 23:00:30 perdait le complet de la nuit.
**Verdict** : ✅
**Issue** : —

### 008-AS2.2 — [API] Une finale ajoutée à chaud pendant un import complet (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : transition-état
**Action** : retard de 1 s par requête, `POST /api/scraping/runs` ; 3 s plus tard `__final?day=today&code=HOT1-FNL…`, 7 s plus tard (après la lecture du jour courant) `__final?day=today&code=HOT2-FNL…` ; relire le complet puis le léger suivant.
**Attendu** : la première finale entre dans le complet, la seconde est reprise par le léger suivant ; aucune erreur, aucun doublon.
**Observé** : complet 16:14:11 → 16:14:29 (17,4 s) : `imported: [Judo – Men -81 kg]` (HOT1 lue au calendrier du 8 novembre à 16:14:18), HOT2 absente ; léger de 16:15:12 : `imported: [Judo – Women -57 kg]`, `finalsKnown: 3`. Neuf podiums au total.
**Verdict** : ✅
**Issue** : —

### 008-AS5.3 — [API] Un complet de démarrage ou d'heure fixe plus long que l'intervalle ne laisse aucune trace de saut (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : erreur
**Action** : `SCRAPING_REQUEST_DELAY_MS=6000`, `SCRAPING_INTERVAL_MINUTES=1`, base neuve : le rattrapage de démarrage dure 96 s ; lire `recentRuns` à la fin.
**Attendu** : spec AS5 : l'import léger dû pendant le complet est enregistré `skipped` avec sa raison.
**Observé** : Rejeu 3 (retard 6000 ms, `INTERVAL=1`, base neuve) : le complet de rattrapage `startup` (16:58:37, 84 s) ne laisse plus de silence : les imports légers dus à 16:58:42 et 16:59:42 sont enregistrés `skipped` avec `skippedReason: « un autre import est en cours »` et le premier léger réel n'est pas perdu (même constat pendant un complet manuel, voir AS5.1). Corrigé depuis la campagne précédente.
**Verdict** : ✅
**Issue** : —

### 008-AS5.4 — [API] Source lente pendant un import léger (ajouté par le testeur)

**Profil** : supporter
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : `SCRAPING_REQUEST_TIMEOUT_MS=5000`, `SCRAPING_INTERVAL_MINUTES=1` ; l'intermédiaire retarde chaque réponse de 3 s (sous le délai) puis de 7 s (au-delà) ; pendant le premier léger, `POST /api/scraping/runs`.
**Attendu** : sous le délai, le léger réussit et le POST est refusé en français ; au-delà, des erreurs lisibles par jour, des podiums intacts, l'API vivante.
**Observé** : 3 s : léger `success` en 6,05 s, `running: true` pendant, POST → `409` français ; 7 s : léger `failed` en 10 s, deux erreurs « 2026-11-07 : calendrier illisible (délai de 5000 ms dépassé sur http://…) », `daysRead: []`, `lastSuccessAt` inchangé (16:16:29), podiums (9) intacts, `GET /api/health` → `200`.
**Verdict** : ✅
**Issue** : —

### 008-AS7.3 — [API] Retard réglé au niveau de l'intervalle : l'alerte clignote (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : table-décision
**Action** : le réglage accéléré du playbook : `SCRAPING_STALE_AFTER_MINUTES=2`, `SCRAPING_INTERVAL_MINUTES=1`, tick 5 s, site en bonne santé ; lire les journaux 4 minutes.
**Attendu** : aucune alerte tant que les imports réussissent.
**Observé** : Rejeu 4. (1) Base vide, import de démarrage de 21 s (délai 1500 ms, tick 5 s, `INTERVAL=1`, `STALE_AFTER=2`) : AUCUNE ligne « Données périmées » ni « Données de nouveau à jour » dans les logs pendant ni après l'import ; le tick à 18:01:32 est seulement « Import incremental scheduled sauté : un autre import est en cours ». (2) Vrai retard (site coupé 18:02:41, dernier succès 18:02:32) : un seul avertissement « Données périmées » à 18:04:32 (seuil 2 min) sur 4 min de panne, `stale: true` ; site rétabli 18:06:46, import réussi 18:07:32, une ligne « Données de nouveau à jour » à 18:07:37, `stale: false`. Constats restants, mineurs : pendant l'import de démarrage `GET /api/scraping` répond `running: true, stale: true, lastSuccessAt: null` (l'écran n'a pas été joué pendant ces 21 s : le bandeau y dirait « Aucune mise à jour réussie… », vrai mais alarmiste) ; les journaux mêlent français et valeurs brutes (« Import incremental scheduled sauté », « Import full startup success en 21158 ms »).
**Verdict** : ✅
**Issue** : —

### 008-AS3.3 — [API] Réglages absurdes refusés au démarrage (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : démarrer l'API avec `SCRAPING_INTERVAL_MINUTES` à 0, -1, 1.5, `abc` ; `SCRAPING_STALE_AFTER_MINUTES=0` ; `SCRAPING_TICK_SECONDS=0` ; `SCRAPING_FULL_TIMES` à `25:00`, `7h30`, `7:00`, `07:00,,23:00`, vide ; fenêtre inversée, début = fin, `24:00` ; jours à l'envers ; fuseau `Mars/Phobos`.
**Attendu** : refus « Configuration invalide » qui nomme la variable, en français, sortie en erreur, jamais de démarrage.
**Observé** : Rejeu 3 : réglages refusés avec le nom de la variable et une phrase française : `SCRAPING_FULL_TIMES` `25:00`, `7h30`, `07:00,,23:00` (→ `SCRAPING_FULL_TIMES[1]`), `SCRAPING_TICK_SECONDS` 0 (« doit être un entier positif ») et 301 (« doit être un entier entre 1 et 300 (secondes) »), `SCRAPING_STALE_AFTER_MINUTES` ≤ intervalle, jours à l'envers (« doit être le même jour que SCRAPING_LAST_DAY ou un jour avant »), `Mars/Phobos`. Tick 300 accepté. Non rejoués ce coup-ci (observés sur 7b4ecfd) : intervalle 0/-1/1.5/abc, fenêtre inversée, `24:00`.
**Verdict** : ✅
**Issue** : —

### 008-AS3.4 — [API] Une ancienne variable ou une valeur démesurée passent sans un mot (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : démarrer avec `SCRAPING_DAILY_TIME=25:00` (réglage supprimé par la spec 008) ; avec `SCRAPING_TICK_SECONDS=3000000`.
**Attendu** : un réglage inconnu ou démesuré est signalé.
**Observé** : Rejeu 3 : `SCRAPING_DAILY_TIME=25:00` : le serveur démarre et journalise « SCRAPING_DAILY_TIME est ignoré : voir SCRAPING_FULL_TIMES » (`WARN [AppConfig]`), puis « Import automatique actif : complet à 07:00, 23:00 … » ; `SCRAPING_TICK_SECONDS=3000000` : refusé au démarrage (« doit être un entier entre 1 et 300 (secondes) »). Corrigé depuis la campagne précédente.
**Verdict** : ✅
**Issue** : —

### 008-AS8.2 — [WEB] Une ancienne API ou une API coupée ne casse pas la page (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : intermédiaire local entre le front et l'API : `/api/scraping` répond `404`, puis une page HTML `502`, puis ferme la connexion ; recharger `/medailles` à chaque fois.
**Attendu** : pas de bandeau, pas de message d'erreur, le tableau s'affiche.
**Observé** : dans les trois cas : « AUCUN BANDEAU », 17 lignes de tableau, aucun message d'erreur ; console : seulement les lignes « Failed to load resource » du navigateur (404, 502 ×4 de nouvelles tentatives). Retour à la normale : bandeau « Données à jour à 16:17 ». Capture `.test-shots/008-AS8.1-ancienne-api-404-375-dark-after.jpg`. Ancienne API simulée par l'intermédiaire, pas par une vraie ancienne version.
**Verdict** : ✅
**Issue** : —

### 008-AS8.3 — [WEB] L'API ne répond plus pendant que la page est ouverte : le bandeau reste « à jour » (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : transition-état
**Action** : page `/medailles` ouverte avec le bandeau « Données à jour à 16:04 » ; toutes les routes `/api` coupées (connexion fermée) à 16:05:28 ; regarder 3 min 40 s puis recharger à froid.
**Attendu** : le bandeau ne continue pas d'affirmer que les données sont à jour quand plus rien ne se rafraîchit.
**Observé** : Rejeu 4 sur b2d6cc2. `/medailles` ouverte à 320 px, « Données à jour à 18:00 » ; API tuée ; rechargement à froid : bandeau d'alerte « Impossible de vérifier la fraîcheur des données » + « Le tableau n’a pas pu être chargé… » + « Réessayer » (capture `.test-shots/008-AS8.3-reessayer-api-coupee-320-light-before.png`). API relancée, clic sur « Réessayer » : dès le premier relevé, 0,6 s après, le tableau est revenu (13 lignes) ET le bandeau affiche « Données à jour à 18:00 » ; état stable sur les 5 s suivantes (capture `…-after.png`). Plus de contradiction d'une minute. Console : seulement le `502` de l'API coupée.
**Verdict** : ✅
**Issue** : —

### 008-AS8.4 — [WEB] Aucun import réussi depuis le démarrage : rien à l'écran (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : API activée sur base neuve, site officiel en panne depuis le démarrage (`stale: true`, `lastSuccessAt: null`) ; ouvrir `/medailles`, `/resultats?day=2026-11-01` et `/` à 320 px.
**Attendu** : un avertissement lisible : les données sont en retard.
**Observé** : Rejeu 3 : API activée sur base neuve, faux site en panne dès le démarrage (`stale: true`, `lastSuccessAt: null`, `lastRun.status: failed`, 8 erreurs) : `/medailles`, `/resultats?day=2026-11-01` et `/` à 320 px, puis `/medailles` à 375 px : bandeau d'alerte « Aucune mise à jour réussie pour l’instant / Les résultats peuvent être incomplets. Revenez dans quelques minutes. » au-dessus de l'en-tête, sans débordement (`scrollWidth` 320 et 375), capture `.test-shots/008-AS8.4-jamais-reussi-medailles-320-dark-after.jpg` et `…-375-…`. Corrigé depuis la campagne précédente (T13).
**Verdict** : ✅
**Issue** : —

## Session imprévisible

Voir [`transverse.md`](transverse.md) : le bandeau est le seul élément d'écran ajouté ; le testeur vérifie qu'il ne masque ni l'en-tête ni la navigation, qu'il se met à jour sans rechargement (relecture toutes les minutes), et que `GET /api/scraping` renvoyant `404` ou une page d'erreur (ancienne API) laisse la page sans bandeau, sans message d'erreur.

Exécuté par le testeur le 2026-11-08, build 7b4ecfd.

| #   | Geste                                                                      | Observé                                                                                                                                                                                                                            | Verdict |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| U1  | Horloge à 07:59, 08:00, 22:59, 23:00, 23:01                                | Voir 008-AS1.3 : rien avant 08:00, premier léger à 08:00:02, complet à 23:00:01, plus de léger après 23:00:59, rattrapage à 23:01.                                                                                                 | ✅      |
| U2  | Redémarrage à 22:59 et à 23:00:30                                          | Voir 008-AS4.2 : 22:59 tient, 23:00:30 rattrape le complet manqué au redémarrage.                                                                                                                                                  | ✅      |
| U3  | Finale ajoutée à chaud pendant un import complet                           | Voir 008-AS2.2 : la première entre dans le complet, la seconde dans le léger suivant.                                                                                                                                              | ✅      |
| U4  | Source lente pendant un léger, puis au-delà du délai                       | Voir 008-AS5.4 : `409` français pendant, `failed` lisible au-delà, API vivante.                                                                                                                                                    | ✅      |
| U5  | Double déclenchement manuel / six POST pendant un import                   | `202` puis `409` français (008-AS5.2) ; pendant le léger lent aussi (008-AS5.4).                                                                                                                                                   | ✅      |
| U6  | Bandeau quand l'API est injoignable, ancienne API, import éteint           | Voir 008-AS8.1 à AS8.4 : ancienne API et import éteint sans bandeau ni erreur ; API coupée en session ouverte : « Impossible de vérifier… » (≤ 1 min) ; jamais de succès : alerte ; défaut mineur après « Réessayer » (008-AS8.3). | 🟡      |
| U7  | Configuration absurde : intervalle 0, heures mal formées, fenêtre inversée | Voir 008-AS3.3 et AS3.4 : tous refusés en français, la variable nommée ; ancienne variable signalée, tick borné à 300 s.                                                                                                           | ✅      |
| U8  | Bandeau à 188 px (zoom 200 % simulé) et clavier seul                       | Texte rendu en entier à 188 px, sans coupure du bandeau (en-tête déjà rogné, constat de transverse.md) ; premier Tab sur « Aller au contenu » dans les deux états : le bandeau n'est pas focalisable, il ne prend pas le focus.    | ✅      |
| U9  | Console et réseau pendant tous les gestes du bandeau                       | Aucune erreur applicative ni avertissement React ; seules les lignes « Failed to load resource » provoquées volontairement (404/502 de l'intermédiaire).                                                                           | ✅      |
| U10 | Contrôle anti vibe-coding (`anti_slop.py`)                                 | Rejeu 3 : mêmes 3 ERREURS « lucide » (`apps/web/components.json:20`, `specs/design/artefact-design.html:1717` et `:2974`) et avertissement « page sans image » de `apps/web/index.html` (mascotte et logo présents) ; hors diff.   | 🟡      |

Non joué : réseau lent/coupé côté navigateur pendant un import (la panne a été simulée par l'intermédiaire, pas par l'émulation du navigateur), rotation de l'écran, deux onglets sur le bandeau, un vrai site officiel (interdit), un import complet de plus de 4 minutes au délai par défaut, la reprise après un redéploiement réel.

### Contexte de la campagne

- Choix du testeur : retard de 6000 ms et non 1000 ms pour 008-AS5.1 (un complet de 15 s ne chevauche jamais une minute d'intervalle) ; `SCRAPING_STALE_AFTER_MINUTES=2` pour 008-AS8.1 (à 1 minute, l'alerte clignote : 008-AS7.3) ; heures décalées par un préchargement `Date` hors du dépôt, intermédiaire local `/__p` pour journaliser les requêtes et retarder les réponses.
- La branche `journee` a avancé de treize commits pendant la campagne (jusqu'à `c841ac6`, dont T08 « le complet prend le créneau de 23:00, les légers finissent à 22:45 » et T13 « avertir quand aucun import n'a jamais réussi ») : non testés ici, à rejouer sur ce nouveau build.
