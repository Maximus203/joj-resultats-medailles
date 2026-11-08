# 007 — Import automatique des résultats officiels

> Spec : specs/007-import-automatique · Statut : ⬜ · Build : — · Testé : —
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
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS1.2 — [API] Relancer ne change rien

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, lancer l'import deux fois de plus (en attendant la fin à chaque fois), puis relire l'état et la liste des podiums.
**Attendu** : à chaque relance `counts.imported: 0`, `updated: 0`, `identical: 5` ; toujours cinq podiums, mêmes `id`, aucun doublon.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS2.1 — [API] Finale non marquée « or » et second bronze

**Profil** : supporter
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : après 007-AS1.1, lire le podium du Judo Men -66 kg, celui du Wushu Taolu Combined, puis `GET /api/medals`.
**Attendu** : le Wushu a son podium (HKG, VIE, JPN) ; le Judo porte `secondBronze: SEN` ; le tableau compte pour le Sénégal 2 ors (les deux lutte sur plage) et 1 bronze, et pour ARG 1 bronze.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS3.1 — [API] Une égalité à l'or est dite, pas devinée

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : après 007-AS1.1, lire `lastRun.report.exhaustiveness`.
**Attendu** : `finalsSeen: 6`, `finalsWithPodium: 5`, une finale ignorée (Swimming, Men 50m Butterfly Final) avec la raison `TIED_PLACES` ; aucun podium ni médaille pour GRE, POR ou BEL.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS4.1 — [API] Une correction du journaliste n'est jamais écrasée

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, corriger le Judo Men -66 kg : `PUT /api/podiums/:id` avec CAN or, UKR argent, ARG bronze. Puis rejouer l'import.
**Attendu** : le podium reste CAN, UKR, ARG avec sa date de correction ; `lastRun.report.kept` contient le Judo avec `reason: CORRECTED`, `current.gold: CAN`, `source.gold: UKR` ; `counts.kept: 1`.
**Vérif [BE]** : `podiums.corrected_at` renseigné, aucune ligne de révision de plus créée par l'import.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS4.2 — [API] Un podium saisi à la main n'est pas dupliqué

**Profil** : journaliste
**Priorité** : critique
**Technique** : table-décision
**Action** : base neuve. Avant tout import, `POST /api/podiums` avec « Swimming – Women's 50m Freestyle », Swimming, 2026-11-01, USA or, ITA argent, FRA bronze (le nom exact que l'import donnera, avec le tiret long). Lancer l'import. Rejouer avec un autre nom, « Natation 50 m nage libre dames ».
**Attendu** : avec le nom exact, un seul podium pour l'épreuve, resté USA, ITA, FRA, et un écart `reason: MANUAL` (`source.gold: GBR`) dans `kept` ; avec l'autre nom, deux podiums coexistent (limite connue : la clé est le nom), ce que le testeur note dans Observé.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS4.3 — [API] Une correction officielle est suivie, l'ancienne version reste

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après 007-AS1.1, `GET http://127.0.0.1:4010/__set?code=S50-FNL&medals=gold:ITA,silver:GBR,bronze:FRA`, rejouer l'import, puis lire le podium de la natation et `GET /api/podiums/:id/revisions`.
**Attendu** : le podium prend ITA, GBR, FRA, sans `correctedAt` ; `lastRun.report.updated` donne l'ancien (`gold: GBR`) et le nouveau (`gold: ITA`) ; les révisions rendent l'ancienne version GBR, ITA, FRA.
**Vérif [BE]** : une ligne de `podium_revisions` pour ce podium.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS4.4 — [API] Une épreuve en base absente du site est signalée

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : après 007-AS1.1, `POST /api/podiums` avec « Judo – Women -52 kg », Judo, 2026-11-01, SEN/JPN/FRA ; rejouer l'import.
**Attendu** : `absentFromSource` liste « Judo – Women -52 kg » ; le podium est intact.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS5.1 — [API] Un jour illisible n'arrête pas les autres

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : base neuve ; `GET http://127.0.0.1:4010/__fail?match=ScheduleDatePartial&day=02112026` ; lancer l'import ; `__heal` ; relancer.
**Attendu** : première exécution `status: partial`, les trois podiums du 1er novembre importés, `daysFailed: ["2026-11-02"]`, une erreur lisible en français ; après `__heal`, la relance importe les deux de lutte et le statut redevient `success`.
**Vérif [BE]** : les logs de l'API contiennent un avertissement par erreur (`RunScrape`), jamais de trace d'arrêt.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS5.2 — [API] Un site entièrement en panne laisse les données intactes

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : après 007-AS1.1, `GET http://127.0.0.1:4010/__fail?match=nh%2Fen` (toute page en 500), lancer l'import, relire l'état, les podiums et le tableau.
**Attendu** : `status: failed`, `daysRead: []`, des erreurs listées ; les cinq podiums et le tableau des médailles sont inchangés ; l'API répond toujours (`GET /api/health`).
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS5.3 — [API] Pas deux exécutions en même temps

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : relancer l'API avec `SCRAPING_REQUEST_DELAY_MS=400` ; envoyer deux `POST /api/scraping/runs` à la suite, sans attendre.
**Attendu** : le premier rend `202`, le second `409` avec le code `SCRAPE_ALREADY_RUNNING` ; `GET /api/scraping` montre `running: true` pendant l'exécution ; une troisième demande, la première finie, rend `202`.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS6.1 — [API] Éteint par défaut

