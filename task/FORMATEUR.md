# Notes du formateur

Ce qui se passe pendant la journée sans être du travail de l'apprenant. Les énoncés (`EXERCICES.md`, `ATELIER-*.md`) ne gardent que ce que l'apprenant fait, avec son créneau et son critère de réussite.

## Avant la journée

À la Mission 0, l'apprenant crée son fork, puis lit [README.md](README.md) et le [glossaire](GLOSSAIRE.md) (environ 15 minutes). Sans cette lecture, un débutant passe une dizaine de minutes sur la manipulation 1 au lieu de 3, et la prise en main déborde.

## Prise en main (09:30–10:15)

| Horaire     | Quoi                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- |
| 09:30–09:40 | présentation de Claude Code : sa boucle lire, agir, vérifier, et ses modes de permission |
| 09:40–10:10 | les apprenants font les neuf manipulations                                               |
| 10:10–10:15 | quiz de 2 minutes, puis remise de la fiche à emporter (commandes, réflexes, définitions) |

## Atelier A (10:15–11:15)

- **10:35–10:45** : présenter la section « Pourquoi un CLAUDE.md » de l'énoncé, puis le modèle [CLAUDE.modele.md](CLAUDE.modele.md) et ses cinq rubriques.
- **En cas de retard** : donner un `CLAUDE.md` déjà rempli, avec des erreurs à corriger. L'apprenant le relit rubrique par rubrique au lieu de l'écrire.

## Atelier B (11:15–12:15)

- **Pendant tout l'atelier** : construire Bénévoles avec les apprenants, à l'écran et étape par étape (`/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge`). S'arrêter à chaque « je valide » pour relire avec eux, avant qu'ils valident.

## Atelier C (13:15–16:30)

L'énoncé ne donne que l'objectif, les thèmes et les outils. Le déroulé se donne à l'oral :

| Horaire     | Quoi                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| 13:15–13:25 | consignes : le coach présente le problème de la table                                                                      |
| 13:25–13:50 | `/prd` : la vision de l'apprenant, challengée par Claude                                                                   |
| 13:50–14:05 | **challenge** : un voisin relit le PRD avec la grille, puis le coach valide la tranche 1 ; l'apprenant valide après lui    |
| 14:05–14:40 | `/spec TR1`, relue vite par le coach, puis `/spec-plan` et `/tdd-task T01`                                                 |
| 14:40       | **point coach** : si la première tâche n'est pas au vert, réduire la tranche avec l'apprenant (`/prd` pour amender le PRD) |
| 14:40–16:15 | `/tdd-task` pour les tâches suivantes, `/converge`, puis la tranche suivante                                               |
| 16:15–16:30 | **gel** : dernier commit et trois lignes en tête de `README.md`                                                            |

- **Bloqué plus de 10 minutes** : l'apprenant appelle son coach. Un problème technique (licence, crédits API, réseau, installation) part chez le référent technique.
- **Une nouvelle dépendance** autre que le SDK Claude demande l'accord du coach.
- **Choix des projets** : au gel, les coachs choisissent trois projets, un par thème, présentés devant l'auditoire de 16:30 à 17:00 (5 minutes de démo, 2 minutes de questions). Quatre critères : la vision produit (le problème est précis, la solution y répond, la démo commence par lui) ; le respect du PRD et de la spec ; les tests (`pnpm spec:check --trace`, `pnpm check` vert) ; une démo qui démarre avec `pnpm dev` et se montre en moins de 5 minutes.
