# 001 — Enregistrer le podium d'une épreuve

**Statut** : Implémentée
**PRD** : specs/prd-resultats-medailles.md, TR1

## Contexte

Les podiums tombent épreuve par épreuve, sur plusieurs sites. Le journaliste doit enregistrer le sien sans se tromper, car une erreur publiée se corrige mal. Cette tranche pose la base : sans podium enregistré, ni tableau des médailles ni résultats du jour.

## User stories

- En tant que journaliste, je veux enregistrer l'or, l'argent et le bronze d'une épreuve, afin de publier un résultat fiable.
- En tant que journaliste, je veux que l'application refuse un podium incohérent, afin de ne pas publier une erreur.

## Scénarios d'acceptation

### AS1 — Enregistrer un podium

- **Étant donné** que l'épreuve « Lutte filles 52 kg » (discipline Lutte, jour 5 novembre 2026) n'a pas encore de podium
- **Quand** le journaliste enregistre l'or pour SEN, l'argent pour JPN et le bronze pour FRA
- **Alors** le podium est enregistré et relisible : l'épreuve, sa discipline, son jour, et trois médaillés avec leur médaille et leur pays

### AS2 — Un seul podium par épreuve

- **Étant donné** que l'épreuve « Lutte filles 52 kg » a déjà un podium
- **Quand** le journaliste enregistre un second podium pour cette épreuve
- **Alors** il est refusé, avec un message de conflit, et le premier podium reste inchangé

### AS3 — Trois pays différents

- **Étant donné** une épreuve sans podium
- **Quand** le journaliste enregistre un podium où l'or et l'argent sont le même pays (SEN et SEN)
- **Alors** il est refusé, avec un message de règle métier non respectée, et aucun podium n'est enregistré pour cette épreuve

## Hors périmètre

- La consultation d'une liste de podiums, le tableau des médailles et les résultats d'une journée (TR2, TR3).
- La correction d'un podium déjà enregistré (TR4) et le résumé par l'IA (TR5).
- Une liste officielle des pays, la vérification que le jour est dans les dates des Jeux, l'écran.

## Questions ouvertes

- L'épreuve est identifiée par son nom, comparé sans tenir compte des majuscules ni des espaces en trop : « Lutte filles 52 kg » est une seule épreuve des Jeux. Si un même nom existait deux jours, il faudrait ajouter le jour à l'identité.
- Un pays se désigne par son code de trois lettres majuscules (SEN, JPN, FRA). Tout code de cette forme est accepté ; aucune liste n'est vérifiée.
- Une donnée absente ou mal formée (nom vide, pays à deux lettres) est refusée comme invalide, sans scénario dédié : c'est de la validation d'entrée, pas une règle métier.