**Profil** : journaliste
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : lancer l'API sans `SCRAPING_ENABLED`, attendre 90 secondes, lire `GET /api/scraping`.
**Attendu** : `enabled: false`, `nextRunAt: null`, `lastRun: null`, `recentRuns: []`, aucune requête reçue par le faux site ; le log de démarrage dit que l'import est désactivé.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS6.2 — [API] Rattrapage au démarrage, puis une fois à l'heure fixe

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : base neuve ; lancer l'API avec `SCRAPING_ENABLED=true SCRAPING_TIMEZONE=Africa/Dakar SCRAPING_TICK_SECONDS=5 SCRAPING_DAILY_TIME=<HH:MM dans 2 minutes, heure de Dakar = UTC>` ; observer l'état au démarrage puis après le passage de l'heure.
**Attendu** : au démarrage, une exécution `trigger: startup` (aucun import réussi : rattrapage) ; à l'heure réglée, une seule exécution `trigger: scheduled` ; rien de plus les minutes suivantes ; `nextRunAt` rend le créneau du lendemain à la même heure.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS6.3 — [API] Une heure ou un fuseau invalide arrête le démarrage

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lancer l'API avec `SCRAPING_DAILY_TIME=25:00`, puis `SCRAPING_DAILY_TIME=7h30`, puis `SCRAPING_TIMEZONE=Mars/Phobos`.
**Attendu** : chaque démarrage échoue avec « Configuration invalide » qui nomme la variable fautive ; jamais de démarrage avec un réglage faux.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS7.1 — [API] Un compte rendu lisible

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : après 007-AS4.1 et 007-AS4.3 sur la même base, lire `GET /api/scraping`.
**Attendu** : le corps donne `enabled`, `running`, `schedule` (23:00, Africa/Dakar), `lastRun` (heure de début et de fin, `trigger`, `status`, `counts`, détail `imported`, `updated`, `kept`, `absentFromSource`, `exhaustiveness`, `errors`) et `recentRuns` (les dix dernières, plus récente d'abord, sans détail) ; chaque écart montre l'ancien et le nouveau podium.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS7.2 — [BE] Le script manuel lit le site avec le même code

**Profil** : journaliste
**Priorité** : normal
**Technique** : nominal
**Action** : `SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp SCRAPING_REQUEST_DELAY_MS=0 pnpm db:scrape`, lire le résumé affiché et `apps/api/data/podiums.json`, puis `git checkout apps/api/data/podiums.json`.
**Attendu** : « 6 finale(s) vue(s), 5 podium(s) écrit(s) », une finale ignorée avec `TIED_PLACES`, le fichier contient `second_bronze: "SEN"` pour le judo ; aucun appel au vrai site.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 007-AS7.3 — [BE] Aucun log fantôme, aucun secret

**Profil** : journaliste
**Priorité** : normal
**Technique** : nominal
**Action** : relire les logs de l'API pendant 007-AS1.1 et 007-AS5.1.
**Attendu** : des lignes au format Nest (`[RunScrape]`) avec le compte rendu en une ligne ; aucune sortie brute (`console`), aucun identifiant ni mot de passe, aucune page HTML.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

## Session imprévisible

Voir [`transverse.md`](transverse.md) : pas d'écran dans cette tranche ; le testeur ajoute seulement des essais d'API (corps de `POST /api/scraping/runs` absurde, `GET /api/scraping?x=1`, `DELETE /api/scraping`) qui ne doivent jamais produire de `500`.
