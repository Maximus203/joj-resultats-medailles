# CLAUDE.md

<!--
Modèle à copier à la racine du dépôt (`cp task/CLAUDE.modele.md CLAUDE.md`), puis à remplir.
Claude lit ce fichier au début de chaque session : garde-le court (60 lignes au plus) et supprime
chaque commentaire une fois sa rubrique remplie.
-->

Application d'organisation des JOJ Dakar 2026 : une API NestJS (`apps/api`), un front React (`apps/web`) et des schémas partagés (`packages/shared`), dans un monorepo pnpm. Commandes et structure détaillée : `README.md`.

## Méthodologie

<!--
Comment on découpe, planifie et valide une tâche. Trois à cinq règles.
Exemples :
- Toute fonctionnalité suit le cycle /prd → /spec → /spec-plan → /tdd-task → /converge (voir specs/constitution.md).
- Un test d'abord, vu en échec, puis le code minimal ; `pnpm verify` avant chaque commit.
- Une tâche = un commit Conventional Commits.
-->

## Architecture

<!--
Où va quoi. Nomme les dossiers réels et la règle de chacun.
Exemples :
- Un module par domaine dans `apps/api/src/modules/<domaine>/`, découpé en domain/, application/, infra/, http/, sur le modèle de `disciplines`.
- `domain/` n'importe ni NestJS ni Drizzle.
- Les schémas d'entrée et de sortie sont dans `packages/shared` et servent à l'API comme au front.
-->

## Concepts appréciés

<!--
Les choix de style qu'on attend, avec leur raison.
Exemples : typage strict (pas de `any`), fonctions courtes, une classe par cas d'usage avec une méthode `execute()`,
objets du domaine créés par `create()` et relus par `restore()`.
-->

## Bonnes pratiques

<!--
Erreurs, validation, sécurité, tests. Des règles vérifiables.
Exemples :
- Toute erreur métier est une `AppError` avec un code stable en majuscules ; seul `ProblemDetailsFilter` la transforme en HTTP.
- Une entrée est validée par un schéma Zod de `packages/shared`, jamais à la main dans le controller.
- Aucun secret dans le code : les valeurs sensibles viennent de `.env`.
- Tests unitaires du domaine avec le repository en mémoire, tests e2e de l'API sur PGlite.
-->

## Nommage

<!--
Fichiers, classes, variables, tests, commits. Donne un exemple réel pour chaque règle.
Exemples :
- Fichiers en kebab-case : `create-discipline.ts`, `drizzle-discipline.repository.ts`.
- Classes en PascalCase, cas d'usage nommés par un verbe : `CreateDiscipline`.
- Codes d'erreur en majuscules : `DISCIPLINE_NAME_TAKEN`.
- Titres de tests en anglais, préfixés par le scénario : `it('001-AS2: rejects a full slot')`.
-->
