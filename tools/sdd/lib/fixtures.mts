/** Une spec et un plan conformes, pour les tests. */
export const SPEC = `# 001 — Bénévoles

**Statut** : Brouillon

## Contexte

Les disciplines ont besoin de bénévoles.

## User stories

- En tant que responsable, je veux inscrire un bénévole, afin de remplir un créneau.

## Scénarios d'acceptation

### AS1 — Inscrire un bénévole

- **Étant donné** un créneau qui a de la place
- **Quand** j'inscris un bénévole
- **Alors** il apparaît dans la liste du créneau

### AS2 — Créneau complet

- **Étant donné** un créneau complet
- **Quand** j'inscris un bénévole
- **Alors** l'inscription est refusée

## Hors périmètre

- La désinscription.

## Questions ouvertes

- Aucune.
`;

export const PLAN = `# 001 — Bénévoles : plan

**Statut** : Brouillon

## 1. Résumé

On permet d'inscrire des bénévoles sur les créneaux d'une discipline.

## 2. Fichiers par couche

- shared : packages/shared/src/benevoles.ts

## 3. Données

Table inscriptions.

## 4. Erreurs

| Code | Catégorie | HTTP |
| --- | --- | --- |
| CRENEAU_COMPLET | CONFLICT | 409 |

## 5. Tests par scénario

| Scénario | Test | Niveau |
| --- | --- | --- |
| AS1 | domain/inscription.spec.ts | unitaire |
| AS2 | test/benevoles.e2e.spec.ts | e2e |

## 6. Tâches

- [x] T01 [001-AS1] Écrire d'abord domain/inscription.spec.ts, puis l'entité
- [ ] T02 [001-AS2] Écrire d'abord test/benevoles.e2e.spec.ts, puis la route
`;

/** Un PRD conforme, pour les tests. */
export const PRD = `# PRD — Bénévoles

**Statut** : Brouillon

## Problème

Les responsables gèrent les bénévoles sur papier, et des créneaux débordent.

## Utilisateurs

- Responsable de discipline : ouvrir des créneaux et savoir qui vient.

## Proposition

Les responsables ouvrent des créneaux, les bénévoles s'y inscrivent, jamais au-delà de la capacité.

## Mesure du succès

Aucun créneau n'a plus d'inscrits que sa capacité.

## Tranches

### TR1 — Inscrire sur un créneau

Ouvrir un créneau et y inscrire un bénévole ; un créneau complet refuse.

### TR2 — Consulter un créneau

Voir les inscrits et les places restantes.

## Hors périmètre

- Les comptes des bénévoles.

## Hypothèses et risques

- Un email suffit à identifier un bénévole.
`;
