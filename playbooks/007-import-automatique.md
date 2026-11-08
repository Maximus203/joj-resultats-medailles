# 007 — Import automatique des résultats officiels

> Spec : specs/007-import-automatique · Statut : 🟡 · Build : journee @4b00d9f (worktree propre à ce commit, API compilée par le testeur, base PGlite neuve par groupe de scénarios, faux site `dev:fake-site` ; horloge du processus décalée par un préchargement `Date` hors du dépôt) · Testé : 2026-11-08 (rejeu 3 : 007-AS4.5, AS4.6, AS6.2, AS6.3 et passage rapide sur le reste ; non rejoués, observés sur 7b4ecfd : AS5.5, AS6.4, AS7.3 sur source lente, AS8.1)
> Surfaces : [API] [BE] · Profils : journaliste, supporter

## Préconditions

- **Jamais le vrai site officiel** : le testeur sert un faux site, `pnpm --filter @joj/api dev:fake-site 4010` (pages inventées, même structure HTML). Pannes et corrections se règlent à chaud : `GET http://127.0.0.1:4010/__fail?match=ScheduleDatePartial&day=02112026` (500 sur ce calendrier), `/__heal` (lève les pannes), `/__set?code=J66-FNL&medals=gold:UKR,silver:CAN,bronze:ARG` (remplace les médaillés d'une unité).
- Contenu du faux site : le 2026-11-01, Judo Men -66 kg (UKR, CAN, bronzes ARG et SEN), Swimming Women's 50m Freestyle (GBR, ITA, FRA), Swimming Men 50m Butterfly (égalité à l'or GRE et POR, bronze BEL), Wushu Taolu Men's Taijiquan Combined (finale non marquée « or » : HKG, VIE, JPN), et une finale Badminton à venir ; le 2026-11-02, Beach Wrestling Men 80kg (SEN, AZE, IRI) et Women 55kg (SEN, JPN, COD).
- API compilée (`pnpm build`) lancée sur une base neuve : `SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp SCRAPING_REQUEST_DELAY_MS=0 PGLITE_DATA_DIR=.data/playbook-007 PORT=3107 pnpm --filter @joj/api start`, sans seed. Supprimer `apps/api/.data/playbook-007` entre deux groupes de scénarios qui le demandent. L'import est éteint par défaut : `SCRAPING_ENABLED=true` n'est posé que dans les scénarios 007-AS6.
- `GET http://127.0.0.1:3107/api/scraping` rend l'état ; `POST /api/scraping/runs` lance une exécution (202), à relire ensuite sur l'état (`running: false`). Les podiums se lisent sur `GET /api/podiums`, le tableau sur `GET /api/medals`. Un podium saisi à la main se crée par `POST /api/podiums`, jamais en base.
- Décalage des dates : l'import ne lit que les jours déjà passés ; le faux site a des finales les 1er et 2 novembre 2026, toujours passés.

## Scénarios

### 007-AS1.1 — [API] Les finales terminées arrivent

