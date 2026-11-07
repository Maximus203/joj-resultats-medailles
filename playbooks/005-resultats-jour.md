# 005 — Résultats d'une journée

> Spec : specs/005-resultats-jour · Statut : ⬜ · Build : — · Testé : —
> Surfaces : [API] · Profils : supporter, journaliste

## Préconditions

- [API] `GET http://localhost:3000/api/podiums?day=AAAA-MM-JJ` rend `{ "items": [podium publié] }` ; un podium publié porte `id, eventName, discipline, day, gold, silver, bronze, createdAt, correctedAt`. Les podiums se créent par `POST /api/podiums` (spec 001), jamais en base.
- Partir d'une base **sans podium** (`PGLITE_DATA_DIR=.data/playbook-005 pnpm --filter @joj/api start`, sans seed) : le seed charge 57 podiums qui fausseraient les comptes.
- Jeu d'essai, enregistré dans cet ordre, à une seconde d'intervalle au moins : « Lutte filles 52 kg » (5 novembre), « Judo filles 48 kg » (6 novembre), « Lutte garçons 60 kg » (5 novembre) ; discipline Lutte ou Judo, SEN/JPN/FRA.

## Scénarios

### 005-AS1.1 — [API] Les podiums d'un jour, et seulement ceux-là

**Profil** : supporter
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : enregistrer le jeu d'essai, puis lire `GET /api/podiums?day=2026-11-05`.
**Attendu** : `200`, deux podiums (« Lutte garçons 60 kg », « Lutte filles 52 kg »), chacun avec épreuve, discipline, jour `2026-11-05` et trois médaillés ; aucun podium du 6 novembre.
**Vérif [BE]** : la base contient trois podiums, dont deux au 5 novembre.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 005-AS1.2 — [API] Un jour mal formé est refusé comme invalide

**Profil** : supporter
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : lire `?day=05-11-2026`, `?day=2026-02-31`, `?day=2026-13-01`, `?day=` (vide) et `?day=abc`.
**Attendu** : `400` avec le code `VALIDATION_FAILED` à chaque fois ; jamais de `500` ni de liste.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 005-AS2.1 — [API] Tous les podiums sans choisir de jour

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : après le jeu d'essai, lire `GET /api/podiums` sans paramètre.
**Attendu** : `200`, les trois podiums, tous jours confondus.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 005-AS3.1 — [API] Les plus récents d'abord

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : après le jeu d'essai (enregistré dans l'ordre Lutte filles, Judo filles, Lutte garçons), lire `GET /api/podiums`.
**Attendu** : ordre « Lutte garçons 60 kg », « Judo filles 48 kg », « Lutte filles 52 kg » (dernier enregistré en premier), même si le jour du dernier est antérieur à celui d'un autre.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 005-AS3.2 — [API] Un nouveau podium passe en tête de liste

**Profil** : journaliste
**Priorité** : normal
**Technique** : transition-état
**Action** : enregistrer « Natation 100 m dos » au 4 novembre (jour plus ancien), puis relire la liste.
**Attendu** : il est en première position, devant les trois autres, car l'ordre suit la date d'enregistrement et non le jour de l'épreuve.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 005-AS4.1 — [API] Un jour sans podium donne une liste vide

**Profil** : supporter
**Priorité** : critique
**Technique** : erreur
**Action** : lire `GET /api/podiums?day=2026-11-12` (aucun podium ce jour-là).
**Attendu** : `200` et `{ "items": [] }`, pas de `404`.
**Vérif [BE]** : aucune ligne de podium au 12 novembre.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 005-AS4.2 — [API] Base sans aucun podium

**Profil** : supporter
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : sur une base neuve, lire `GET /api/podiums` puis `GET /api/podiums?day=2026-11-05`.
**Attendu** : `200` et `{ "items": [] }` dans les deux cas.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
