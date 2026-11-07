# 001 — Enregistrer le podium d'une épreuve

> Spec : specs/001-podium · Statut : ⬜ · Build : — · Testé : —
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
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS1.2 — [WEB] Le journaliste enregistre un podium par l'écran

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : sur l'écran d'enregistrement d'un podium (mobile 375 px), saisir l'épreuve, la discipline, le jour et les trois pays de référence ; valider.
**Attendu** : un message de succès lisible ; le podium enregistré est montré avec ses trois médaillés (SEN or, JPN argent, FRA bronze).
**Vérif [BE]** : même ligne en base qu'en 001-AS1.1.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS2.1 — [API] Un second podium pour la même épreuve est refusé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : après 001-AS1.1, renvoyer un podium pour « Lutte filles 52 kg » avec d'autres pays (JPN / SEN / GER).
**Attendu** : réponse `409`, code `PODIUM_ALREADY_RECORDED` ; le premier podium est inchangé.
**Vérif [BE]** : toujours une seule ligne ; pays d'origine SEN / JPN / FRA.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS2.2 — [API] La même épreuve écrite autrement est reconnue

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : renvoyer un podium dont `eventName` vaut `  lutte FILLES 52 kg  ` (casse et espaces différents).
**Attendu** : réponse `409`, code `PODIUM_ALREADY_RECORDED` (l'épreuve est identifiée sans tenir compte de la casse ni des espaces en trop).
**Vérif [BE]** : toujours une seule ligne.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS2.3 — [WEB] Le refus d'un doublon est clair à l'écran

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur l'écran, enregistrer deux fois « Lutte filles 52 kg ».
**Attendu** : le second enregistrement est refusé avec un message de conflit en français qui dit que l'épreuve a déjà un podium ; la saisie du journaliste n'est pas effacée ; le premier podium n'a pas changé.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS3.1 — [API] Deux fois le même pays est refusé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur une épreuve sans podium (« Judo mixte 63 kg »), envoyer or SEN et argent SEN, bronze FRA.
**Attendu** : réponse `422`, code `PODIUM_COUNTRIES_NOT_DISTINCT` ; aucun podium enregistré pour cette épreuve.
**Vérif [BE]** : aucune ligne pour « Judo mixte 63 kg ».
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS3.2 — [API] Toutes les paires identiques sont refusées

**Profil** : journaliste
**Priorité** : normal
**Technique** : table-décision
**Action** : tenter or = bronze (SEN / JPN / SEN), argent = bronze (SEN / JPN / JPN) et les trois identiques (SEN / SEN / SEN), chacun sur une épreuve neuve.
**Attendu** : `422` `PODIUM_COUNTRIES_NOT_DISTINCT` à chaque fois ; rien en base.
**Vérif [BE]** : aucune ligne pour ces trois épreuves.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS3.3 — [WEB] Le refus d'un pays répété est clair à l'écran

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur l'écran, saisir SEN en or et en argent.
**Attendu** : refus avec un message de règle métier en français qui dit que les trois pays doivent être différents ; la saisie est conservée ; aucun podium créé pour l'épreuve.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS3.4 — [API] Une entrée mal formée est refusée comme invalide

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : envoyer successivement : nom vide, nom de 101 caractères, pays `se` (2 lettres), pays `sen` (minuscules), jour `2026-02-31`, champ manquant.
**Attendu** : `400` à chaque fois (validation d'entrée, pas une règle métier) ; rien en base ; jamais de `500`.
**Vérif [BE]** : aucune ligne créée par ces requêtes.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 001-AS1.3 — [WEB] Le supporter n'a rien à saisir

**Profil** : supporter
**Priorité** : secondaire
**Technique** : transition-état
**Action** : en profil supporter, parcourir l'application depuis l'accueil, puis tenter d'ouvrir l'écran d'enregistrement par son URL.
**Attendu** : constat seulement (le PRD accepte que rien ne limite la saisie pour la démo) : décrire ce que voit le supporter ; un 🟡 si l'écran de saisie est proposé dans sa navigation.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

## Session imprévisible

Après les scénarios ci-dessus, jouer [`transverse.md`](transverse.md) sur chaque écran livré par la tranche.
