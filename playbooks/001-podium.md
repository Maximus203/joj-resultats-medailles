# 001 — Enregistrer le podium d'une épreuve

> Spec : specs/001-podium · Statut : 🟡 (6 ✅ [API] ; [WEB] : 3 ✅, 1 🟡) · Build : journee @f96f561 (API :3000 et front :5173 déjà lancés, base démo seedée ; arbre : seuls apps/web/.tanstack/ et specs/design/ non suivis) · Testé : 2026-11-07 (campagne [WEB] sur l'application réelle, navigateur intégré, 375 px sombre puis 320 px clair)
> Surfaces : [API] [WEB] · Profils : journaliste (supporter : constat seulement)

## Préconditions

- `pnpm db:reset` puis `pnpm dev` ; base vide, aucune épreuve enregistrée. Les données se créent par l'application.
- [API] `POST http://localhost:3000/api/podiums`, corps JSON `{ "eventName", "discipline", "day", "gold", "silver", "bronze" }` (plan 001, section 2). Aucun écran n'est prévu pour cette tranche : les scénarios `[WEB]` restent ⏭️ tant qu'un écran d'enregistrement n'est pas livré par une tranche suivante ; ils sont écrits pour être joués dès qu'il existe.
- Valeurs de référence : épreuve « Lutte filles 52 kg », discipline « Lutte », jour `2026-11-05`, or SEN, argent JPN, bronze FRA.

## Scénarios

### 001-AS1.1 — [API] Le journaliste enregistre un podium

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : envoyer le podium de référence (SEN / JPN / FRA) à `POST /api/podiums`.
**Attendu** : réponse `201` ; le corps contient l'épreuve, sa discipline, son jour et trois médaillés avec leur médaille et leur pays (SEN or, JPN argent, FRA bronze).
**Vérif [BE]** : une seule ligne de podium en base, avec les trois pays dans le bon ordre.
**Observé** : `POST /api/podiums` avec le podium de référence → `201`, corps : `{id, eventName:"Lutte filles 52 kg", discipline:"Lutte", day:"2026-11-05", gold:"SEN", silver:"JPN", bronze:"FRA", createdAt}`. Les trois médaillés sont portés par les champs `gold`/`silver`/`bronze` (pas une liste). [BE] lecture de la base après la campagne : une seule ligne « Lutte filles 52 kg », SEN / JPN / FRA, jour 2026-11-05. Écart de précondition : `pnpm db:reset` charge 57 podiums du seed (`apps/api/data/podiums.json`), la base n'était donc pas vide ; aucune épreuve de référence n'y figure (noms en anglais type « Judo – Women -52 kg »), les contrôles [BE] comptent par épreuve (base : 57 avant, 61 après = 4 créations de la campagne, dont une de 100 caractères, « Course Race » et « Extra »).
**Verdict** : ✅
**Issue** : —

### 001-AS1.2 — [WEB] Le journaliste enregistre un podium par l'écran

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : sur l'écran d'enregistrement d'un podium (mobile 375 px), saisir l'épreuve, la discipline, le jour et les trois pays de référence ; valider.
**Attendu** : un message de succès lisible ; le podium enregistré est montré avec ses trois médaillés (SEN or, JPN argent, FRA bronze).
**Vérif [BE]** : même ligne en base qu'en 001-AS1.1.
**Observé** : Par l'écran `/journaliste` (lien « Espace journaliste » de l'en-tête), saisie réelle au clavier à 375 px, thème sombre : « QA Lutte filles 52 kg », Lutte, 05/11/2026, SEN / JPN / FRA. L'aperçu avant enregistrement se met à jour en direct. Clic sur « Enregistrer le podium » → `POST /api/podiums` `201` (requête vue dans le réseau, pas la fausse API), bandeau vert « Podium enregistré. Relisez-le : c'est ce que le public voit. », puis carte du podium avec SEN or, JPN argent, FRA bronze, boutons « Enregistrer un autre podium » et « Voir les résultats du 5 novembre ». [BE] via `GET /api/podiums` : une seule entrée « QA Lutte filles 52 kg », SEN/JPN/FRA, 2026-11-05. Console sans erreur. Captures : `.test-shots/001-podium-001-AS1.2-journaliste-375-dark-before.jpg`, `...-after.jpg`. Remarque : la capture « après » prise juste après le clic montrait encore le formulaire (rendu en retard de l'outil, pas de l'application).
**Verdict** : ✅
**Issue** : —

