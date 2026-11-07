# 004 — Tableau des médailles

**Statut** : Validée
**PRD** : specs/prd-resultats-medailles.md, TR2

## Contexte

Le public veut savoir où en est son pays, et les journalistes ne veulent plus compter à la main. Le tableau est calculé à partir des podiums enregistrés (spec 001) : il n'a pas de saisie propre et se met à jour tout seul. Le PRD est validé ; l'utilisateur a demandé d'aller vite et a donné son feu vert pour cette spec.

## User stories

- En tant que supporter, je veux voir le nombre de médailles d'or, d'argent et de bronze de chaque pays, afin de savoir où en est le mien.
- En tant que journaliste, je veux que le tableau se mette à jour dès qu'un podium est enregistré, afin de ne rien compter à la main.

## Scénarios d'acceptation

### AS1 — Médailles comptées et triées

- **Étant donné** trois podiums enregistrés : SEN or, JPN argent, FRA bronze ; JPN or, SEN argent, USA bronze ; SEN or, FRA argent, JPN bronze
- **Quand** le supporter consulte le tableau des médailles
- **Alors** il voit une ligne par pays avec ses médailles d'or, d'argent et de bronze, triées par or, puis argent, puis bronze : SEN (2, 1, 0), JPN (1, 1, 1), FRA (0, 1, 1), USA (0, 0, 1)

### AS2 — Deux pays à égalité au même rang

- **Étant donné** des podiums où SEN et JPN ont chacun 1 or, 0 argent et 0 bronze, FRA ayant 1 argent
- **Quand** le supporter consulte le tableau des médailles
- **Alors** SEN et JPN ont le même rang, et le pays suivant prend le rang qui suit le nombre de pays classés avant lui (rangs 1, 1, 3)

### AS3 — Aucun podium, tableau vide

- **Étant donné** qu'aucun podium n'est enregistré
- **Quand** le supporter consulte le tableau des médailles
- **Alors** le tableau est vide, sans erreur

### AS4 — Le tableau suit les podiums enregistrés

- **Étant donné** un tableau où SEN a 1 or
- **Quand** le journaliste enregistre un nouveau podium dont SEN gagne l'or
- **Alors** le tableau montre aussitôt 2 ors pour SEN, sans autre action

## Hors périmètre

- La correction d'un podium et son effet sur le tableau (spec 006, qui hérite du calcul).
- Un classement officiel (il n'y en a pas aux JOJ), un filtre par jour ou par discipline, l'écran.

## Questions ouvertes

- Le rang est « à la compétition » : deux pays à égalité parfaite partagent le rang, le suivant saute (1, 2, 2, 4).
- Deux pays à égalité parfaite sont listés par ordre alphabétique de leur code, pour que la réponse soit stable.
- Les équipes mixtes de plusieurs pays, non classées aux JOJ, ne sont pas comptées (risque déjà noté au PRD).
