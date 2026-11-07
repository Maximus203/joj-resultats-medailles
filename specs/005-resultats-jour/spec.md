# 005 — Résultats d'une journée

**Statut** : Validée
**PRD** : specs/prd-resultats-medailles.md, TR3

## Contexte

Le supporter veut savoir qui a gagné aujourd'hui, et le journaliste relire ce qu'il a publié. Cette tranche rend les podiums enregistrés (spec 001) consultables, pour un jour ou pour tous les jours. Le PRD est validé ; l'utilisateur a demandé d'aller vite et a donné son feu vert pour cette spec.

## User stories

- En tant que supporter, je veux voir les podiums d'un jour, afin de savoir qui a gagné ce jour-là.
- En tant que journaliste, je veux relire les podiums publiés, les plus récents d'abord, afin de vérifier ma saisie.

## Scénarios d'acceptation

### AS1 — Les podiums d'un jour

- **Étant donné** des podiums enregistrés les 5 et 6 novembre 2026
- **Quand** le supporter demande les résultats du 5 novembre 2026
- **Alors** il ne voit que les podiums de ce jour, avec pour chacun l'épreuve, la discipline et les trois médaillés

### AS2 — Tous les podiums sans choisir de jour

- **Étant donné** des podiums enregistrés sur plusieurs jours
- **Quand** le journaliste demande les résultats sans préciser de jour
- **Alors** il voit tous les podiums

### AS3 — Les plus récents d'abord

- **Étant donné** deux podiums enregistrés l'un après l'autre
- **Quand** on demande les résultats
- **Alors** le podium enregistré en dernier est le premier de la liste

### AS4 — Un jour sans podium

- **Étant donné** qu'aucun podium n'est enregistré le 12 novembre 2026
- **Quand** le supporter demande les résultats de ce jour
- **Alors** la liste est vide, sans erreur

## Hors périmètre

- Le regroupement par discipline à l'écran (le front regroupe la liste reçue).
- Un filtre par discipline ou par pays, la pagination, le résumé par l'IA (TR5).

## Questions ouvertes

- « Plus récent » veut dire enregistré en dernier ; à date d'enregistrement égale, l'ordre alphabétique de l'épreuve départage.
- Un jour mal formé est refusé comme invalide, sans scénario dédié : c'est de la validation d'entrée.
- Un podium corrigé garde sa date d'enregistrement d'origine : la correction ne le fait pas remonter.
