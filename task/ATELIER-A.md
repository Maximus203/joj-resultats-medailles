# Atelier A : le code et son CLAUDE.md

**Durée** : 1 h. **Objectif** : comprendre la structure du dépôt et les bonnes pratiques qui y sont appliquées, les écrire noir sur blanc dans `CLAUDE.md`, puis constater que Claude les applique sans qu'on les lui répète.

## Avant de commencer

- **Pas de nouvelle branche.** Tu restes sur `journee`, la branche de la journée créée au début de la [prise en main](EXERCICES.md) : `git branch --show-current` doit afficher `journee`.
- **Garde ce qu'elle contient.** Le commit de la tâche B y reste : ne supprime pas la branche, ne la fusionne pas dans `main`, ne la remets pas à zéro. `CLAUDE.md`, puis les ateliers B et C, s'y ajoutent à la suite.
- **L'arbre doit être propre** : `git status` ne montre rien (sinon `git stash -u`).
- **La branche est sur GitHub.** Si `git push` répond qu'elle n'a pas de branche distante, envoie-la une fois vers ton fork : `git push -u origin journee`.

## Plonger dans le code (20 min)

Pose ces questions à Claude, une par une, et vérifie chaque réponse dans le code qu'il cite. **Note ce que tu repères** (sur papier ou dans un fichier que tu ne commiteras pas) : ces notes rempliront ton `CLAUDE.md`. Entre parenthèses, la rubrique du modèle qu'elles alimentent.

1. **La structure** : « Quel est le rôle de `apps/api`, `apps/web` et `packages/shared` ? Qu'est-ce qui a le droit d'importer quoi ? » (architecture)
2. **Les couches de l'API NestJS** : « Suis la création d'une discipline, de la requête HTTP à la base : quels fichiers, dans quel ordre, et que fait chacun ? » (architecture, concepts appréciés)
3. **Le nommage** : « Quelles conventions de nommage suit le module `disciplines` : fichiers, classes, cas d'usage, codes d'erreur, titres des tests ? » (nommage)
4. **La gestion des erreurs** : « Que se passe-t-il quand on crée une discipline dont le nom existe déjà ? Où l'erreur est-elle levée, et où devient-elle un `409` ? » (bonnes pratiques)
5. **La validation des entrées** : « Où est validé le corps d'une requête `POST /api/disciplines`, et que répond l'API s'il est invalide ? » (bonnes pratiques)
6. **Les tests** : « Quels sont les types de tests du dépôt, où sont-ils, et que vérifie chacun ? » (méthodologie)

Pour aller vite : le module modèle est dans `apps/api/src/modules/disciplines/`, et le [README du dépôt](../README.md) décrit l'ordre pour ajouter une fonctionnalité.

## Pourquoi un CLAUDE.md (10 min)

Ce qui manquait à l'agent « sans harness » de la démo d'ouverture, c'est le contexte du projet. `CLAUDE.md` est la mémoire permanente du projet : Claude le lit au début de chaque session. Il dit ce qui est vrai dans ce dépôt (architecture, conventions, nommage) et renvoie vers le détail. Il reste court : une ligne inutile coûte du contexte à chaque session.

| Fichier                                 | Rôle                                                    | Quand il est lu                      |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------ |
| `CLAUDE.md`                             | ce qui est vrai dans le projet : conventions, structure | à chaque session                     |
| une skill (`.claude/skills/*/SKILL.md`) | comment faire une tâche, étape par étape                | seulement quand on lance la commande |
| `specs/constitution.md`                 | les six principes de la méthode des ateliers B et C     | par les skills `/prd` à `/converge`  |

**Règle d'or.** `CLAUDE.md` pour ce qui est toujours vrai et court, une skill pour une procédure. `CLAUDE.md` pointe vers les skills ; une skill ne répète jamais `CLAUDE.md`, elle le lit.

Le modèle [CLAUDE.modele.md](CLAUDE.modele.md) sert de guide de construction : cinq rubriques, chacune avec ce qu'il faut y écrire et un exemple.

## Rédiger ton CLAUDE.md (20 min)

1. `git status` doit être propre, sur la branche `journee` (voir [Avant de commencer](#avant-de-commencer)).
2. Copie le modèle à la racine du dépôt : `cp task/CLAUDE.modele.md CLAUDE.md`.
3. Remplis les cinq rubriques : **méthodologie**, **architecture**, **concepts appréciés**, **bonnes pratiques**, **nommage**. Chaque rubrique contient un commentaire qui explique quoi écrire, et un exemple.
4. Pars de tes notes d'exploration. Si une rubrique reste vide, demande à Claude ; c'est toi qui décides ce qui entre dans `CLAUDE.md`.
5. Supprime les commentaires du modèle (`<!-- … -->`) une fois la rubrique remplie : Claude les lirait à chaque session.
6. Vérifie la taille : **60 lignes au plus**. Une règle que Claude suivrait de toute façon n'a rien à faire là.
7. Formate, puis commite : `pnpm format`, puis `git add CLAUDE.md && git commit -m "docs: add project CLAUDE.md"`, et enfin `git push`. Le pré-commit vérifie aussi le format des fichiers Markdown.

Ce qu'un bon `CLAUDE.md` contient : des règles vérifiables (« un controller n'appelle qu'un cas d'usage ») plutôt que des vœux (« écrire du code propre ») ; des chemins réels ; des renvois (« la méthode est dans `specs/constitution.md` ») plutôt que des copies.

## Vérifier que Claude l'applique (10 min)

1. `/clear`, pour que Claude reparte de zéro et relise `CLAUDE.md`.
2. Construis la **tâche A**, planifiée à la manipulation 2 de la [prise en main](EXERCICES.md) sans être codée. Donne seulement le besoin métier, sans aucune consigne technique (ni module modèle, ni cas d'usage, ni `AppError`, ni test) : c'est ton `CLAUDE.md` qui doit les apporter.

   « Ajoute `GET /api/disciplines/:id/similaires` : les autres disciplines de la même catégorie, triées par nom, sans la discipline elle-même. Si l'id est inconnu, 404. »

3. Relis le diff et compare avec la tâche B de la prise en main, dont le prompt donnait toutes les consignes techniques. Vérifie, pour chaque règle que ton `CLAUDE.md` écrit :
   - un cas d'usage dans `application/use-cases/`, avec une méthode `execute()` ;
   - un controller fin, sans règle métier ;
   - le 404 levé par une `AppError` avec le code `DISCIPLINE_NOT_FOUND` ;
   - un test e2e dans `apps/api/test/`, qui vérifie le 200 et le 404, avec des titres nommés selon ta convention.

   Puis demande-lui : « Quelles règles de CLAUDE.md as-tu appliquées ? »

4. Si une convention manque, ne corrige pas le code à la main : complète `CLAUDE.md`, puis demande à Claude de reprendre la fonctionnalité en le relisant.
5. Quand `pnpm test` est vert, demande : « commite avec un message Conventional Commits ». Cette fois, on garde la fonctionnalité.

**Réussi si** ton `CLAUDE.md` fait 60 lignes au plus et ses cinq rubriques sont remplies, la route des disciplines similaires est commitée avec ses tests verts, et Claude a appliqué au moins une convention écrite dans `CLAUDE.md` sans qu'elle soit dans le prompt.
