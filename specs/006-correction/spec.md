# 006 — Corriger un podium

**Statut** : Validée
**PRD** : specs/prd-resultats-medailles.md, TR4

## Contexte

Une erreur de podium publiée se corrige mal, et le journaliste saisit à la main : la correction est son filet. Elle remplace les trois médaillés d'un podium publié et garde l'ancienne version consultable, avec la date de correction. Le PRD est validé ; l'utilisateur a demandé d'aller vite et a donné son feu vert pour cette spec.

## User stories

- En tant que journaliste, je veux corriger les médaillés d'un podium publié, afin de rétablir le bon résultat.
- En tant que journaliste, je veux retrouver ce qui a été publié avant chaque correction, afin que la correction laisse une trace.

## Scénarios d'acceptation

### AS1 — Corriger un podium

- **Étant donné** le podium « Lutte filles 52 kg » publié : SEN or, JPN argent, FRA bronze
- **Quand** le journaliste le corrige : JPN or, SEN argent, FRA bronze
- **Alors** le podium montre les nouveaux médaillés et la date de sa correction, et le tableau des médailles en tient compte

### AS2 — Trois pays différents

- **Étant donné** le même podium publié
- **Quand** le journaliste le corrige avec l'or et le bronze pour le même pays (SEN et SEN)
- **Alors** la correction est refusée, avec un message de règle métier non respectée, et le podium reste inchangé

### AS3 — Podium inconnu

- **Étant donné** un identifiant qui ne correspond à aucun podium
- **Quand** le journaliste tente de le corriger, ou de consulter ses versions remplacées
- **Alors** il est refusé, avec un message d'introuvable

### AS4 — L'ancienne version reste consultable

- **Étant donné** un podium corrigé deux fois
- **Quand** le journaliste consulte ses versions remplacées
- **Alors** il voit l'original puis la première correction, chacune avec ses trois pays et la date à laquelle elle a été remplacée, la plus récente d'abord

### AS5 — Une correction identique ne laisse pas de trace

- **Étant donné** un podium publié et jamais corrigé
- **Quand** le journaliste le « corrige » avec exactement les mêmes trois pays
- **Alors** la correction est acceptée, le podium n'est pas marqué comme corrigé et aucune version remplacée n'apparaît

## Hors périmètre

- Corriger l'épreuve, la discipline ou le jour, supprimer un podium, annuler une correction.
- Savoir qui a corrigé (pas de comptes, PRD), l'écran.

## Questions ouvertes

- La date de correction d'une version remplacée est le moment où elle a cessé d'être publiée.
- Un podium jamais corrigé n'a pas de date de correction et aucune version remplacée.
