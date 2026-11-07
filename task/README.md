# La formation : le projet et les énoncés

Ce dossier contient les énoncés de la journée. Ce fichier décrit le projet sur lequel tu vas travailler : ce que fait l'application, comment elle est construite, et ce qui a été mis en place pour développer avec Claude Code.

| Fichier                                            | Quand           | Contenu                                                                           |
| -------------------------------------------------- | --------------- | --------------------------------------------------------------------------------- |
| [GLOSSAIRE.md](GLOSSAIRE.md)                       | avant           | les mots du projet et de la méthode, avec un exemple pris dans le dépôt           |
| [EXERCICES.md](EXERCICES.md)                       | étape 1, 45 min | prise en main : neuf manipulations pour comprendre et utiliser Claude Code        |
| [ATELIER-A.md](ATELIER-A.md)                       | étape 2, 1 h    | écrire le `CLAUDE.md` du projet, à partir de [CLAUDE.modele.md](CLAUDE.modele.md) |
| [ATELIER-B.md](ATELIER-B.md)                       | étape 3, 1 h    | une petite fonctionnalité imposée (Bénévoles) avec la méthode spec → plan → TDD   |
| [ATELIER-C.md](ATELIER-C.md)                       | étape 4, 3 h 15 | ta solution au problème de ta table : ton PRD challengé, puis ton application     |
| [PISTES-ATELIER-C.md](PISTES-ATELIER-C.md)         | atelier C       | des pistes, seulement si tu sèches après 10 minutes                               |
| [GRILLE-RELECTURE.md](GRILLE-RELECTURE.md)         | ateliers B et C | relire un PRD, une spec et un plan avant chaque « je valide »                     |
| [POUR-ALLER-PLUS-LOIN.md](POUR-ALLER-PLUS-LOIN.md) | après           | une fonctionnalité de plus pour s'entraîner : le programme des épreuves           |

## 1. L'application

L'application sert à organiser les Jeux Olympiques de la Jeunesse **Dakar 2026** (du 31 octobre au 13 novembre 2026). Pour l'instant, elle ne gère qu'une chose : les **disciplines** sportives des Jeux.

Une discipline a un nom (par exemple « Lutte » ou « Basketball 3x3 ») et une catégorie, choisie dans une liste fermée de cinq : athlétisme, sports collectifs, sports de combat, sports nautiques, sports de précision. On peut :

- voir la liste des disciplines, et le détail d'une discipline, dans le navigateur (http://localhost:5173/disciplines) ;
- créer, renommer, changer de catégorie et supprimer une discipline, à l'écran ou par l'API (`GET`, `POST`, `PATCH`, `DELETE` sur `/api/disciplines`) ;
- essayer chaque route de l'API dans Swagger (http://localhost:3000/api/docs).

Deux disciplines ne peuvent pas porter le même nom : l'API refuse avec `409`. Cette fonctionnalité est volontairement complète, du schéma partagé à l'écran : elle sert de **modèle**. Quand Claude ajoute une fonctionnalité, il copie sa structure.

## 2. Comment c'est construit

Un seul dépôt (un « monorepo » pnpm) contient trois parties :

| Partie            | Rôle                                                                                          | Technologies                         |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `apps/api`        | l'API : reçoit les requêtes HTTP, applique les règles métier, lit et écrit la base de données | NestJS, Drizzle, PostgreSQL (PGlite) |
| `apps/web`        | le front : les écrans, qui appellent l'API                                                    | React, Vite, TanStack, shadcn        |
| `packages/shared` | les schémas des données échangées entre l'API et le front, écrits une seule fois              | Zod                                  |

Dans l'API, chaque fonctionnalité est un **module** découpé en quatre couches. Une requête les traverse de l'extérieur vers l'intérieur :

```
requête HTTP → http/ (controller) → application/ (cas d'usage) → domain/ (règles métier)
                                          ↓
                                    infra/ (base de données)
```

- **`domain/`** contient les règles métier, en TypeScript pur, sans dépendance à NestJS ni à la base. C'est là qu'on écrit « deux disciplines ne peuvent pas avoir le même nom ».
- **`application/`** contient un cas d'usage par action (créer, lister…). Il relit les données, appelle le domaine, enregistre le résultat.
- **`infra/`** contient la table de la base et le code qui la lit et l'écrit.
- **`http/`** contient le controller. Il valide la requête, appelle un cas d'usage et renvoie la réponse, sans aucune règle métier.

Quand une règle est violée, le domaine lève une **`AppError`** avec un code stable (par exemple `DISCIPLINE_NAME_TAKEN`) et une catégorie. Un seul fichier, le `ProblemDetailsFilter`, transforme cette erreur en réponse HTTP : `400` pour une donnée invalide, `404` pour une ressource introuvable, `409` pour un conflit, `422` pour une règle métier.

Tout est testé avec Vitest : le domaine par des tests unitaires, l'API complète par des tests « e2e » qui envoient de vraies requêtes HTTP à une base en mémoire. `pnpm test` lance tout, sans Docker ni réseau.

Le détail (commandes, arborescence, base de données, ordre pour ajouter une fonctionnalité) est dans le [README du dépôt](../README.md).

