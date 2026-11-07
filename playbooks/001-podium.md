# 001 — Enregistrer le podium d'une épreuve

> Spec : specs/001-podium · Statut : ✅ (6 ✅ [API], 4 ⏭️ [WEB] écran non livré) · Build : journee @60a713d (API démarrée à 17:05 sur 363e428 ; le commit 60a713d, arrivé pendant la campagne, ne touche que deploy/) ; arbre non commité : seul `specs/design/` (non suivi), aucun fichier de apps/ ni packages/ modifié · Testé : 2026-11-07
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
**Observé** : Écran non livré : l'accueil `/` n'est qu'un gabarit (titre « Jeux Olympiques de la Jeunesse, Dakar 2026 » et « Ton application commence ici. », aucun lien, aucun formulaire) ; `/podiums`, `/podiums/new`, `/podium`, `/enregistrer`, `/saisie`, `/admin` répondent « Page introuvable » (0 champ de saisie). `apps/web/src/features/` n'existe pas. Jumeau [API] : 001-AS1.1 ✅. Vu à 375 px, console sans erreur. Capture : `.test-shots/001-podium-001-AS1.3-375-url-directe-after.jpg`.
**Verdict** : ⏭️
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
**Observé** : Écran non livré (voir 001-AS1.2). Jumeau [API] : 001-AS2.1 ✅.
**Verdict** : ⏭️
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
**Observé** : Écran non livré (voir 001-AS1.2). Jumeaux [API] : 001-AS3.1 et 001-AS3.2 ✅.
**Verdict** : ⏭️
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
**Observé** : Écran non livré : constat du supporter à 375 px depuis l'accueil : un titre et une phrase, aucune navigation ni lien, donc aucun écran de saisie proposé (pas de 🟡). Par URL directe, `/podiums/new` et les autres routes plausibles affichent « Page introuvable » avec un bouton « Retour à l'accueil » (message clair, en français). Le risque du PRD (rien ne limite la saisie) ne peut pas être constaté tant que l'écran n'existe pas. Côté API, `POST /api/podiums` ne demande aucune identité (jamais de 401 observé) : conforme à ce que le PRD accepte pour la démo. Captures : `.test-shots/001-podium-001-AS1.3-375-accueil-after.jpg`, `.test-shots/001-podium-001-AS1.3-375-url-directe-after.jpg`.
**Verdict** : ⏭️
**Issue** : —

## Session imprévisible

Après les scénarios ci-dessus, jouer [`transverse.md`](transverse.md) sur chaque écran livré par la tranche.