### 001-AS2.1 — [API] Un second podium pour la même épreuve est refusé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : après 001-AS1.1, renvoyer un podium pour « Lutte filles 52 kg » avec d'autres pays (JPN / SEN / GER).
**Attendu** : réponse `409`, code `PODIUM_ALREADY_RECORDED` ; le premier podium est inchangé.
**Vérif [BE]** : toujours une seule ligne ; pays d'origine SEN / JPN / FRA.
**Observé** : Second envoi (JPN / SEN / GER) → `409`, `code: "PODIUM_ALREADY_RECORDED"`, `type: urn:problem-type:podium-already-recorded`, `details.eventName`. [BE] toujours une seule ligne pour l'épreuve, pays d'origine SEN / JPN / FRA. Point d'attention pour l'écran futur : le `detail` est en anglais (« A podium is already recorded for Lutte filles 52 kg ») ; le message français exigé par 001-AS2.3 devra venir du front à partir du `code`.
**Verdict** : ✅
**Issue** : —

### 001-AS2.2 — [API] La même épreuve écrite autrement est reconnue

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : renvoyer un podium dont `eventName` vaut `  lutte FILLES 52 kg  ` (casse et espaces différents).
**Attendu** : réponse `409`, code `PODIUM_ALREADY_RECORDED` (l'épreuve est identifiée sans tenir compte de la casse ni des espaces en trop).
**Vérif [BE]** : toujours une seule ligne.
**Observé** : `eventName` = `  lutte FILLES 52 kg  ` → `409` `PODIUM_ALREADY_RECORDED`. Variantes ajoutées par le testeur, toutes `409` : `LUTTE FILLES 52 KG` ; `Lutte  filles   52 kg` (espaces internes multiples, normalisés). [BE] toujours une seule ligne. Ajouté par le testeur : 6 `POST` simultanés d'une même épreuve neuve (« Course Race ») → un `201` et cinq `409`, une seule ligne en base (pas de double enregistrement au double clic côté API).
**Verdict** : ✅
**Issue** : —

### 001-AS2.3 — [WEB] Le refus d'un doublon est clair à l'écran

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur l'écran, enregistrer deux fois « Lutte filles 52 kg ».
**Attendu** : le second enregistrement est refusé avec un message de conflit en français qui dit que l'épreuve a déjà un podium ; la saisie du journaliste n'est pas effacée ; le premier podium n'a pas changé.
**Observé** : Après AS1.2, nouvelle saisie de « QA Lutte filles 52 kg » avec JPN / SEN / GER → `POST` `409`. L'écran affiche un bandeau « Cette épreuve a déjà un podium. Le podium enregistré n'a pas changé. Pour le modifier, utilisez la correction. » avec deux liens (« Voir le podium enregistré » → `/resultats?day=2026-11-05`, « Corriger ce podium » → `/journaliste/corriger/<id>`) et, sous le champ Épreuve, « Cette épreuve a déjà un podium : utilisez la correction. ». Saisie conservée (six champs intacts). Podium d'origine inchangé en base (SEN/JPN/FRA, `correctedAt` null). Même résultat par le clavier (Entrée dans un champ) et avec casse/espaces différents (`qa DOUBLE CLIC`). Défaut mineur : les deux liens du bandeau sont en gras sans soulignement ni flèche, ils ressemblent à du texte (cibles de 44 px, pas d'indice visuel de lien). Le focus reste dans le champ après l'erreur (le bandeau est `role=alert`). Capture : `.test-shots/001-podium-001-AS2.3-journaliste-375-dark-after.jpg`.
**Verdict** : ✅
**Issue** : —

### 001-AS3.1 — [API] Deux fois le même pays est refusé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur une épreuve sans podium (« Judo mixte 63 kg »), envoyer or SEN et argent SEN, bronze FRA.
**Attendu** : réponse `422`, code `PODIUM_COUNTRIES_NOT_DISTINCT` ; aucun podium enregistré pour cette épreuve.
**Vérif [BE]** : aucune ligne pour « Judo mixte 63 kg ».
**Observé** : « Judo mixte 63 kg », SEN / SEN / FRA → `422`, `code: "PODIUM_COUNTRIES_NOT_DISTINCT"`. [BE] zéro ligne pour « Judo mixte 63 kg ». Même ici le `detail` est en anglais (« The gold, silver and bronze medallists must be three different countries »).
**Verdict** : ✅
**Issue** : —

### 001-AS3.2 — [API] Toutes les paires identiques sont refusées