## 3. Ce qui a été mis en place pour Claude Code

Le dossier `.claude/` configure Claude Code pour ce dépôt. Tu n'as rien à installer : Claude le lit au démarrage.

**Des garde-fous automatiques (hooks).** Ils s'exécutent sans que tu le demandes :

| Moment                          | Ce qui est vérifié                                                                                                  | Si ça échoue                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Claude veut écrire un fichier   | le fichier ne contient pas de secret (clé d'API, mot de passe, clé privée)                                          | l'écriture est refusée                   |
| Claude veut lancer `git commit` | le message suit Conventional Commits (`feat(api): …`) et la commande ne saute pas les vérifications (`--no-verify`) | le commit est refusé, avec l'explication |
| Un commit part (lefthook)       | format, lint, types et tests liés aux fichiers commités (`pnpm verify --staged`)                                    | le commit n'est pas créé                 |
| Claude finit de répondre        | format, lint et types des fichiers modifiés                                                                         | Claude reprend la main pour corriger     |

**Des permissions.** Claude lance sans te demander les commandes de vérification (`pnpm test`, `pnpm verify`, `pnpm check`, `pnpm spec:*`, `pnpm tdd:*`). Pour tout le reste, et en particulier supprimer des fichiers ou installer des dépendances, il te demande la permission. La liste est dans `.claude/settings.json`.

**Une méthode en cinq commandes (skills).** C'est le cœur des ateliers B et C :

| Commande      | Ce qu'elle produit                                                                                                                                                                       | Qui valide              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `/prd <idée>` | `specs/prd-nom.md` : ta **vision** sur une page (pour qui, quel problème, ta solution, la mesure du succès), découpée en tranches `TR1`, `TR2`… Claude la challenge, il ne l'invente pas | toi, après un challenge |
| `/spec TRn`   | `specs/NNN-nom/spec.md` : le **quoi** d'une tranche, sans technique, avec des scénarios `AS1`, `AS2`…                                                                                    | toi                     |
| `/spec-plan`  | `specs/NNN-nom/plan.md` : le **comment** (fichiers, tables, erreurs, tests) et six tâches au plus                                                                                        | toi                     |
| `/tdd-task`   | le code, tâche par tâche : test écrit d'abord et vu en échec, code, vérification, un commit par tâche                                                                                    | les tests               |
| `/converge`   | le verdict final : chaque scénario a son test, tout le dépôt est vert, et un relecteur indépendant est d'accord                                                                          | le relecteur            |

**Un relecteur.** Le sous-agent `relecteur` relit le travail dans un contexte vierge : il ne voit ni la conversation ni l'avis de Claude, seulement le code, la spec et le plan. Il répond « Converged » ou liste les écarts, avec le fichier et la ligne.

**Des règles communes.** `specs/constitution.md` contient six principes que les cinq commandes appliquent : le PRD porte la vision de l'humain et la spec en réalise une tranche, sans technique ; aucun code sans test vu en échec, chaque scénario a un test titré par son identifiant (`001-AS2: …`), le domaine reste pur, une tâche fait un commit, celui qui produit ne valide pas.

**Des scripts d'outillage** (`tools/sdd/`), lancés par les commandes ci-dessus. Tu n'as pas à les lancer toi-même, mais tu les verras passer :

- `pnpm spec:check` vérifie la forme de la spec et du plan ; avec `--trace`, il affiche quel test prouve quel scénario ;
- `pnpm tdd:red <fichier>` vérifie qu'un nouveau test échoue pour la bonne raison (et pas parce qu'un import manque) ;
- `pnpm verify` vérifie les seuls fichiers modifiés.

La seule commande à retenir pour toi : **`pnpm check`**, qui vérifie tout le dépôt.

## 4. Le déroulé de la journée

0. **Avant la journée** : lire ce fichier et le [glossaire](GLOSSAIRE.md).
1. **[La prise en main](EXERCICES.md), 45 min** : chaque fonctionnalité de Claude Code par le problème qu'elle résout (@fichier, plan mode, confier et relire, Échap et `/rewind`, contexte, permissions, skills, hooks, sous-agent), avec un premier commit fait par Claude et relu.
2. **[L'atelier A](ATELIER-A.md), 1 h** : explorer le code avec Claude, puis écrire le `CLAUDE.md` du projet (méthodologie, architecture, concepts, bonnes pratiques, nommage) et vérifier que Claude l'applique.
3. **[L'atelier B](ATELIER-B.md), 1 h** : appliquer une fois le cycle complet, `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge`, sur une petite fonctionnalité imposée : les bénévoles.
4. **[L'atelier C](ATELIER-C.md), 3 h 15** : imaginer ta solution au problème de ta table (résultats et médailles, guide touristique de Dakar, ou mobilité et covoiturage), la défendre dans un PRD challengé par un voisin et ton coach, puis la construire avec le même cycle.

Tout se fait dans ton propre dépôt GitHub (le fork créé à la Mission 0), sur une seule branche créée au début de la prise en main : ton `CLAUDE.md` de l'atelier A sert donc aussi aux ateliers B et C, et tu repars avec l'ensemble.
