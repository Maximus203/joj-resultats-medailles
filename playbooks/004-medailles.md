# 004 — Tableau des médailles

> Spec : specs/004-medailles · Statut : ✅ · Build : journee @f96f561 (API compilée `dist/` du 17:33, instance isolée port 3100, dossier PGlite neuf par scénario, lancée par le testeur ; l'API de démo :3000 n'a pas été touchée) · Testé : 2026-11-07
> Surfaces : [API] · Profils : supporter, journaliste

## Préconditions

- [API] `GET http://localhost:3000/api/medals` rend `{ "items": [{ rank, country, gold, silver, bronze }] }`. Les podiums se créent par `POST /api/podiums` (spec 001), jamais en base.
- Pour AS1, AS2 et AS4, partir d'une base **sans podium** : lancer l'API sur un dossier PGlite neuf (`PGLITE_DATA_DIR=.data/playbook-004 pnpm --filter @joj/api start`), sans `pnpm db:seed`. `pnpm db:reset` charge 57 podiums du seed et fausserait les comptes.
- Épreuves de référence : « Lutte filles 52 kg », « Lutte filles 57 kg », « Lutte garçons 60 kg » (discipline Lutte, jour `2026-11-05`).

## Scénarios

### 004-AS1.1 — [API] Les médailles sont comptées et triées

**Profil** : supporter
**Priorité** : critique
**Technique** : nominal
**Action** : enregistrer trois podiums (SEN/JPN/FRA, JPN/SEN/USA, SEN/FRA/JPN), puis lire `GET /api/medals`.
**Attendu** : `200`, une ligne par pays triée or, argent, bronze : SEN (2, 1, 0), JPN (1, 1, 1), FRA (0, 1, 1), USA (0, 0, 1), rangs 1, 2, 3, 4.
**Vérif [BE]** : les trois lignes de podium sont en base ; la somme des médailles du tableau vaut 3 × 3.
**Observé** : Base neuve. Trois podiums par `POST` (SEN/JPN/FRA, JPN/SEN/USA, SEN/FRA/JPN) → `201`. `GET /api/medals` `200` : 1:SEN(2,1,0) 2:JPN(1,1,1) 3:FRA(0,1,1) 4:USA(0,0,1), identique à l'Attendu ; somme des médailles = 9. [BE] non lu directement (la base PGlite est verrouillée par le processus) : trois podiums vérifiés par `GET /api/podiums`.
**Verdict** : ✅
**Issue** : —

### 004-AS1.2 — [API] Un pays sans or passe après un pays avec or

**Profil** : supporter
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : sur base neuve, enregistrer un podium (AAA/BBB/CCC) puis un second (DDD/AAA/BBB) ; lire le tableau.
**Attendu** : l'or prime sur le nombre total de médailles : AAA (1, 1, 0) et DDD (1, 0, 0) classés avant BBB (0, 1, 1), même si BBB a plus de médailles que DDD.
**Observé** : Base neuve, AAA/BBB/CCC puis DDD/AAA/BBB : 1:AAA(1,1,0) 2:DDD(1,0,0) 3:BBB(0,1,1) 4:CCC(0,0,1). L'or prime sur le total.
**Verdict** : ✅
**Issue** : —

### 004-AS2.1 — [API] Deux pays à égalité partagent le rang

**Profil** : supporter
**Priorité** : critique
**Technique** : table-décision
**Action** : sur base neuve, enregistrer deux podiums (SEN/FRA/USA et JPN/FRA/USA) ; lire le tableau. Variante : ajouter deux podiums pour obtenir 1, 2, 2, 4.
**Attendu** : SEN et JPN ont le même rang 1 (ordre alphabétique JPN puis SEN), FRA est au rang 3, USA au rang 4 ; jamais de rang 2 dans le premier cas.
**Observé** : Base neuve, SEN/FRA/USA puis JPN/FRA/USA : 1:JPN(1,0,0) 1:SEN(1,0,0) 3:FRA(0,2,0) 4:USA(0,0,2) (ordre alphabétique JPN puis SEN, jamais de rang 2). Variante 1, 2, 2, 4 sur base neuve (AAA×2 or, BBB et CCC 1 or, DDD/EEE médaillés partout) : 1:AAA 2:BBB 2:CCC 4:DDD 5:EEE.
**Verdict** : ✅
**Issue** : —

### 004-AS3.1 — [API] Aucun podium, tableau vide

**Profil** : supporter
**Priorité** : critique
**Technique** : valeurs-limites
**Action** : sur base neuve (aucun podium), lire `GET /api/medals`.
**Attendu** : `200` et `{ "items": [] }`, jamais d'erreur `4xx` ou `5xx`.
**Vérif [BE]** : zéro ligne dans la table des podiums.
**Observé** : Base neuve : `GET /api/medals` → `200` `{"items":[]}`. [BE] vérifié par `GET /api/podiums` vide.
**Verdict** : ✅
**Issue** : —

### 004-AS4.1 — [API] Le tableau suit un nouveau podium sans autre action

**Profil** : journaliste
**Priorité** : critique
**Technique** : transition-état
**Action** : enregistrer un podium où SEN gagne l'or ; lire le tableau (SEN 1 or) ; enregistrer un second podium où SEN gagne l'or ; relire le tableau aussitôt, sans rien d'autre.
**Attendu** : la seconde lecture montre 2 ors pour SEN.
**Observé** : Base neuve : podium « E1 » (SEN or) → tableau SEN (1,0,0) ; second podium « E2 » (SEN or) → relu aussitôt, SEN (2,0,0), sans autre action.
**Verdict** : ✅
**Issue** : —

### 004-AS4.2 — [API] Un podium refusé ne change pas le tableau

**Profil** : journaliste
**Priorité** : normal
**Technique** : erreur
**Action** : relever le tableau ; tenter un podium avec deux fois SEN (refusé `422`), puis un doublon d'épreuve (refusé `409`) ; relire le tableau.
**Attendu** : les deux refus sont `422` et `409` ; le tableau est identique à celui relevé avant.
**Observé** : Sur une base à 3 podiums : SEN/SEN/FRA → `422` `PODIUM_COUNTRIES_NOT_DISTINCT` ; doublon d'épreuve (AAA/BBB/CCC sur « Lutte filles 52 kg ») → `409` `PODIUM_ALREADY_RECORDED` ; tableau identique avant/après (comparaison de chaîne).
**Verdict** : ✅
**Issue** : —

### 004-AS1.3 — [API] Une méthode non prévue ne casse rien

**Profil** : supporter
**Priorité** : secondaire
**Technique** : erreur
**Action** : envoyer `POST /api/medals` et `DELETE /api/medals`, puis `GET /api/medals?day=2026-11-05`.
**Attendu** : `404` pour `POST` et `DELETE` (le tableau n'est pas modifiable) ; `GET` avec un paramètre inconnu répond `200` comme sans ; jamais de `500`.
**Observé** : `POST /api/medals` → `404`, `DELETE /api/medals` → `404` (et `PUT` → `404`) ; `GET /api/medals?day=2026-11-05` → `200`. Aucun `500`.
**Verdict** : ✅
**Issue** : —
