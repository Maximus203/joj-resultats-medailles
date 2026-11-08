# 008 — Rythme de l'import des résultats officiels

> Spec : specs/008-rythme-import · Statut : 🟡 · Build : journee @7b4ecfd (worktree propre, API compilée par le testeur, une base PGlite neuve par scénario, faux site + intermédiaire local qui journalise chaque requête ; horloge décalée par un préchargement `Date` hors du dépôt pour les frontières 07:59, 08:00, 22:59, 23:00, 23:01) · Testé : 2026-11-08
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
**Observé** : `SCRAPING_INTERVAL_MINUTES=1`, `SCRAPING_WINDOW_START=15:36`, démarrage à 15:34:33 : avant l'ouverture seul le rattrapage `full` `startup` (15:34:33) ; premier import `incremental` `scheduled` à 15:36:03 (le battement qui suit l'ouverture, pas de 15:35) ; puis 15:37:03, un par minute. Rejoué avec l'horloge décalée à la frontière : démarrage à 07:58:00, fenêtre 08:00 : aucun léger à 07:59:xx, premier à 08:00:02, puis 08:01:02.
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
**Observé** : Après un premier complet (7 finales), `__final?day=today&code=NEW-FNL…` : l'import léger suivant rend `kind: incremental`, `imported: [Judo – Men -73 kg]`, `daysRead: [2026-11-07, 2026-11-08]`, `finalsKnown: 0`, `updated`/`kept`/`absentFromSource` vides ; l'intermédiaire journalise 3 requêtes seulement (deux calendriers hier et aujourd'hui, une page de médailles), jamais le 1er novembre. Seconde finale (`NEW2-FNL`, hier) : une seule page de médailles demandée (NEW2), la finale déjà importée n'est pas relue ; `finalsSeen: 2`, `finalsWithPodium: 1`, `finalsKnown: 1`.
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
**Observé** : Source changée en GBR/ITA/FRA pendant que la base a ITA/GBR/FRA (import précédent) : après un import léger (15:41:04), le podium reste ITA/GBR/FRA ; après `POST /api/scraping/runs` (complet) il prend GBR/ITA/FRA, `/revisions` rend l'ancienne version ITA/GBR/FRA, `lastFullRun.report.updated` donne `current.gold: ITA` et `source.gold: GBR`. Le léger suivant (15:42:09) ne change pas `lastFullRun` : la comparaison complète est gardée.
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
**Observé** : Une exécution complète manuelle lente (`SCRAPING_REQUEST_DELAY_MS=6000`, 96 s, 16 requêtes espacées de 6 s au journal de l'intermédiaire) : à 15:46:24, un import léger dû est enregistré `kind: incremental`, `trigger: scheduled`, `status: skipped`, `durationMs: 0`, aucune requête de plus vers le faux site pendant ce temps (les 16 requêtes sont celles du complet), le complet finit `success`, aucune ligne `ERROR` ; le journal dit « Import incremental scheduled sauté : un autre import est en cours ». MAIS la raison n'est lisible que dans le journal et dans la base : `GET /api/scraping` n'expose pas `skippedReason` (`recentRuns` sans détail, `lastRun` écarte volontairement les exécutions sautées). Le playbook et la spec demandent « le suivi le montre … avec sa raison ». À 1000 ms de retard le complet (15 s) est plus court que l'intervalle : le saut ne se produit pas, il faut allonger le retard (choix du testeur : 6000 ms). Voir aussi 008-AS5.3.
**Verdict** : 🟡
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
**Action** : `SCRAPING_STALE_AFTER_MINUTES=1`, fenêtre ouverte toute la journée ; après un import réussi, `GET .../__fail?match=nh%2Fen` (le site tombe), attendre 3 minutes en relisant l'état et les logs ; puis `__heal` et attendre le prochain import.
**Attendu** : `stale: true` dès la deuxième minute sans succès et un seul avertissement « Données périmées » dans les logs (`CheckStaleness`) pendant l'épisode ; après le retour du site et un import réussi, `stale: false` et une ligne « Données de nouveau à jour ».
**Observé** : `STALE_AFTER=1`, `INTERVAL=1`, fenêtre toute la journée ; panne du site à 15:52:06 : `stale: false` à 15:52:40, `stale: true` à 15:53:10 (`lastSuccessAt` 15:51:43), un seul avertissement « Données périmées … » pour l'épisode (15:52:43), aucun de plus à 15:53:43, 15:54:44 ; `__heal` : import réussi à 15:55:44, `stale: false` et une ligne « Données de nouveau à jour » (15:55:49). Réserve : à ce réglage (retard = intervalle), un avertissement et un retour à jour tombent chaque minute même quand tout va bien : voir 008-AS7.3.
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
**Action** : API activée avec `SCRAPING_STALE_AFTER_MINUTES=1`, front lancé (`pnpm --filter @joj/web dev`) ; ouvrir `/medailles`, `/resultats?day=2026-11-01` puis `/` à 375 px puis 320 px, juste après un import, puis deux minutes après avoir coupé le faux site ; recharger. Éteindre l'import (sans `SCRAPING_ENABLED`) et recharger.
**Attendu** : juste après l'import, un bandeau « Données à jour à HH:MM » (heure du dernier succès, Dakar) sous aucune autre alerte ; après le retard, le bandeau devient « Les résultats sont peut-être en retard » avec « Ils n'ont pas été mis à jour depuis HH:MM. Revenez dans quelques minutes. » ; import éteint : aucun bandeau ; texte lisible sans coupure ni débordement à 320 px, console propre.
**Observé** : API activée (`STALE_AFTER=2`, `INTERVAL=1`), front Vite, console propre, aucune requête en échec. Juste après un import : « Données à jour à 15:59 » (ton « ok », `role=status`) au-dessus de l'en-tête sur `/medailles`, `/resultats?day=2026-11-01` et `/` à 375 puis 320 px, sans débordement (`scrollWidth` = largeur) et sans masquer l'en-tête ni la navigation (captures `.test-shots/008-AS8.1-ajour-*-375|320-dark-after.jpg`). Site coupé, 2 minutes plus tard : page ouverte, le bandeau passe tout seul à « Les résultats sont peut-être en retard / Ils n’ont pas été mis à jour depuis 15:59. Revenez dans quelques minutes. » (16:02:11, sans recharger), lisible sur 3 lignes à 320 px et à 188 px (zoom 200 % simulé), `…-retard-*`. Retour du site : « Données à jour à 16:04 » sans recharger (16:05:11). Import éteint : aucun bandeau (`…-eteint-accueil-320`). Mais, à ne pas manquer : (1) sous le bandeau « pas mis à jour depuis 15:59 », `/medailles` affiche « Mis à jour le 8 nov., 16 h 03 » (heure du dernier chargement par le navigateur, `dataUpdatedAt`) : deux fraîcheurs qui se contredisent, dans deux formats (15:59 et 16 h 03) ; (2) voir 008-AS8.2 à AS8.4.
**Verdict** : 🟡
**Issue** : —

### 008-AS1.3 — [API] Frontières d'horloge : 07:59, 08:00, 22:59, 23:00, 23:01 (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : valeurs-limites
**Action** : réglages par défaut du rythme (fenêtre 08:00-23:00, complets 07:00 et 23:00), `SCRAPING_INTERVAL_MINUTES=1`, tick 5 s, horloge du processus décalée par un préchargement `Date` (`FAKE_NOW`) : démarrer à 07:58:00 ; à 22:58:30 ; à 23:01:00 ; relire `recentRuns` de chaque base pendant 3 minutes.
**Attendu** : rien de léger avant 08:00 ; premier léger à l'ouverture ; à 23:00 un complet `scheduled` (et non un léger) ; rien de léger après 23:00:59 ; un démarrage à 23:01 fait son rattrapage complet puis plus rien.
**Observé** : démarrage 07:58:06 : `full` `startup`, aucun léger à 07:59:xx, premier `incremental` à 08:00:02 puis 08:01:02. Démarrage 22:58:36 : `startup` 22:58:36, léger 22:59:36, `full` `scheduled` à 23:00:01 (7 identiques) et plus rien (le léger de 23:01:01 tomberait hors fenêtre). Démarrage 23:01:06 : `full` `startup`, aucun léger ensuite. Limite : l'heure est décalée par un préchargement `Date` du processus, pas par l'horloge du système.
**Verdict** : ✅
**Issue** : —

### 008-AS4.2 — [API] Redémarrage à 22:59:00 et à 23:00:30 (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base avec un succès de 22:55 (horloge décalée), arrêter l'API, la relancer à 22:59:00 ; refaire avec un redémarrage à 23:00:30.
**Attendu** : pas de rattrapage (succès récent) ; le complet de 23:00 a lieu à 22:59 ; redémarré à 23:00:30, le créneau de 23:00 est manqué, personne ne le rattrape un battement tardif.
**Observé** : redémarrage à 22:59:00 : aucun `startup`, un léger à 22:59:11, le complet `scheduled` à 23:00:01 ✅. Redémarrage à 23:00:30 (base avec succès de 22:59:02) : aucun complet, un léger à 23:00:31, `nextFullRunAt: 2026-11-09T07:00:00Z` : le complet de 23:00 est perdu et la prochaine reprise des corrections des organisateurs a lieu à 07:00, 8 heures plus tard. C'est la règle écrite (« aucun battement tardif »), mais un redéploiement qui tombe entre 23:00:10 et 23:00:59 saute le complet de la nuit ; à signaler à Cherif, pas à corriger sans arbitrage.
**Verdict** : 🟡
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
**Observé** : le complet `startup` tourne de 15:42:43 à 15:44:19 ; le léger dû à 15:43:43 n'est pas enregistré du tout (aucune ligne `skipped`) ; le premier léger part à 15:44:24, juste après la fin. Cause lue : le battement qui lance le complet (`ScrapeScheduler.tick`) l'attend, les battements suivants s'arrêtent sur `busy`, et seul `RunDueScrape` écrit les exécutions sautées. Seule une exécution manuelle produit donc une ligne `skipped` (008-AS5.1). Sans effet sur les données ; le suivi est incomplet.
**Verdict** : 🟡
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
**Action** : le réglage accéléré du playbook : `SCRAPING_STALE_AFTER_MINUTES=1`, `SCRAPING_INTERVAL_MINUTES=1`, tick 5 s, site en bonne santé ; lire les journaux 4 minutes.
**Attendu** : aucune alerte tant que les imports réussissent.
**Observé** : chaque minute, « Données périmées : aucun import réussi depuis … (seuil 1 min) » puis 5 s plus tard « Données de nouveau à jour » (15:48:43, 15:49:43, 15:50:43, 15:51:43…) : les imports réussis sont espacés de 60 à 65 s, le seuil est de 60 s. Rien n'interdit ce réglage au démarrage (retard ≤ intervalle accepté). Avec les valeurs par défaut (15 min, 120 min) le cas ne se présente pas ; un réglage de retard inférieur à l'intervalle plus un battement produirait le même clignotement en production, et `stale` reflète aussi un état faux à ces valeurs. De plus, tout premier démarrage à vide journalise un « Données périmées … depuis le démarrage » avant la fin du premier import.
**Verdict** : 🟡
**Issue** : —

### 008-AS3.3 — [API] Réglages absurdes refusés au démarrage (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : démarrer l'API avec `SCRAPING_INTERVAL_MINUTES` à 0, -1, 1.5, `abc` ; `SCRAPING_STALE_AFTER_MINUTES=0` ; `SCRAPING_TICK_SECONDS=0` ; `SCRAPING_FULL_TIMES` à `25:00`, `7h30`, `7:00`, `07:00,,23:00`, vide ; fenêtre inversée, début = fin, `24:00` ; jours à l'envers ; fuseau `Mars/Phobos`.
**Attendu** : refus « Configuration invalide » qui nomme la variable, en français, sortie en erreur, jamais de démarrage.
**Observé** : tous refusés avec le nom de la variable et une phrase française (« doit être un entier positif », « doit être une heure HH:MM entre 00:00 et 23:59 (par exemple 23:00) → at SCRAPING_FULL_TIMES[1] », « doit être avant SCRAPING_WINDOW_END », « fuseau horaire inconnu … », « doit être le même jour que SCRAPING_LAST_DAY ou un jour avant »). Acceptés sans réserve : heures en double (`07:00,07:00`), heures en désordre (`23:00,07:00`), `SCRAPING_INTERVAL_MINUTES` vide (retombe sur 15).
**Verdict** : ✅
**Issue** : —

### 008-AS3.4 — [API] Une ancienne variable ou une valeur démesurée passent sans un mot (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : démarrer avec `SCRAPING_DAILY_TIME=25:00` (réglage supprimé par la spec 008) ; avec `SCRAPING_TICK_SECONDS=3000000`.
**Attendu** : un réglage inconnu ou démesuré est signalé.
**Observé** : `SCRAPING_DAILY_TIME=25:00` : démarrage normal, aucun avertissement, « Import automatique actif : complet à 07:00, 23:00 … » : un exploitant qui avait réglé `SCRAPING_DAILY_TIME=06:00` croit toujours avoir 06:00. `SCRAPING_TICK_SECONDS=3000000` : accepté ; Node avertit `TimeoutOverflowWarning: 3000000000 does not fit into a 32-bit signed integer` et le battement tombe à 1 ms (le rattrapage de démarrage a mis 3,8 s au lieu de 0,5 s) ; aucun plafond côté configuration.
**Verdict** : 🟡
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
**Observé** : le bandeau reste « Données à jour à 16:04 » pendant les 3 min 40 s observées (11 relevés, jusqu'à 16:09:08), bien après le seuil de retard de 2 minutes, avec une rangée de requêtes `502` en console ; la page ne dit rien. Rechargée à froid : pas de bandeau et « Le tableau n’a pas pu être chargé. Le serveur a rencontré un problème. Réessayez dans un instant. » + « Réessayer ». Cause lue : `useScrapeStatus` garde la dernière réponse réussie ; le retard est calculé côté serveur, donc invisible quand le serveur ne répond plus. Capture `.test-shots/008-AS8.1-api-injoignable-session-ouverte-375-dark-after.jpg`.
**Verdict** : 🟡
**Issue** : —

### 008-AS8.4 — [WEB] Aucun import réussi depuis le démarrage : rien à l'écran (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : API activée sur base neuve, site officiel en panne depuis le démarrage (`stale: true`, `lastSuccessAt: null`) ; ouvrir `/medailles`, `/resultats?day=2026-11-01` et `/` à 320 px.
**Attendu** : un avertissement lisible : les données sont en retard.
**Observé** : `GET /api/scraping` : `enabled: true`, `stale: true`, `lastSuccessAt: null`, `lastRun.status: failed` ; à l'écran : aucun bandeau sur les trois pages (`FreshnessMessage` ne rend rien sans `lastSuccessAt`). Sur un premier déploiement dont le site officiel refuse l'import, le supporter lit un tableau vide sans alerte. (La branche a reçu depuis `f250f16`, « warn plainly when the data is stale and no import ever succeeded » : non rejoué ici, le build testé est 7b4ecfd.)
**Verdict** : 🟡
**Issue** : —

## Session imprévisible

Voir [`transverse.md`](transverse.md) : le bandeau est le seul élément d'écran ajouté ; le testeur vérifie qu'il ne masque ni l'en-tête ni la navigation, qu'il se met à jour sans rechargement (relecture toutes les minutes), et que `GET /api/scraping` renvoyant `404` ou une page d'erreur (ancienne API) laisse la page sans bandeau, sans message d'erreur.

Exécuté par le testeur le 2026-11-08, build 7b4ecfd.

| #   | Geste                                                                      | Observé                                                                                                                                                                                                                         | Verdict |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| U1  | Horloge à 07:59, 08:00, 22:59, 23:00, 23:01                                | Voir 008-AS1.3 : rien avant 08:00, premier léger à 08:00:02, complet à 23:00:01, plus de léger après 23:00:59, rattrapage à 23:01.                                                                                              | ✅      |
| U2  | Redémarrage à 22:59 et à 23:00:30                                          | Voir 008-AS4.2 : 22:59 tient, 23:00:30 perd le complet de la nuit jusqu'à 07:00.                                                                                                                                                | 🟡      |
| U3  | Finale ajoutée à chaud pendant un import complet                           | Voir 008-AS2.2 : la première entre dans le complet, la seconde dans le léger suivant.                                                                                                                                           | ✅      |
| U4  | Source lente pendant un léger, puis au-delà du délai                       | Voir 008-AS5.4 : `409` français pendant, `failed` lisible au-delà, API vivante.                                                                                                                                                 | ✅      |
| U5  | Double déclenchement manuel / six POST pendant un import                   | `202` puis `409` français (008-AS5.2) ; pendant le léger lent aussi (008-AS5.4).                                                                                                                                                | ✅      |
| U6  | Bandeau quand l'API est injoignable, ancienne API, import éteint           | Voir 008-AS8.1 à AS8.4 : ancienne API et import éteint sans bandeau ni erreur ; session ouverte et API coupée : bandeau figé « à jour » ; jamais de succès : aucun bandeau.                                                     | 🟡      |
| U7  | Configuration absurde : intervalle 0, heures mal formées, fenêtre inversée | Voir 008-AS3.3 : tous refusés en français, la variable nommée ; ancienne variable et tick démesuré sans un mot (008-AS3.4).                                                                                                     | 🟡      |
| U8  | Bandeau à 188 px (zoom 200 % simulé) et clavier seul                       | Texte rendu en entier à 188 px, sans coupure du bandeau (en-tête déjà rogné, constat de transverse.md) ; premier Tab sur « Aller au contenu » dans les deux états : le bandeau n'est pas focalisable, il ne prend pas le focus. | ✅      |
| U9  | Console et réseau pendant tous les gestes du bandeau                       | Aucune erreur applicative ni avertissement React ; seules les lignes « Failed to load resource » provoquées volontairement (404/502 de l'intermédiaire).                                                                        | ✅      |
| U10 | Contrôle anti vibe-coding (`anti_slop.py`)                                 | Mêmes 3 ERREURS « lucide » (`apps/web/components.json:20`, `specs/design/artefact-design.html:1717` et `:2974`) et avertissement « page sans image » de `apps/web/index.html` (mascotte et logo présents) ; hors diff.          | 🟡      |

Non joué : réseau lent/coupé côté navigateur pendant un import (la panne a été simulée par l'intermédiaire, pas par l'émulation du navigateur), rotation de l'écran, deux onglets sur le bandeau, un vrai site officiel (interdit), un import complet de plus de 4 minutes au délai par défaut, la reprise après un redéploiement réel.

### Contexte de la campagne

- Choix du testeur : retard de 6000 ms et non 1000 ms pour 008-AS5.1 (un complet de 15 s ne chevauche jamais une minute d'intervalle) ; `SCRAPING_STALE_AFTER_MINUTES=2` pour 008-AS8.1 (à 1 minute, l'alerte clignote : 008-AS7.3) ; heures décalées par un préchargement `Date` hors du dépôt, intermédiaire local `/__p` pour journaliser les requêtes et retarder les réponses.
- La branche `journee` a avancé de treize commits pendant la campagne (jusqu'à `c841ac6`, dont T08 « le complet prend le créneau de 23:00, les légers finissent à 22:45 » et T13 « avertir quand aucun import n'a jamais réussi ») : non testés ici, à rejouer sur ce nouveau build.
