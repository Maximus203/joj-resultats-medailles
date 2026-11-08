# 007 — Import automatique des résultats officiels

> Spec : specs/007-import-automatique · Statut : ❌ · Build : journee @69dc16b (API compilée, base PGlite neuve ; les scénarios joués après 14:28 refaits dans un worktree propre à 69dc16b) · Testé : 2026-11-08
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
**Observé** : Base neuve, import éteint. `POST /api/scraping/runs` → `202` ; état relu : `lastRun` `trigger: manual`, `status: success`, `counts.imported: 5` (Judo Men -66 kg, Swimming Women's 50m Freestyle, Wushu Taolu Taijiquan combiné, Beach Wrestling Men 80kg et Women 55kg), `ignored: 1`, `errors: 0`, 8 jours lus (1er au 8 nov, jour courant compris). `GET /api/podiums` : cinq podiums, un par épreuve ; rien pour la finale Badminton à venir ni pour l'égalité GRE/POR. Vérif [BE] : une seule exécution dans `recentRuns` (lecture SQL directe impossible, la base PGlite est verrouillée par l'API : preuve par l'API).
**Verdict** : ✅
**Issue** : —

### 007-AS1.2 — [API] Relancer ne change rien

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, lancer l'import deux fois de plus (en attendant la fin à chaque fois), puis relire l'état et la liste des podiums.
**Attendu** : à chaque relance `counts.imported: 0`, `updated: 0`, `identical: 5` ; toujours cinq podiums, mêmes `id`, aucun doublon.
**Observé** : Deux relances de suite : à chaque fois `imported: 0`, `updated: 0`, `identical: 5` ; la liste des podiums est identique (mêmes cinq `id`), `recentRuns` passe à 3 puis 5 lignes, aucun doublon.
**Verdict** : ✅
**Issue** : —

### 007-AS2.1 — [API] Finale non marquée « or » et second bronze

**Profil** : supporter
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : après 007-AS1.1, lire le podium du Judo Men -66 kg, celui du Wushu Taolu Combined, puis `GET /api/medals`.
**Attendu** : le Wushu a son podium (HKG, VIE, JPN) ; le Judo porte `secondBronze: SEN` ; le tableau compte pour le Sénégal 2 ors (les deux lutte sur plage) et 1 bronze, et pour ARG 1 bronze.
**Observé** : Wushu : HKG, VIE, JPN (finale non marquée « or » bien lue). Judo : `secondBronze: SEN`, bronze ARG. `GET /api/medals` : SEN 2 or / 0 argent / 1 bronze, ARG 1 bronze, rang 1 pour le Sénégal. Constat hors scénario : l'écran `/resultats?day=2026-11-01` n'affiche qu'un seul bronze (ARG) sur la carte du Judo alors que le Sénégal est crédité d'un bronze (hors périmètre : « second bronze affiché » est exclu de la spec) ; capture `.test-shots/007-AS2-resultats-judo-un-seul-bronze-320-dark-after.jpg`.
**Verdict** : ✅
**Issue** : —

### 007-AS3.1 — [API] Une égalité à l'or est dite, pas devinée

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : après 007-AS1.1, lire `lastRun.report.exhaustiveness`.
**Attendu** : `finalsSeen: 6`, `finalsWithPodium: 5`, une finale ignorée (Swimming, Men 50m Butterfly Final) avec la raison `TIED_PLACES` ; aucun podium ni médaille pour GRE, POR ou BEL.
**Observé** : `finalsSeen: 6`, `finalsWithPodium: 5`, une finale ignorée : Swimming, `Men 50m Butterfly Final`, `TIED_PLACES`, `detail: « égalité : or GRE+POR, argent  »`. Aucun podium ni médaille pour GRE, POR ou BEL dans `/api/podiums` et `/api/medals`. Défaut cosmétique : le détail se termine par « argent » suivi d'un blanc (valeur vide).
**Verdict** : ✅
**Issue** : —

### 007-AS4.1 — [API] Une correction du journaliste n'est jamais écrasée

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, corriger le Judo Men -66 kg : `PUT /api/podiums/:id` avec CAN or, UKR argent, ARG bronze. Puis rejouer l'import.
**Attendu** : le podium reste CAN, UKR, ARG avec sa date de correction ; `lastRun.report.kept` contient le Judo avec `reason: CORRECTED`, `current.gold: CAN`, `source.gold: UKR` ; `counts.kept: 1`.
**Vérif [BE]** : `podiums.corrected_at` renseigné, aucune ligne de révision de plus créée par l'import.
**Observé** : PUT CAN/UKR/ARG → `correctedAt` posé. Import rejoué : `counts.kept: 1`, `kept[0]` = Judo, `reason: CORRECTED`, `current.gold: CAN`, `source.gold: UKR` ; le podium reste CAN/UKR/ARG avec sa date de correction, `secondBronze: SEN` conservé. `/revisions` renvoie une seule ligne (l'ancienne version UKR/CAN/ARG) avant comme après l'import : l'import n'ajoute aucune révision.
**Verdict** : ✅
**Issue** : —

### 007-AS4.2 — [API] Un podium saisi à la main n'est pas dupliqué

**Profil** : journaliste
**Priorité** : critique
**Technique** : table-décision
**Action** : base neuve. Avant tout import, `POST /api/podiums` avec « Swimming – Women's 50m Freestyle », Swimming, 2026-11-01, USA or, ITA argent, FRA bronze (le nom exact que l'import donnera, avec le tiret long). Lancer l'import. Rejouer avec un autre nom, « Natation 50 m nage libre dames ».
**Attendu** : avec le nom exact, un seul podium pour l'épreuve, resté USA, ITA, FRA, et un écart `reason: MANUAL` (`source.gold: GBR`) dans `kept` ; avec l'autre nom, deux podiums coexistent (limite connue : la clé est le nom), ce que le testeur note dans Observé.
**Observé** : Avec le nom exact (tiret long, posté par un script Node : le shell Windows abîme le tiret) : un seul podium Swimming, resté USA/ITA/FRA, `kept` = `reason: MANUAL` (la source disait ITA à l'or et non GBR, car le faux site avait été corrigé à l'AS4.3 : même mécanisme). Avec « Natation 50 m nage libre dames » : deux podiums coexistent (limite connue) ; le tableau des médailles compte alors l'épreuve deux fois (ITA 1 or + 1 argent, USA 1 or, FRA 2 bronzes). Voir aussi 007-AS4.5.
**Verdict** : ✅
**Issue** : —

### 007-AS4.3 — [API] Une correction officielle est suivie, l'ancienne version reste

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, `GET http://127.0.0.1:4010/__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA`, rejouer l'import, puis lire le podium de la natation et `GET /api/podiums/:id/revisions`.
**Attendu** : le podium prend ITA, GBR, FRA, sans `correctedAt` ; `lastRun.report.updated` donne l'ancien (`gold: GBR`) et le nouveau (`gold: ITA`) ; les révisions rendent l'ancienne version GBR, ITA, FRA.
**Vérif [BE]** : une ligne de `podium_revisions` pour ce podium.
**Observé** : Après `__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA` et relance : podium ITA/GBR/FRA, `correctedAt` absent ; `report.updated` donne `current.gold: GBR` et `source.gold: ITA` ; `/revisions` rend une ligne GBR/ITA/FRA.
**Verdict** : ✅
**Issue** : —

### 007-AS4.4 — [API] Une épreuve en base absente du site est signalée

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : après 007-AS1.1, `POST /api/podiums` avec « Judo – Women -52 kg », Judo, 2026-11-01, SEN/JPN/FRA ; rejouer l'import.
**Attendu** : `absentFromSource` liste « Judo – Women -52 kg » ; le podium est intact.
**Observé** : Podium « Judo – Women -63 kg » saisi par l'API (SEN/JPN/FRA, 1er nov), import rejoué : `absentFromSource` le liste (avec les autres podiums saisis à la main des jours lus), podium intact. Incident de test : deux premiers essais enregistrés avec un tiret abîmé (U+FFFD) par le shell Windows ; ils prouvent la même chose, le troisième est propre.
**Verdict** : ✅
**Issue** : —

### 007-AS5.1 — [API] Un jour illisible n'arrête pas les autres

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : base neuve ; `GET http://127.0.0.1:4010/__fail?match=ScheduleDatePartial&day=02112026` ; lancer l'import ; `__heal` ; relancer.
**Attendu** : première exécution `status: partial`, les trois podiums du 1er novembre importés, `daysFailed: ["2026-11-02"]`, une erreur lisible en français ; après `__heal`, la relance importe les deux de lutte et le statut redevient `success`.
**Vérif [BE]** : les logs de l'API contiennent un avertissement par erreur (`RunScrape`), jamais de trace d'arrêt.
**Observé** : Panne `ScheduleDatePartial` du 2 nov : `status: partial`, 3 podiums du 1er importés, `daysFailed: ["2026-11-02"]`, erreur « 2026-11-02 : calendrier illisible (HTTP 500 sur …) » ; après `__heal`, relance : 2 importés (lutte), 3 identiques, `success`. Logs : `WARN [RunScrape] 2026-11-02 : calendrier illisible…` puis `LOG [RunScrape] Import manual partial/success : {…}, jours lus 7/8` ; aucune trace d'arrêt.
**Verdict** : ✅
**Issue** : —

### 007-AS5.2 — [API] Un site entièrement en panne laisse les données intactes

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : après 007-AS1.1, `GET http://127.0.0.1:4010/__fail?match=nh%2Fen` (toute page en 500), lancer l'import, relire l'état, les podiums et le tableau.
**Attendu** : `status: failed`, `daysRead: []`, des erreurs listées ; les cinq podiums et le tableau des médailles sont inchangés ; l'API répond toujours (`GET /api/health`).
**Observé** : `__fail?match=nh%2Fen` : `status: failed`, `daysRead: []`, 8 erreurs listées (une par jour). Les cinq podiums et `GET /api/medals` sont inchangés ; `GET /api/health` → `200 {status: ok}`.
**Verdict** : ✅
**Issue** : —

### 007-AS5.3 — [API] Pas deux exécutions en même temps

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : relancer l'API avec `SCRAPING_REQUEST_DELAY_MS=400` ; envoyer deux `POST /api/scraping/runs` à la suite, sans attendre.
**Attendu** : le premier rend `202`, le second `409` avec le code `SCRAPE_ALREADY_RUNNING` ; `GET /api/scraping` montre `running: true` pendant l'exécution ; une troisième demande, la première finie, rend `202`.
**Observé** : `SCRAPING_REQUEST_DELAY_MS=400` : premier POST `202`, second `409` `SCRAPE_ALREADY_RUNNING` (le `detail` est en anglais : « A scrape is already running… »). Six POST parallèles pendant l'exécution : six `409`. `running: true` pendant l'exécution, une seule ligne dans `recentRuns`, troisième demande après la fin : `202`.
**Verdict** : ✅
**Issue** : —

### 007-AS6.1 — [API] Éteint par défaut

**Profil** : journaliste
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : lancer l'API sans `SCRAPING_ENABLED`, attendre 90 secondes, lire `GET /api/scraping`.
**Attendu** : `enabled: false`, `nextRunAt: null`, `lastRun: null`, `recentRuns: []`, aucune requête reçue par le faux site ; le log de démarrage dit que l'import est désactivé.
**Observé** : Sans `SCRAPING_ENABLED`, après 100 s : `enabled: false`, `nextRunAt: null`, `lastRun: null`, `recentRuns: []`. Log de démarrage : « Import automatique désactivé (SCRAPING_ENABLED) ». Limite : le faux site n'a pas de compteur de requêtes ; « aucune requête reçue » est déduit de l'absence totale d'exécution.
**Verdict** : ✅
**Issue** : —

### 007-AS6.2 — [API] Rattrapage au démarrage, puis une fois à l'heure fixe

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base neuve ; lancer l'API avec `SCRAPING_ENABLED=true SCRAPING_TIMEZONE=Africa/Dakar SCRAPING_TICK_SECONDS=5 SCRAPING_DAILY_TIME=<HH:MM dans 2 minutes, heure de Dakar = UTC>` ; observer l'état au démarrage puis après le passage de l'heure.
**Attendu** : au démarrage, une exécution `trigger: startup` (aucun import réussi : rattrapage) ; à l'heure réglée, une seule exécution `trigger: scheduled` ; rien de plus les minutes suivantes ; `nextRunAt` rend le créneau du lendemain à la même heure.
**Observé** : `SCRAPING_ENABLED=true`, tick 5 s, heure 14:29 (Dakar = UTC) : au démarrage (14:27:07) une exécution `startup` (5 importés) ; à 14:29:02 une seule exécution `scheduled` (5 identiques) ; trois minutes plus tard toujours deux lignes ; `nextRunAt: 2026-11-09T14:29:00.000Z`. Quatre autres fuseaux vérifiés sur `nextRunAt` (Kolkata +5:30, São Paulo, Kiritimati +14, Dakar 00:00) : tous justes.
**Verdict** : ✅
**Issue** : —

### 007-AS6.3 — [API] Une heure ou un fuseau invalide arrête le démarrage

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_DAILY_TIME=25:00`, puis `SCRAPING_DAILY_TIME=7h30`, puis `SCRAPING_TIMEZONE=Mars/Phobos`.
**Attendu** : chaque démarrage échoue avec « Configuration invalide » qui nomme la variable fautive ; jamais de démarrage avec un réglage faux.
**Observé** : `25:00`, `7h30` (et `24:00`, `7:30`, vide) : « Configuration invalide : … → at SCRAPING_DAILY_TIME », sortie `1` ; `Mars/Phobos` : « fuseau horaire IANA inconnu → at SCRAPING_TIMEZONE ». Même refus pour `SCRAPING_ENABLED=maybe`, `FIRST_DAY=2026-02-31`, `INTERVAL_MINUTES=-5`, `TICK_SECONDS=0`, `SOURCE_URL=pas-une-url`. Défaut mineur : le détail est en anglais (« Invalid string: must match pattern… »). Voir 007-AS6.4 pour une configuration absurde acceptée.
**Verdict** : ✅
**Issue** : —

### 007-AS7.1 — [API] Un compte rendu lisible

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : après 007-AS4.1 et 007-AS4.3 sur la même base, lire `GET /api/scraping`.
**Attendu** : le corps donne `enabled`, `running`, `schedule` (23:00, Africa/Dakar), `lastRun` (heure de début et de fin, `trigger`, `status`, `counts`, détail `imported`, `updated`, `kept`, `absentFromSource`, `exhaustiveness`, `errors`) et `recentRuns` (les dix dernières, plus récente d'abord, sans détail) ; chaque écart montre l'ancien et le nouveau podium.
**Observé** : Après AS4.1 et AS4.3 : `GET /api/scraping` rend `enabled`, `running`, `schedule` (23:00, Africa/Dakar, `firstDay`, `lastDay`), `nextRunAt`, `lastRun` (`id`, `trigger`, `status`, `startedAt`, `finishedAt`, `counts`, `report` avec `imported`, `updated`, `kept`, `identical`, `absentFromSource`, `exhaustiveness`, `errors`) et `recentRuns` (5 lignes, plus récente d'abord, sans détail). Chaque écart montre `current` et `source`. Le plafond de dix lignes n'a pas été éprouvé.
**Verdict** : ✅
**Issue** : —

### 007-AS7.2 — [BE] Le script manuel lit le site avec le même code

**Profil** : journaliste
**Priorité** : normal
**Technique** : nominal
**Action** : `SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp SCRAPING_REQUEST_DELAY_MS=0 pnpm db:scrape`, lire le résumé affiché et `apps/api/data/podiums.json`, puis `git checkout apps/api/data/podiums.json`.
**Attendu** : « 6 finale(s) vue(s), 5 podium(s) écrit(s) », une finale ignorée avec `TIED_PLACES`, le fichier contient `second_bronze: "SEN"` pour le judo ; aucun appel au vrai site.
**Observé** : `SCRAPING_SOURCE_URL=http://127.0.0.1:4010/… pnpm db:scrape` : « 6 finale(s) vue(s), 5 podium(s) écrit(s) dans data/podiums.json », « 1 finale(s) ignorée(s) : … Men 50m Butterfly Final : TIED_PLACES » ; `second_bronze: "SEN"` présent pour le judo. Fichier restauré par `git checkout`. Constat : le script remplace tout `data/podiums.json` (la graine, 598 lignes supprimées) par les cinq podiums scrapés : sans `git checkout`, la graine est perdue.
**Verdict** : ✅
**Issue** : —

### 007-AS7.3 — [BE] Aucun log fantôme, aucun secret

**Profil** : journaliste
**Priorité** : normal
**Technique** : nominal
**Action** : relire les logs de l'API pendant 007-AS1.1 et 007-AS5.1.
**Attendu** : des lignes au format Nest (`[RunScrape]`) avec le compte rendu en une ligne ; aucune sortie brute (`console`), aucun identifiant ni mot de passe, aucune page HTML.
**Observé** : Logs relus sur AS1.1 et AS5.1 : lignes Nest `LOG/WARN [RunScrape]`, compte rendu en une ligne (`{imported…}, jours lus 8/8`), aucun `console`, ni identifiant, ni mot de passe, ni HTML. Seules lignes `ERROR` rencontrées : `[ProblemDetailsFilter] PayloadTooLargeError` (voir session imprévisible).
**Verdict** : ✅
**Issue** : —

### 007-AS1.3 — [WEB] Le tableau des médailles et « Mon pays » montrent les données importées (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : nominal
**Action** : API sur base neuve, import manuel (5 podiums), puis ouvrir `/medailles`, `/` et `/resultats?day=2026-11-01` dans le navigateur à 375 px puis 320 px ; changer « Mon pays » (SEN puis UKR) et revenir à SEN.
**Attendu** : le tableau rend les 13 pays importés, le Sénégal en rang 1 avec 2 or, 0 argent, 1 bronze et la mention « Mon pays » ; la page d'accueil montre les 5 premiers pays ; aucun défilement horizontal ; console propre.
**Observé** : base vide avant import : état vide « Aucune médaille pour l'instant » (capture `.test-shots/007-base-vide-medailles-375-dark-before.jpg`). Après import : 13 lignes, SEN rang 1 « 2 / 0 / 1 » encadré avec « Mon pays » à 375 px (capture `007-AS1-medailles-importees-375-dark-after.jpg`) et à 320 px (`007-AS1-medailles-importees-monpays-320-dark-after.jpg`) ; la table tient dans 288 px sans défilement (`scrollWidth` 320 = fenêtre). Accueil : cinq premiers pays (SEN, GBR, HKG, UKR, JPN), 4 disciplines (Beach Wrestling, Judo, Swimming, Wushu Taolu). Choix d'UKR : ligne UKR marquée « mon pays », `joj.mon-pays=UKR` mémorisé ; retour à SEN ok. Jour du 1er nov : 3 épreuves, cartes OK. Console : aucune erreur ni avertissement (seule la ligne « server connection lost » de Vite quand j'ai relancé le serveur de dev). Défauts : (1) 6 des 13 pays importés (AZE, COD, HKG, IRI, UKR, VIE) n'ont pas de nom dans le tableau ni dans la liste « Mon pays » (« UKR » seul) ; (2) à 320 px le badge « Mon pays » passe sur deux lignes et mord la bordure de la ligne SEN (capture 320) ; (3) les disciplines et épreuves importées restent en anglais (« Swimming – Women's 50m Freestyle ») dans une interface en français ; (4) le second bronze du judo n'est affiché nulle part (voir 007-AS2.1).
**Verdict** : 🟡
**Issue** : —

### 007-AS4.5 — [WEB] Un podium saisi à la main avec un tiret simple n'est pas reconnu (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : table-décision
**Action** : import fait (5 podiums). Dans `/journaliste` à 375 px, enregistrer par l'écran « Swimming - Women's 50m Freestyle » (tiret du clavier), discipline Swimming, 1er nov, USA, ITA, FRA. Relancer l'import. Lire `/resultats?day=2026-11-01` et `/api/medals`. En API : poster la même épreuve en minuscules avec le tiret long.
**Attendu** : l'épreuve est reconnue comme la même que celle de l'import, ou à défaut le doublon est signalé au journaliste et dans le compte rendu.
**Observé** : l'écran enregistre sans réserve (« Podium enregistré », capture `007-AS4.2-saisie-main-tiret-simple-375-dark-after.jpg`). Le public voit alors deux cartes « Swimming » presque identiques (tiret simple USA/ITA/FRA, tiret long GBR/ITA/FRA) sur `/resultats?day=2026-11-01` (capture `007-AS4.2-resultats-doublon-natation-375-dark-after.jpg`) ; le tableau compte l'épreuve deux fois (GBR 1 or, USA 1 or, ITA 2 argents, FRA 2 bronzes). Le compte rendu d'import dit seulement `absentFromSource: [« Swimming - Women's 50m Freestyle »]` : rien n'indique le doublon. La même épreuve en minuscules avec le tiret long est bien refusée (`409 PODIUM_ALREADY_RECORDED`). À 69dc16b le rapprochement de l'import ne reconnaît pas la variante ; les commits T10 (`4a2bafb`) puis T07 à T11 arrivés ensuite sur la branche pendant la campagne n'ont pas été rejoués ici : T10 règle le rapprochement de l'import mais pas le refus à la saisie, à re-tester.
**Verdict** : 🟡
**Issue** : —

### 007-AS5.4 — [API] Une source qui répond « 200 » mais vide ou illisible (ajouté par le testeur)

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : base avec les 5 podiums importés ; entre l'API et le faux site, un intermédiaire local réglable répond `200` avec : un corps vide, une page « Maintenance » sans structure, un JSON `{"ok":true}`, 30 Mo de `x`. Lancer l'import après chacun, puis relire l'état, les podiums et le tableau.
**Attendu** : un site qui ne ressemble plus à la source n'est pas un « succès » : jours en échec, erreur lisible, `status: partial` ou `failed` ; les podiums restent intacts.
**Observé** : dans les quatre cas : `status: success`, `errors: 0`, `daysRead` = 8 jours, `daysFailed: []`, `finalsSeen: 0`, et `absentFromSource` liste les cinq podiums (« Judo – Men -66 kg », etc.). Les podiums et le tableau restent intacts (5 podiums, médailles inchangées). Le « 404 » du site donne bien `failed` avec 8 erreurs, mais une page de maintenance servie en `200` (cas courant d'un site qui change de structure) passe pour un succès. Seul indice : `finalsSeen: 0` et les cinq « absents » dans le rapport ; rien dans le statut ni dans le log (« Import manual success : {…absent:5…} »).
**Verdict** : ❌
**Issue** : —

### 007-AS5.5 — [API] Une source lente, au-delà du délai (ajouté par le testeur)

**Profil** : supporter
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : intermédiaire local qui retarde chaque réponse ; `SCRAPING_REQUEST_TIMEOUT_MS=1500`. Réponses retardées de 600 ms (sous le délai) puis de 3 s (au-delà) ; pendant la première, un second POST.
**Attendu** : sous le délai, l'import réussit ; au-delà, des erreurs lisibles par jour, sans blocage ; le second POST est refusé.
**Observé** : 600 ms : `success`, 5 identiques, durée 8,7 s ; second POST pendant l'exécution : `409`. 3 s : `failed`, `daysRead: []`, 8 erreurs « 2026-11-01 : calendrier illisible (The operation was aborted due to timeout) », durée 12 s, podiums intacts, API réactive. Défaut mineur : le message de délai dépassé est en anglais ; avec le délai par défaut de 30 s, un site muet immobiliserait l'exécution 8 × 30 s = 4 minutes (le 409 couvre toute cette durée).
**Verdict** : 🟡
**Issue** : —

### 007-AS5.6 — [API] Redémarrage de l'API pendant une exécution (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : `SCRAPING_REQUEST_DELAY_MS=400`, `POST /api/scraping/runs`, tuer le processus de l'API (`taskkill`) 2,5 s plus tard en pleine lecture, relancer sur la même base, relire l'état, lancer un import.
**Attendu** : pas d'état « en cours » fantôme, pas de podium à moitié écrit, import suivant normal.
**Observé** : avant la coupure : `running: true`, 0 podium écrit (l'écriture se fait en fin de lecture). Après redémarrage : `running: false`, `lastRun: null`, `recentRuns: []`, 0 podium ; l'import suivant : `202`, `success`, 5 importés, une seule ligne dans `recentRuns`. Une coupure pendant la courte phase d'écriture n'a pas été provoquée.
**Verdict** : ✅
**Issue** : —

### 007-AS6.4 — [API] Une plage de jours à l'envers est acceptée sans un mot (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : `SCRAPING_ENABLED=true SCRAPING_FIRST_DAY=2026-11-13 SCRAPING_LAST_DAY=2026-11-01`, base en mémoire ; lire le log de démarrage et `GET /api/scraping` après 8 s.
**Attendu** : démarrage refusé (« Configuration invalide ») ou avertissement net ; jamais un import « actif » qui ne fera jamais rien.
**Observé** : démarrage accepté ; log « Import automatique actif : 23:00 (Africa/Dakar), du 2026-11-13 au 2026-11-01 » ; `enabled: true`, `nextRunAt: null`, aucune exécution, pas même le rattrapage du démarrage, aucun avertissement.
**Verdict** : 🟡
**Issue** : —

### 007-AS8.1 — [WEB] Le second bronze et les noms de pays se lisent à l'écran

**Profil** : supporter
**Priorité** : critique
**Technique** : nominal
**Action** : après 007-AS1.1 sur la base importée, ouvrir `/resultats?day=2026-11-01` à 375 puis 320 px, puis `/medailles`, ouvrir la liste « Mon pays » et choisir UKR, HKG puis revenir à SEN.
**Attendu** : la carte du Judo Men -66 kg montre quatre lignes (or UKR, argent CAN, bronze ARG, bronze SEN) ; le tableau et la liste nomment les pays (Ukraine, Hong Kong, Sénégal, Azerbaïdjan, RD Congo, Vietnam, Iran) ; à 320 px la pastille « Mon pays » reste entière, sous le pays, sans mordre la bordure de la ligne.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

## Session imprévisible

Pas d'écran propre à cette tranche : essais d'API ci-dessous, plus les gestes du front sur les pages qui affichent les données importées (voir 007-AS1.3). Exécuté par le testeur le 2026-11-08, build 69dc16b.

| #   | Geste                                                                                                  | Observé                                                                                                                                                                                                                                                                                                                  | Verdict |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| S1  | Double déclenchement manuel, puis six POST simultanés                                                  | Un `202`, tous les autres `409 SCRAPE_ALREADY_RUNNING` ; une seule exécution enregistrée (voir 007-AS5.3).                                                                                                                                                                                                               | ✅      |
| S2  | `POST /api/scraping/runs` avec un corps JSON absurde, dont `sourceUrl` d'un autre site                 | `202` ; le corps est ignoré, l'import lit toujours `SCRAPING_SOURCE_URL` (le faux site : aucun appel ailleurs). `text/plain` : `202`. JSON invalide : `400 BAD_REQUEST` propre.                                                                                                                                          | ✅      |
| S3  | `GET /api/scraping?x=1&day=bidon`, `DELETE`, `PUT`, `PATCH`, `OPTIONS`, `GET /runs`, chemin emoji      | `200` pour le GET avec paramètres inutiles ; `404` problème+JSON pour tout le reste ; jamais de `500`.                                                                                                                                                                                                                   | ✅      |
| S4  | `POST /api/scraping/runs` avec un corps de 300 Ko puis de 5 Mo                                         | `500 INTERNAL_ERROR` « An unexpected error occurred. » ; le log montre `ERROR [ProblemDetailsFilter] PayloadTooLargeError: request entity too large`. Attendu : `413`. Même résultat sur `POST /api/podiums` : défaut du filtre d'erreurs commun, antérieur à la tranche, mais le playbook exigeait « jamais de `500` ». | ❌      |
| S5  | Source indisponible, lente, vide, illisible, redirigée (voir AS5.1, AS5.2, AS5.4, AS5.5)               | `404` du site et pannes : `failed`/`partial` propres ; lent : `failed` en 12 s ; redirection vers un hôte inexistant : `failed` (délai) ; vide/illisible en `200` : faux succès (AS5.4).                                                                                                                                 | ❌      |
| S6  | Redémarrage pendant une exécution                                                                      | Voir 007-AS5.6.                                                                                                                                                                                                                                                                                                          | ✅      |
| S7  | Podium saisi à la main puis scrapé ; podium corrigé puis scrapé ; correction officielle                | Voir 007-AS4.1 à AS4.5 : jamais écrasé ; limite du nom : doublons (AS4.2, AS4.5).                                                                                                                                                                                                                                        | 🟡      |
| S8  | Heure de planification : heure + 2 min, fuseaux à demi-heure, +14, jour suivant ; configuration fausse | Voir 007-AS6.2, AS6.3, AS6.4.                                                                                                                                                                                                                                                                                            | 🟡      |
| S9  | `/medailles`, `/`, `/resultats` à 375 puis 320 px, « Mon pays », console                               | Voir 007-AS1.3 : aucun débordement, console propre ; défauts d'affichage listés.                                                                                                                                                                                                                                         | 🟡      |
| S10 | Contrôle anti vibe-coding (`anti_slop.py`)                                                             | 3 ERREURS « icônes d'IA par défaut : lucide » dans `apps/web/components.json:20` et `specs/design/artefact-design.html:1717, 2974`, plus l'avertissement « page sans image » de `apps/web/index.html` (page vérifiée à l'écran : mascotte et logo présents). Hors diff de la tranche.                                    | 🟡      |

Non joué : coupure réseau côté navigateur et zoom 200 % (aucun écran nouveau dans cette tranche), clavier seul, coupure en pleine phase d'écriture, plafond de dix lignes de `recentRuns`, exécutions sur le vrai site (interdit).

### Contexte de la campagne

- Le dépôt a reçu cinq commits pendant la campagne (`0d14309` T07, `d4812e9` T08, `b13ecc3` T09, `4a2bafb` T10, `e602e8b` T11) et `apps/api/dist` a été recompilé à 14:28:58 par une autre session : j'ai donc refait dans un worktree propre à 69dc16b tous les essais lancés après cette heure (sources dégradées, redémarrage, tiret, corps volumineux, fuseaux, `db:scrape`). Rien de ce rapport ne porte sur T07 à T11.
- Choix du testeur : un script Node (`fetch`) pour poster les noms avec tiret long, parce que le shell Windows abîme l'octet (artefact du poste de test, pas de l'application).