**Profil** : supporter
**Priorité** : critique
**Technique** : nominal
**Action** : base neuve, import éteint. `POST /api/scraping/runs`, attendre `running: false`, relire `GET /api/scraping`, `GET /api/podiums` et `GET /api/medals`.
**Attendu** : `202` puis, dans `lastRun`, `status: success`, `counts.imported: 5` (Judo, Swimming Women's 50m Freestyle, Wushu Taiji combiné, Beach Wrestling Men 80kg et Women 55kg) ; cinq podiums, un par épreuve, aucun pour la finale Badminton à venir ni pour l'égalité à l'or.
**Vérif [BE]** : cinq lignes dans `podiums`, une ligne dans `scrape_runs` (`trigger: manual`).
**Observé** : Rejeu 3 sur 4b00d9f, base neuve : `POST /api/scraping/runs` → `202` ; `lastRun` `kind: full`, `trigger: manual`, `status: success`, `counts.imported: 5`, `ignored: 1` ; cinq podiums (Beach Wrestling ×2, Judo, Swimming Women, Wushu), rien pour le Badminton à venir ni pour l'égalité GRE/POR. Lecture SQL directe impossible (PGlite verrouillée) : preuve par l'API.
**Verdict** : ✅
**Issue** : —

### 007-AS1.2 — [API] Relancer ne change rien

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, lancer l'import deux fois de plus (en attendant la fin à chaque fois), puis relire l'état et la liste des podiums.
**Attendu** : à chaque relance `counts.imported: 0`, `updated: 0`, `identical: 5` ; toujours cinq podiums, mêmes `id`, aucun doublon.
**Observé** : Rejeu 3 : deux relances de suite, `imported: 0`, `updated: 0`, `identical: 5` chaque fois ; mêmes cinq `id`, aucun doublon.
**Verdict** : ✅
**Issue** : —

### 007-AS2.1 — [API] Finale non marquée « or » et second bronze

**Profil** : supporter
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : après 007-AS1.1, lire le podium du Judo Men -66 kg, celui du Wushu Taolu Combined, puis `GET /api/medals`.
**Attendu** : le Wushu a son podium (HKG, VIE, JPN) ; le Judo porte `secondBronze: SEN` ; le tableau compte pour le Sénégal 2 ors (les deux lutte sur plage) et 1 bronze, et pour ARG 1 bronze.
**Observé** : Rejeu 3 : Wushu HKG, VIE, JPN ; Judo `secondBronze: SEN`, bronze ARG ; `GET /api/medals` : SEN rang 1 (2 or, 0 argent, 1 bronze), ARG 0/0/1.
**Verdict** : ✅
**Issue** : —

### 007-AS3.1 — [API] Une égalité à l'or est dite, pas devinée

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : après 007-AS1.1, lire `lastRun.report.exhaustiveness`.
**Attendu** : `finalsSeen: 6`, `finalsWithPodium: 5`, une finale ignorée (Swimming, Men 50m Butterfly Final) avec la raison `TIED_PLACES` ; aucun podium ni médaille pour GRE, POR ou BEL.
**Observé** : Rejeu 3 : `finalsSeen: 6`, `finalsWithPodium: 5`, une finale ignorée : Swimming, `Men 50m Butterfly Final`, `TIED_PLACES`, détail « égalité à l’or (GRE, POR), pas d’argent » ; aucun podium ni médaille pour GRE, POR ou BEL.
**Verdict** : ✅
**Issue** : —

### 007-AS4.1 — [API] Une correction du journaliste n'est jamais écrasée

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, corriger le Judo Men -66 kg : `PUT /api/podiums/:id` avec CAN or, UKR argent, ARG bronze. Puis rejouer l'import.
**Attendu** : le podium reste CAN, UKR, ARG avec sa date de correction ; `lastRun.report.kept` contient le Judo avec `reason: CORRECTED`, `current.gold: CAN`, `source.gold: UKR` ; `counts.kept: 1`.
**Vérif [BE]** : `podiums.corrected_at` renseigné, aucune ligne de révision de plus créée par l'import.
**Observé** : Rejeu 3 : PUT CAN/UKR/ARG → `200`, `correctedAt` posé ; import rejoué : `counts.kept: 1`, `kept[0]` `reason: CORRECTED`, `current.gold: CAN`, `source.gold: UKR` ; `/revisions` : 1 ligne, inchangée après l'import.
**Verdict** : ✅
**Issue** : —

### 007-AS4.2 — [API] Un podium saisi à la main n'est pas dupliqué

**Profil** : journaliste
**Priorité** : critique
**Technique** : table-décision
**Action** : base neuve. Avant tout import, `POST /api/podiums` avec « Swimming – Women's 50m Freestyle », Swimming, 2026-11-01, USA or, ITA argent, FRA bronze (le nom exact que l'import donnera, avec le tiret long). Lancer l'import. Rejouer avec un autre nom, « Natation 50 m nage libre dames ».
**Attendu** : avec le nom exact, un seul podium pour l'épreuve, resté USA, ITA, FRA, et un écart `reason: MANUAL` (`source.gold: GBR`) dans `kept` ; avec l'autre nom, deux podiums coexistent (limite connue : la clé est le nom), ce que le testeur note dans Observé.
**Observé** : Rejeu 3, base neuve : « Swimming - Women's 50m Freestyle » (tiret du clavier) saisi USA/ITA/FRA avant l'import : un seul podium Swimming, resté USA/ITA/FRA ; `kept` = une ligne `reason: MANUAL` (`source` = valeurs du faux site à cet instant ; ma première vérification attendait GBR alors que le faux site avait gardé un `__set` ITA/GBR/FRA du groupe précédent : erreur du testeur, pas de l'application). Avec « Natation 50 m nage libre dames » (rejeu précédent) : deux podiums coexistent, limite connue.
**Verdict** : ✅
**Issue** : —

### 007-AS4.3 — [API] Une correction officielle est suivie, l'ancienne version reste

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, `GET http://127.0.0.1:4010/__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA`, rejouer l'import, puis lire le podium de la natation et `GET /api/podiums/:id/revisions`.
**Attendu** : le podium prend ITA, GBR, FRA, sans `correctedAt` ; `lastRun.report.updated` donne l'ancien (`gold: GBR`) et le nouveau (`gold: ITA`) ; les révisions rendent l'ancienne version GBR, ITA, FRA.
**Vérif [BE]** : une ligne de `podium_revisions` pour ce podium.
**Observé** : Rejeu 3 : après `__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA` et relance : podium ITA/GBR/FRA sans `correctedAt` ; `report.updated` donne `current.gold: GBR`, `source.gold: ITA` ; `/revisions` rend une ligne GBR/ITA/FRA.
**Verdict** : ✅
**Issue** : —

### 007-AS4.4 — [API] Une épreuve en base absente du site est signalée

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : après 007-AS1.1, `POST /api/podiums` avec « Judo – Women -52 kg », Judo, 2026-11-01, SEN/JPN/FRA ; rejouer l'import.
**Attendu** : `absentFromSource` liste « Judo – Women -52 kg » ; le podium est intact.
**Observé** : Rejeu 3 : podium « Judo – Women -52 kg » saisi par l'API, import rejoué : `absentFromSource` le liste (`eventName`, `day`), podium intact.
**Verdict** : ✅
**Issue** : —

### 007-AS5.1 — [API] Un jour illisible n'arrête pas les autres

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : base neuve ; `GET http://127.0.0.1:4010/__fail?match=ScheduleDatePartial&day=02112026` ; lancer l'import ; `__heal` ; relancer.
**Attendu** : première exécution `status: partial`, les trois podiums du 1er novembre importés, `daysFailed: ["2026-11-02"]`, une erreur lisible en français ; après `__heal`, la relance importe les deux de lutte et le statut redevient `success`.
**Vérif [BE]** : les logs de l'API contiennent un avertissement par erreur (`RunScrape`), jamais de trace d'arrêt.
**Observé** : Rejeu 3, base neuve : panne `ScheduleDatePartial` du 2 nov : `status: partial`, trois podiums du 1er novembre importés, erreur « 2026-11-02 : calendrier illisible (HTTP 500 sur …) » ; après `__heal` : `success`, 5 podiums. Journaux : une ligne `WARN [RunScrape]` par erreur, aucune ligne `ERROR`.
**Verdict** : ✅
**Issue** : —

### 007-AS5.2 — [API] Un site entièrement en panne laisse les données intactes

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : après 007-AS1.1, `GET http://127.0.0.1:4010/__fail?match=nh%2Fen` (toute page en 500), lancer l'import, relire l'état, les podiums et le tableau.
**Attendu** : `status: failed`, `daysRead: []`, des erreurs listées ; les cinq podiums et le tableau des médailles sont inchangés ; l'API répond toujours (`GET /api/health`).
**Observé** : Rejeu 3 : `__fail?match=nh%2Fen` : `status: failed`, `daysRead: []`, 8 erreurs en français ; podiums et tableau des médailles identiques à l'octet près ; `GET /api/health` → `200`.
**Verdict** : ✅
**Issue** : —

### 007-AS5.3 — [API] Pas deux exécutions en même temps

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : relancer l'API avec `SCRAPING_REQUEST_DELAY_MS=400` ; envoyer deux `POST /api/scraping/runs` à la suite, sans attendre.
**Attendu** : le premier rend `202`, le second `409` avec le code `SCRAPE_ALREADY_RUNNING` ; `GET /api/scraping` montre `running: true` pendant l'exécution ; une troisième demande, la première finie, rend `202`.
**Observé** : Rejeu 3 (retard 400 ms par requête) : premier POST `202`, second `409` `SCRAPE_ALREADY_RUNNING`, `detail` « Un import est déjà en cours : attends qu’il se termine avant d’en lancer un autre. » ; `running: true` pendant ; troisième POST (import fini) `202`.
**Verdict** : ✅
**Issue** : —

### 007-AS6.1 — [API] Éteint par défaut

**Profil** : journaliste
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : lancer l'API sans `SCRAPING_ENABLED`, attendre 90 secondes, lire `GET /api/scraping`.
**Attendu** : `enabled: false`, `nextRunAt: null`, `lastRun: null`, `recentRuns: []`, aucune requête reçue par le faux site ; le log de démarrage dit que l'import est désactivé.
**Observé** : Rejeu 3 : sans `SCRAPING_ENABLED` : `enabled: false`, `stale: false`, aucune exécution ; le journal dit « Import automatique désactivé (SCRAPING_ENABLED) ». Limite : le faux site n'a pas de compteur, « aucune requête » est déduit de l'absence d'exécution ; 90 s d'attente non rejouées (une dizaine de secondes).
**Verdict** : ✅
**Issue** : —

### 007-AS6.2 — [API] Rattrapage au démarrage, puis une fois à l'heure fixe

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base neuve ; lancer l'API avec `SCRAPING_ENABLED=true SCRAPING_TIMEZONE=Africa/Dakar SCRAPING_TICK_SECONDS=5 SCRAPING_FULL_TIMES=<HH:MM dans 2 minutes, heure de Dakar = UTC>,23:00 (SCRAPING_DAILY_TIME n’existe plus : voir 008-AS3.1 ; s’il est encore posé, l’API le dit au démarrage)` ; observer l'état au démarrage puis après le passage de l'heure.
**Attendu** : au démarrage, une exécution `trigger: startup` (aucun import réussi : rattrapage) ; à l'heure réglée, une seule exécution `trigger: scheduled` ; rien de plus les minutes suivantes ; `nextRunAt` rend le créneau du lendemain à la même heure.
**Observé** : Rejeu 3 avec `SCRAPING_FULL_TIMES` (la variable `SCRAPING_DAILY_TIME` n'existe plus) et horloge du processus décalée (préchargement `Date`, `FAKE_NOW`) : base neuve démarrée à 22:55 → une exécution `full` `startup` (aucun succès avant) ; redémarrage à 22:59:00 → aucune exécution `startup`, une seule `full` `scheduled` à 23:00:01, rien de plus ensuite ; `nextFullRunAt: 2026-11-09T07:00:00Z`. Le champ s'appelle `nextFullRunAt`, pas `nextRunAt` (Attendu à relire : le créneau suivant est 07:00 avec deux heures configurées).
**Verdict** : ✅
**Issue** : —

### 007-AS6.3 — [API] Une heure ou un fuseau invalide arrête le démarrage

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_FULL_TIMES=25:00`, puis `SCRAPING_FULL_TIMES=7h30`, puis `SCRAPING_TIMEZONE=Mars/Phobos`.
**Attendu** : chaque démarrage échoue avec « Configuration invalide » qui nomme la variable fautive ; jamais de démarrage avec un réglage faux.
**Observé** : Rejeu 3 : `SCRAPING_FULL_TIMES=25:00` ou `7h30` → « Configuration invalide : ✖ doit être une heure HH:MM entre 00:00 et 23:59 (par exemple 23:00) → at SCRAPING_FULL_TIMES[0] » ; `Mars/Phobos` → « fuseau horaire inconnu (par exemple Africa/Dakar) → at SCRAPING_TIMEZONE » ; sortie 1, aucun démarrage. Corrigé depuis la campagne précédente : l'Action nomme maintenant `SCRAPING_FULL_TIMES`, et l'ancien `SCRAPING_DAILY_TIME=25:00` ne passe plus en silence : le serveur démarre mais journalise « SCRAPING_DAILY_TIME est ignoré : voir SCRAPING_FULL_TIMES » (`WARN [AppConfig]`).
**Verdict** : ✅
**Issue** : —

### 007-AS7.1 — [API] Un compte rendu lisible

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : après 007-AS4.1 et 007-AS4.3 sur la même base, lire `GET /api/scraping`.
**Attendu** : le corps donne `enabled`, `running`, `schedule` (23:00, Africa/Dakar), `lastRun` (heure de début et de fin, `trigger`, `status`, `counts`, détail `imported`, `updated`, `kept`, `absentFromSource`, `exhaustiveness`, `errors`) et `recentRuns` (les dix dernières, plus récente d'abord, sans détail) ; chaque écart montre l'ancien et le nouveau podium.
**Observé** : Rejeu 3 : `GET /api/scraping` rend `enabled`, `running`, `stale`, `lastSuccessAt`, `nextFullRunAt`, `schedule` (fuseau, heures, fenêtre, intervalle, seuil), `lastRun` (début, durée, `trigger`, `kind`, `status`, `counts`, `report`), `lastFullRun`, `recentRuns` (sans détail, plus récente d'abord, `skippedReason` pour les sautées).
**Verdict** : ✅
**Issue** : —

### 007-AS7.2 — [BE] Le script manuel lit le site avec le même code

**Profil** : journaliste
**Priorité** : normal
**Technique** : nominal
**Action** : `SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp SCRAPING_REQUEST_DELAY_MS=0 pnpm db:scrape`, lire le résumé affiché et `apps/api/data/podiums.json`, puis `git checkout apps/api/data/podiums.json`.
**Attendu** : « 6 finale(s) vue(s), 5 podium(s) écrit(s) », une finale ignorée avec `TIED_PLACES`, le fichier contient `second_bronze: "SEN"` pour le judo ; aucun appel au vrai site.
**Observé** : Rejeu 3 (faux site) : sans option : « Refusé : le nouveau fichier ne contient que 5 podium(s) contre 57 aujourd’hui. Relance avec --force pour le remplacer quand même. » (sortie 1, fichier intact) ; avec `--force` : « 57 podium(s) remplacé(s) par 5 podium(s) écrit(s). 6 finale(s) vue(s), 5 podium(s) lu(s) … TIED_PLACES (égalité à l’or (GRE, POR), pas d’argent) », `second_bronze: "SEN"` écrit ; fichier restauré par `git checkout`. Défaut cosmétique : chaque exécution commence par un avertissement Node `MODULE_TYPELESS_PACKAGE_JSON` (« Module type of file …/src/core/config/env-schema.ts is not specified … add "type": "module" to apps/api/package.json »), quatre lignes de bruit avant le résultat ; le script lit désormais `env-schema.ts` directement.
**Verdict** : 🟡
**Issue** : —

### 007-AS7.3 — [BE] Aucun log fantôme, aucun secret

**Profil** : journaliste
**Priorité** : normal
**Technique** : nominal
**Action** : relire les logs de l'API pendant 007-AS1.1 et 007-AS5.1.
**Attendu** : des lignes au format Nest (`[RunScrape]`) avec le compte rendu en une ligne ; aucune sortie brute (`console`), aucun identifiant ni mot de passe, aucune page HTML.
**Observé** : Rejeu 3 : journaux de tous les groupes relus : lignes Nest `LOG`/`WARN [RunScrape]` avec le compte rendu en une ligne ; aucune sortie brute, aucun identifiant, aucune page HTML ; zéro ligne `ERROR`.
**Verdict** : ✅
**Issue** : —

### 007-AS1.3 — [WEB] Le tableau des médailles et « Mon pays » montrent les données importées (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : nominal
**Action** : API sur base neuve, import manuel (5 podiums), puis ouvrir `/medailles`, `/` et `/resultats?day=2026-11-01` dans le navigateur à 375 px puis 320 px ; changer « Mon pays » (SEN puis UKR) et revenir à SEN.
**Attendu** : le tableau rend les 13 pays importés, le Sénégal en rang 1 avec 2 or, 0 argent, 1 bronze et la mention « Mon pays » ; la page d'accueil montre les 5 premiers pays ; aucun défilement horizontal ; console propre.
**Observé** : Rejeu 3, API sur base importée (5 podiums) et front Vite : `/medailles` à 375 puis 320 px : `scrollWidth` = largeur, SEN rang 1 « 2 / 0 / 1 » avec « Mon pays », 13 pays nommés (Sénégal, Royaume-Uni, Hong Kong, Ukraine, Japon, Azerbaïdjan, Canada, Italie, Vietnam, Argentine, RD Congo, France, Iran), console sans erreur ni avertissement (hors `409`/`422` provoqués). La ligne « Mis à jour le … » a disparu de `/medailles`. Reste : disciplines et épreuves importées en anglais (« Swimming – Women's 50m Freestyle », « Wushu Taolu ») dans une interface en français ; choix produit à trancher, pas un bug de code.
**Verdict** : 🟡
**Issue** : —

### 007-AS4.5 — [WEB] Un podium saisi à la main avec un tiret simple n'est pas reconnu (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : table-décision
**Action** : import fait (5 podiums). Dans `/journaliste` à 375 px, enregistrer par l'écran « Swimming - Women's 50m Freestyle » (tiret du clavier), discipline Swimming, 1er nov, USA, ITA, FRA. Relancer l'import. Lire `/resultats?day=2026-11-01` et `/api/medals`. En API : poster la même épreuve en minuscules avec le tiret long.
**Attendu** : l'épreuve est reconnue comme la même que celle de l'import, ou à défaut le doublon est signalé au journaliste et dans le compte rendu.
**Observé** : Rejeu 3, base importée : dans `/journaliste` à 375 px, « Swimming - Women's 50m Freestyle » (tiret du clavier), Swimming, 1er nov, USA/ITA/FRA : refus (`409`), bandeau « Cette épreuve a déjà un podium. Le podium enregistré n’a pas changé. Pour le modifier, utilisez la correction. » et champ marqué « Cette épreuve a déjà un podium : utilisez la correction. », saisie conservée ; capture `.test-shots/007-AS4.5-saisie-tiret-simple-375-dark-after.jpg`. Même refus en API pour minuscules, majuscules, espaces multiples ou insécables, et les traits d'union `–` `—` `−` `‒`.
**Verdict** : ✅
**Issue** : —

### 007-AS5.4 — [API] Une source qui répond « 200 » mais vide ou illisible (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : base avec les 5 podiums importés ; entre l'API et le faux site, un intermédiaire local réglable répond `200` avec : un corps vide, une page « Maintenance » sans structure, un JSON `{"ok":true}`, 30 Mo de `x`. Lancer l'import après chacun, puis relire l'état, les podiums et le tableau.
**Attendu** : un site qui ne ressemble plus à la source n'est pas un « succès » : jours en échec, erreur lisible, `status: partial` ou `failed` ; les podiums restent intacts.
**Observé** : Rejeu 3, faux site avec `__raw` : corps vide, « Maintenance », `{"ok":true}` en `200` : à chaque fois `status: failed`, 8 erreurs « calendrier illisible (structure du calendrier absente : page vide, en maintenance ou modifiée) », `lastSuccessAt` inchangé, podiums et tableau intacts. Non rejoué : le corps de 30 Mo (intermédiaire local absent cette fois).
**Verdict** : ✅
**Issue** : —

### 007-AS5.5 — [API] Une source lente, au-delà du délai (ajouté par le testeur)

**Profil** : supporter
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : intermédiaire local qui retarde chaque réponse ; `SCRAPING_REQUEST_TIMEOUT_MS=1500`. Réponses retardées de 600 ms (sous le délai) puis de 3 s (au-delà) ; pendant la première, un second POST.
**Attendu** : sous le délai, l'import réussit ; au-delà, des erreurs lisibles par jour, sans blocage ; le second POST est refusé.
**Observé** : Retard de 600 ms (délai 1500 ms) : `success` en 8,7 s, second POST `409` ; retard de 3 s : `failed`, 8 erreurs « calendrier illisible (délai de 1500 ms dépassé sur http://…) » (maintenant en français), 12 s, podiums intacts, API réactive. Reste vrai, non rejoué (4 minutes) : avec le délai par défaut de 30 s, un site muet immobilise l'exécution 8 × 30 s = 4 minutes, le `409` couvre ce temps.
**Verdict** : ✅
**Issue** : —

### 007-AS5.6 — [API] Redémarrage de l'API pendant une exécution (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : `SCRAPING_REQUEST_DELAY_MS=400`, `POST /api/scraping/runs`, tuer le processus de l'API (`taskkill`) 2,5 s plus tard en pleine lecture, relancer sur la même base, relire l'état, lancer un import.
**Attendu** : pas d'état « en cours » fantôme, pas de podium à moitié écrit, import suivant normal.
**Observé** : Rejeu 3 (retard 400 ms, base sur disque) : `POST` → `202`, processus tué 2,5 s plus tard en pleine lecture, relancé sur la même base : `running: false` (pas d'état « en cours » fantôme), 0 podium à moitié écrit, `recentRuns` vide ; `POST` suivant : `success`, 5 importés. Coupure pendant la courte phase d'écriture : non provoquée.
**Verdict** : ✅
**Issue** : —

### 007-AS6.4 — [API] Une plage de jours à l'envers est acceptée sans un mot (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : `SCRAPING_ENABLED=true SCRAPING_FIRST_DAY=2026-11-13 SCRAPING_LAST_DAY=2026-11-01`, base en mémoire ; lire le log de démarrage et `GET /api/scraping` après 8 s.
**Attendu** : démarrage refusé (« Configuration invalide ») ou avertissement net ; jamais un import « actif » qui ne fera jamais rien.
**Observé** : `SCRAPING_FIRST_DAY=2026-11-13 SCRAPING_LAST_DAY=2026-11-01` : démarrage refusé, « Configuration invalide : ✖ doit être le même jour que SCRAPING_LAST_DAY ou un jour avant → at SCRAPING_FIRST_DAY ». Même refus, en français, pour fenêtre inversée (`WINDOW_START=23:00 WINDOW_END=08:00`, et début = fin), intervalle 0, -1, 1.5, `abc`, retard 0, tick 0.
**Verdict** : ✅
**Issue** : —

### 007-AS8.1 — [WEB] Le second bronze et les noms de pays se lisent à l'écran

**Profil** : supporter
**Priorité** : critique
**Technique** : nominal
**Action** : après 007-AS1.1 sur la base importée, ouvrir `/resultats?day=2026-11-01` à 375 puis 320 px, puis `/medailles`, ouvrir la liste « Mon pays » et choisir UKR, HKG puis revenir à SEN.
**Attendu** : la carte du Judo Men -66 kg montre quatre lignes (or UKR, argent CAN, bronze ARG, bronze SEN) ; le tableau et la liste nomment les pays (Ukraine, Hong Kong, Sénégal, Azerbaïdjan, RD Congo, Vietnam, Iran) ; à 320 px la pastille « Mon pays » reste entière, sous le pays, sans mordre la bordure de la ligne.
**Observé** : Base importée, front Vite : `/resultats?day=2026-11-01` à 375 puis 320 px (captures `.test-shots/007-AS8.1-resultats-judo-375-dark-after.jpg`, `…-320-dark-after.jpg`) : la carte « Judo – Men -66 kg » montre quatre lignes (or UKR, argent CAN, bronze ARG, bronze SEN). `/medailles` nomme Sénégal, Royaume-Uni, Hong Kong, Ukraine, Japon, Azerbaïdjan, Canada, Italie, Vietnam, Argentine, RD Congo, France, Iran. Liste « Mon pays » : AZE · Azerbaïdjan, COD · RD Congo, HKG · Hong Kong, IRI · Iran, SEN · Sénégal, UKR · Ukraine, VIE · Vietnam ; UKR puis HKG puis SEN : ligne marquée, mémorisé. À 320 px la pastille « Mon pays » reste entière sous le pays (capture `007-AS8.1-medailles-sen-monpays-320-dark-after.jpg`). Console propre.
**Verdict** : ✅
**Issue** : —

### 007-AS4.6 — [WEB] Une apostrophe typographique fait un doublon (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : table-décision
**Action** : import fait (5 podiums). Dans `/journaliste` à 375 px, enregistrer « Swimming – Women’s 50m Freestyle » (apostrophe typographique ’, celle que produit le clavier d'un iPhone, et tiret long), Swimming, 1er nov, GBR, ITA, FRA. Lire `/resultats?day=2026-11-01` et `/api/medals`. En API, poster aussi « Swimming — Women’s 50m Freestyle » et « swimming‐women's 50m freestyle » (trait d'union U+2010 sans espaces).
**Attendu** : l'épreuve est reconnue comme celle de l'import (même clé de comparaison) : refus `409` et message « Cette épreuve a déjà un podium ».
**Observé** : Rejeu 3. Par l'écran à 375 px : « Swimming – Women’s 50m Freestyle » (apostrophe typographique ’ et tiret long) est refusé (`409`, bandeau « Cette épreuve a déjà un podium. ») : corrigé (capture `.test-shots/007-AS4.6-apostrophe-typographique-375-dark-after.jpg`). En API, refusés (`409 PODIUM_ALREADY_RECORDED`) : `’`, `‘`, `ʼ`, `` ` ``, `´`, tiret long `—`, majuscules, espaces insécables. MAIS la variante demandée par l'Action « swimming‐women's 50m freestyle » (trait d'union U+2010 SANS espaces autour) est toujours acceptée (`201`) et le tiret pleine chasse `－` (U+FF0D) aussi : le public voit alors deux cartes pour la même finale (capture `.test-shots/007-AS4.6-doublon-u2010-sans-espaces-320-dark-after.jpg`) et le tableau compte l'épreuve deux fois. Les noms « Women’s 50 m Freestyle » (espace avant m) ou « 50m Free » créent aussi un autre podium (limite connue : la clé est le nom). Attendu non tenu pour la variante sans espaces ; gravité faible (saisie rare au clavier d'un téléphone).
**Verdict** : 🟡
**Issue** : —

## Session imprévisible

Pas d'écran propre à cette tranche : essais d'API ci-dessous, plus les gestes du front sur les pages qui affichent les données importées (voir 007-AS1.3). Exécuté par le testeur le 2026-11-08, build 69dc16b, puis rejeu sur 7b4ecfd.

| #   | Geste                                                                                                  | Observé                                                                                                                                                                                                                                                                      | Verdict |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| S1  | Double déclenchement manuel, puis six POST simultanés                                                  | Rejeu 3 : un `202`, `409` français ensuite ; une seule exécution (007-AS5.3).                                                                                                                                                                                                | ✅      |
| S2  | `POST /api/scraping/runs` avec un corps JSON absurde, dont `sourceUrl` d'un autre site                 | Rejeu 3 : corps absurde dont `sourceUrl` d'un autre site : `202`, l'import lit toujours `SCRAPING_SOURCE_URL` ; JSON invalide : `400 BAD_REQUEST`.                                                                                                                           | ✅      |
| S3  | `GET /api/scraping?x=1&day=bidon`, `DELETE`, `PUT`, `PATCH`, `OPTIONS`, `GET /runs`, chemin emoji      | Rejeu 3 : `GET` avec paramètres inutiles `200` ; `DELETE`, `PUT`, `GET /runs`, chemin emoji : `404` ; jamais de `500`.                                                                                                                                                       | ✅      |
| S4  | `POST /api/scraping/runs` avec un corps de 300 Ko puis de 5 Mo                                         | Rejeu 3 : corps de 300 Ko puis 5 Mo sur `POST /api/scraping/runs` et 5 Mo sur `POST /api/podiums` : `413 PAYLOAD_TOO_LARGE` « Le corps de la requête est trop volumineux. » ; aucune ligne `ERROR`.                                                                          | ✅      |
| S5  | Source indisponible, lente, vide, illisible, redirigée (voir AS5.1, AS5.2, AS5.4, AS5.5)               | Rejeu : source vide, maintenance, JSON, 30 Mo en `200` : `failed` avec erreurs lisibles (AS5.4) ; lente : `failed` en français (AS5.5) ; panne : `failed`/`partial` propres.                                                                                                 | ✅      |
| S6  | Redémarrage pendant une exécution                                                                      | Rejeu : voir 007-AS5.6.                                                                                                                                                                                                                                                      | ✅      |
| S7  | Podium saisi à la main puis scrapé ; podium corrigé puis scrapé ; correction officielle                | Voir 007-AS4.1 à AS4.6 : correction jamais écrasée, tiret et apostrophe typographique reconnus à l'écran ; reste la variante U+2010 sans espaces et le tiret pleine chasse (AS4.6) ; « Natation… » reste un autre podium.                                                    | 🟡      |
| S8  | Heure de planification : heure + 2 min, fuseaux à demi-heure, +14, jour suivant ; configuration fausse | Voir 007-AS6.2 à AS6.4 : plages et heures absurdes refusées en français ; l'ancienne variable `SCRAPING_DAILY_TIME` est maintenant signalée au démarrage.                                                                                                                    | ✅      |
| S9  | `/medailles`, `/`, `/resultats` à 375 puis 320 px, « Mon pays », console                               | Voir 007-AS1.3 et 007-AS8.1 : aucun débordement, pays nommés, console propre ; disciplines en anglais (choix produit).                                                                                                                                                       | 🟡      |
| S10 | Contrôle anti vibe-coding (`anti_slop.py`)                                                             | Rejeu 3 : mêmes 3 ERREURS « icônes d'IA par défaut : lucide » (`apps/web/components.json:20`, `specs/design/artefact-design.html:1717` et `:2974`) et avertissement « page sans image » de `apps/web/index.html` (mascotte et logo présents à l'écran). Inchangé, hors diff. | 🟡      |

Non joué : coupure en pleine phase d'écriture, source muette 4 minutes au délai par défaut de 30 s, exécutions sur le vrai site (interdit). Coupure réseau et zoom 200 % : joués sur le bandeau de la tranche 008.

### Contexte du rejeu sur 7b4ecfd

- Worktree propre à 7b4ecfd, API recompilée dedans ; la branche `journee` a reçu treize commits pendant le rejeu (jusqu'à `c841ac6`) : rien de ce rapport ne porte dessus. Intermédiaire local de test (journal des requêtes, retard, corps forcé) et décalage d'horloge (préchargement `Date`) hors du dépôt.
- Choix du testeur : un script Node (`fetch`) pour poster les noms avec tiret ou apostrophe typographique (le shell Windows abîme l'octet).

### Contexte de la campagne initiale

- Le dépôt a reçu cinq commits pendant la campagne (`0d14309` T07, `d4812e9` T08, `b13ecc3` T09, `4a2bafb` T10, `e602e8b` T11) et `apps/api/dist` a été recompilé à 14:28:58 par une autre session : j'ai donc refait dans un worktree propre à 69dc16b tous les essais lancés après cette heure (sources dégradées, redémarrage, tiret, corps volumineux, fuseaux, `db:scrape`). Rien de ce rapport ne porte sur T07 à T11.
- Choix du testeur : un script Node (`fetch`) pour poster les noms avec tiret long, parce que le shell Windows abîme l'octet (artefact du poste de test, pas de l'application).