**Profil** : journaliste
**Priorité** : normal
**Technique** : table-décision
**Action** : tenter or = bronze (SEN / JPN / SEN), argent = bronze (SEN / JPN / JPN) et les trois identiques (SEN / SEN / SEN), chacun sur une épreuve neuve.
**Attendu** : `422` `PODIUM_COUNTRIES_NOT_DISTINCT` à chaque fois ; rien en base.
**Vérif [BE]** : aucune ligne pour ces trois épreuves.
**Observé** : Les trois combinaisons (SEN/JPN/SEN, SEN/JPN/JPN, SEN/SEN/SEN, épreuves « Table A », « Table B », « Table C ») → `422` `PODIUM_COUNTRIES_NOT_DISTINCT` à chaque fois. [BE] aucune ligne pour ces trois épreuves.
**Verdict** : ✅
**Issue** : —

### 001-AS3.3 — [WEB] Le refus d'un pays répété est clair à l'écran

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur l'écran, saisir SEN en or et en argent.
**Attendu** : refus avec un message de règle métier en français qui dit que les trois pays doivent être différents ; la saisie est conservée ; aucun podium créé pour l'épreuve.
**Observé** : SEN en or et en argent, FRA en bronze, épreuve « QA Judo mixte 63 kg » → `POST` `422` (réponse du vrai serveur). Bandeau « Un pays ne peut pas figurer deux fois. SEN apparaît en or et en argent. Aucun podium n'a été enregistré pour cette épreuve. » et, sous chaque champ fautif, « SEN est aussi en argent : choisissez un autre pays. » / « SEN est aussi en or : ... », champs en rouge. Saisie conservée. Aucune ligne « QA Judo » en base. Contrôles côté client sans appel réseau (zéro `POST`) : codes vides, 2 lettres, chiffres, accent (`sén`), jour vide, nom d'espaces seuls, tous refusés en français ; les minuscules (`sen`) sont acceptées et passées en majuscules. Capture : `.test-shots/001-podium-001-AS3.3-journaliste-375-dark-after.jpg`.
**Verdict** : ✅
**Issue** : —

### 001-AS3.4 — [API] Une entrée mal formée est refusée comme invalide

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : envoyer successivement : nom vide, nom de 101 caractères, pays `se` (2 lettres), pays `sen` (minuscules), jour `2026-02-31`, champ manquant.
**Attendu** : `400` à chaque fois (validation d'entrée, pas une règle métier) ; rien en base ; jamais de `500`.
**Vérif [BE]** : aucune ligne créée par ces requêtes.
**Observé** : Six entrées → `400` `VALIDATION_FAILED` avec `errors[{path, message}]`, jamais de `500` : nom vide (`eventName`) ; 101 caractères (`<=100`) ; pays `se` et `sen` (`gold`, motif `^[A-Z]{3}$`) ; jour `2026-02-31` (`day`, « Invalid ISO date ») ; champ `bronze` manquant. [BE] aucune ligne créée par ces requêtes. Ajouts du testeur : 100 caractères → `201` (limite valide acceptée) ; nom d'espaces seuls → `400` ; JSON malformé → `400 BAD_REQUEST` ; corps `text/plain` → `400` ; `gold` numérique → `400` ; champs inconnus (`id`, `hack`) ignorés sans erreur → `201`. Les messages de validation sont en anglais (écran futur : à traduire côté front).
**Verdict** : ✅
**Issue** : —

### 001-AS1.3 — [WEB] Le supporter n'a rien à saisir

**Profil** : supporter
**Priorité** : secondaire
**Technique** : transition-état
**Action** : en profil supporter, parcourir l'application depuis l'accueil, puis tenter d'ouvrir l'écran d'enregistrement par son URL.
**Attendu** : constat seulement (le PRD accepte que rien ne limite la saisie pour la démo) : décrire ce que voit le supporter ; un 🟡 si l'écran de saisie est proposé dans sa navigation.
**Observé** : Supporter, 375 px, depuis l'accueil `/`. Il voit un bouton noir « Espace journaliste » dans l'en-tête de TOUTES les pages (accueil, /resultats, /medailles, 404), donc l'écran de saisie est proposé dans sa navigation (le 🟡 prévu par l'Attendu). La barre d'onglets basse n'affiche que Accueil / Résultats / Médailles sur les pages publiques ; l'onglet « Journaliste » n'apparaît qu'une fois dans l'espace journaliste. Par URL directe, `/journaliste` et `/journaliste/corriger/<id>` s'ouvrent sans aucun contrôle (pas d'identité, pas de message) : le supporter peut enregistrer et corriger un podium. Constat attendu du PRD, noté tel quel. Un podium créé hors des dates des Jeux (25 décembre) est accepté (voir transverse T9).
**Verdict** : 🟡
**Issue** : (non créée) l'entrée « Espace journaliste » est proposée au supporter sur chaque page ; aucune limitation d'accès, conforme au PRD mais à trancher avant la démo publique

## Session imprévisible

Après les scénarios ci-dessus, jouer [`transverse.md`](transverse.md) sur chaque écran livré par la tranche.
