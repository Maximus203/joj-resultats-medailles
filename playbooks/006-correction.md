# 006 — Corriger un podium

> Spec : specs/006-correction · Statut : ⬜ · Build : — · Testé : —
> Surfaces : [API] · Profils : journaliste, supporter

## Préconditions

- [API] `PUT http://localhost:3000/api/podiums/:id` avec le corps `{ "gold", "silver", "bronze" }` rend le podium publié (avec `correctedAt`) ; `GET /api/podiums/:id/revisions` rend `{ "items": [{ gold, silver, bronze, correctedAt }] }`, la plus récente d'abord. L'`id` vient de la réponse du `POST /api/podiums` (spec 001) ; les podiums se créent par l'API, jamais en base.
- Base **sans podium** conseillée (`PGLITE_DATA_DIR=.data/playbook-006 pnpm --filter @joj/api start`, sans seed), pour lire le tableau des médailles sans le bruit des 57 podiums du seed.
- Podium de référence : « Lutte filles 52 kg », Lutte, `2026-11-05`, or SEN, argent JPN, bronze FRA. Identifiant inconnu de référence : `99999999-9999-4999-8999-999999999999`.

## Scénarios

### 006-AS1.1 — [API] Le journaliste corrige un podium

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : enregistrer le podium de référence, puis `PUT /api/podiums/:id` avec JPN or, SEN argent, FRA bronze.
**Attendu** : `200` ; le corps porte les nouveaux médaillés, l'épreuve, le jour et la date de correction `correctedAt` (non nulle) ; une relecture de `GET /api/podiums` montre la même chose.
**Vérif [BE]** : une ligne de podium avec JPN / SEN / FRA et `corrected_at` renseigné ; une ligne de révision SEN / JPN / FRA.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS1.2 — [API] Le tableau des médailles tient compte de la correction

**Profil** : supporter
**Priorité** : critique
**Technique** : transition-état
**Action** : sur base neuve, enregistrer le podium de référence, relever `GET /api/medals` (SEN en tête), corriger le podium (JPN or, SEN argent, FRA bronze), relire le tableau.
**Attendu** : JPN prend la tête avec 1 or, SEN passe à 1 argent et 0 or, FRA garde son bronze ; le total des médailles reste 3.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS1.3 — [API] Une entrée mal formée est refusée comme invalide

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : corriger avec un pays en minuscules (`sen`), un pays à deux lettres, un pays manquant, un corps vide, un pays numérique.
**Attendu** : `400` `VALIDATION_FAILED` à chaque fois, jamais de `500` ; le podium reste inchangé et sans date de correction.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS2.1 — [API] Un pays répété est refusé, le podium reste inchangé

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : sur le podium de référence, `PUT` avec SEN or, JPN argent, SEN bronze.
**Attendu** : `422`, code `PODIUM_COUNTRIES_NOT_DISTINCT` ; le podium garde SEN / JPN / FRA et `correctedAt` à `null`.
**Vérif [BE]** : aucune ligne de révision ; `corrected_at` nul.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS2.2 — [API] Toutes les paires identiques sont refusées

**Profil** : journaliste
**Priorité** : normal
**Technique** : table-décision
**Action** : `PUT` avec or = argent (SEN/SEN/FRA), argent = bronze (SEN/JPN/JPN) et les trois identiques (SEN/SEN/SEN).
**Attendu** : `422` `PODIUM_COUNTRIES_NOT_DISTINCT` à chaque fois ; le podium et ses révisions sont inchangés.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS3.1 — [API] Corriger un podium inconnu

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : `PUT /api/podiums/99999999-9999-4999-8999-999999999999` avec un corps valide.
**Attendu** : `404`, code `PODIUM_NOT_FOUND` ; aucun podium créé ni modifié.
**Vérif [BE]** : le nombre de podiums en base n'a pas changé.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS3.2 — [API] Consulter les versions d'un podium inconnu

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : `GET /api/podiums/99999999-9999-4999-8999-999999999999/revisions`.
**Attendu** : `404`, code `PODIUM_NOT_FOUND`.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS3.3 — [API] Un identifiant qui n'est pas un UUID

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : `PUT /api/podiums/abc` et `GET /api/podiums/abc/revisions`, puis avec `0`, un identifiant de 200 caractères, et `%00`.
**Attendu** : `404` `PODIUM_NOT_FOUND` à chaque fois, jamais de `500`.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS4.1 — [API] Deux corrections, deux versions remplacées

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : sur le podium de référence, corriger une première fois (JPN/SEN/FRA), puis une seconde fois (JPN/FRA/SEN), à quelques secondes d'intervalle ; lire `GET /api/podiums/:id/revisions`.
**Attendu** : `200`, deux versions : d'abord JPN/SEN/FRA (remplacée par la seconde correction), puis l'original SEN/JPN/FRA (remplacé par la première), chacune avec sa date, la plus récente d'abord.
**Vérif [BE]** : deux lignes de révision pour ce podium ; le podium porte la version JPN/FRA/SEN.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS4.2 — [API] Un podium jamais corrigé n'a pas de versions

**Profil** : supporter
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lire `GET /api/podiums/:id/revisions` d'un podium enregistré mais jamais corrigé.
**Attendu** : `200` et `{ "items": [] }`, pas de `404`.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS5.1 — [API] Une correction identique ne laisse pas de trace

**Profil** : journaliste
**Priorité** : critique
**Technique** : valeurs-limites
**Action** : sur le podium de référence jamais corrigé, `PUT` avec exactement SEN / JPN / FRA ; lire le podium puis ses versions.
**Attendu** : `200` ; `correctedAt` reste `null` ; `GET .../revisions` rend `{ "items": [] }`.
**Vérif [BE]** : zéro ligne de révision ; `corrected_at` nul.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 006-AS5.2 — [API] Corriger vers l'état déjà corrigé

**Profil** : journaliste
**Priorité** : normal
**Technique** : transition-état
**Action** : corriger (JPN/SEN/FRA), puis envoyer la même correction une seconde fois ; lire les versions.
**Attendu** : les deux `PUT` répondent `200` ; une seule version remplacée (l'original) ; `correctedAt` garde la date de la première correction.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
