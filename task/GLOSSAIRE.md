# Glossaire

Les mots de la journée, chacun avec un exemple pris dans le dépôt. Lis-le avant la prise en main, et garde-le ouvert : quand Claude emploie un mot que tu ne connais pas, il est sans doute ici.

## Le dépôt

- **Monorepo** : un seul dépôt git qui contient plusieurs applications. Ici, l'API (`apps/api`), le front (`apps/web`) et les schémas partagés (`packages/shared`).
- **pnpm** : l'outil qui installe les dépendances et lance les commandes (`pnpm dev`, `pnpm test`). Chaque dossier de `apps/` et `packages/` est un **workspace** : un paquet avec son propre `package.json`.
- **API** : le programme qui répond aux requêtes HTTP (`GET /api/disciplines`) et lit ou écrit la base de données. Le front l'appelle ; on peut aussi l'essayer dans **Swagger** (http://localhost:3000/api/docs).
- **Front** : les écrans, dans le navigateur (http://localhost:5173).

## Les technologies

- **NestJS** : le framework de l'API. Il range le code en **modules** (un par domaine, par exemple `disciplines`) et fournit les controllers.
- **Drizzle** : la bibliothèque qui décrit les tables en TypeScript (`infra/disciplines.schema.ts`) et lit ou écrit la base.
- **PGlite** : une base PostgreSQL qui tourne dans le processus, sans installer de serveur.
- **Migration** : un fichier SQL qui fait passer la base d'une version du schéma à la suivante. Générée par `pnpm db:generate`, jamais écrite à la main.
- **Zod** : la bibliothèque qui décrit la forme d'une donnée (un **schéma**) et la vérifie. Les schémas de `packages/shared` sont utilisés à la fois par l'API et par le front.
- **React** : la bibliothèque des écrans. **TanStack Query** y gère les appels à l'API, **TanStack Router** les pages, **shadcn** les composants (boutons, formulaires).
- **MSW** : une fausse API, utilisée par les tests du front pour ne pas dépendre de la vraie (`apps/web/src/mocks/`).

## L'architecture d'un module de l'API

Une requête traverse quatre **couches**, de l'extérieur vers l'intérieur. Chaque couche est un dossier de `apps/api/src/modules/disciplines/`.

- **http/** : le **controller** (`disciplines.controller.ts`). Il reçoit la requête, vérifie sa forme, appelle un cas d'usage et renvoie la réponse. Un controller **fin** ne contient aucune règle métier.
- **application/** : les **cas d'usage**, un par action (`use-cases/create-discipline.ts`), chacun avec une méthode `execute()`. Un cas d'usage relit les données, appelle le domaine et enregistre le résultat.
- **domain/** : les **règles métier**, par exemple « deux disciplines ne peuvent pas porter le même nom ». Une **entité** (`discipline.ts`) est un objet métier qui vérifie ses propres règles. Le domaine est en TypeScript **pur** : il n'importe ni NestJS ni Drizzle.
- **infra/** : la table et le code qui lit et écrit la base (`drizzle-discipline.repository.ts`).
- **Port, repository** : le cas d'usage ne connaît pas la base. Il dépend d'un **port** (`application/discipline.repository.ts`), une classe qui dit seulement « je sais enregistrer et retrouver une discipline ». L'**infra** en fournit l'implémentation réelle ; les tests, une version en mémoire.

## Les erreurs

- **`AppError`** : l'erreur levée quand une règle métier est violée (`apps/api/src/core/errors/app-error.ts`). Elle porte un **code** stable (`DISCIPLINE_NAME_TAKEN`) et une **catégorie** (introuvable, conflit…).
- **Problem Details** (RFC 9457) : le format standard des réponses d'erreur en JSON. Le fichier `core/errors/problem-details.filter.ts` transforme chaque `AppError` en réponse de ce format.
- **Codes HTTP** : `200` ou `201`, tout va bien ; `400`, la donnée envoyée est invalide ; `404`, la ressource n'existe pas ; `409`, conflit avec l'existant (nom déjà pris, créneau complet) ; `422`, une règle métier refuse l'action.

## Les tests

- **Vitest** : l'outil qui lance les tests (`pnpm test`).
- **Test unitaire** : vérifie une petite partie isolée, par exemple une règle du domaine (`domain/discipline.spec.ts`).
- **Test e2e** (de bout en bout) : envoie une vraie requête HTTP à l'API, branchée sur une base en mémoire (`apps/api/test/disciplines.e2e.spec.ts`).
- **TDD** (développement piloté par les tests) : on écrit le test d'abord, on le voit **échouer pour la bonne raison** (la fonctionnalité manque, pas une faute de frappe), puis on écrit le code qui le fait passer.

## La méthode (ateliers B et C)

- **PRD** : ta vision produit sur une page : pour qui, quel problème, ta solution, comment on saura que ça marche. Fichier `specs/prd-nom.md`.
- **Tranche** (`TR1`, `TR2`) : une partie du PRD qui a de la valeur seule et se construit d'un bloc.
- **Spec** : le quoi d'une tranche, sans technique (`specs/NNN-nom/spec.md`).
- **Scénario d'acceptation** (`AS1`, `AS2`) : un exemple précis au format « Étant donné / Quand / Alors ». Chacun a un test dont le titre commence par son identifiant (`001-AS2: …`). Exemple complet : [`specs/000-disciplines/spec.md`](../specs/000-disciplines/spec.md), la spec du module modèle.
- **Plan** : le comment : fichiers, tables, erreurs, tests et tâches (`specs/NNN-nom/plan.md`).
- **Tâche** (`T01`, `T02`) : une étape du plan, réalisée en TDD et commitée seule.
- **Constitution** : les six principes de la méthode (`specs/constitution.md`).
- **Convergence** : la fonctionnalité est finie quand chaque scénario a son test, que tout le dépôt est vert et qu'un relecteur indépendant est d'accord. `/converge` répond alors « Converged ».
- **Conventional Commits** : la forme imposée des messages de commit : `type(portée): description`, par exemple `feat(api): add similar disciplines`.

## Claude Code

- **Contexte** : tout ce que Claude a en tête pendant une conversation (messages, fichiers lus). Il est limité : `/context` le mesure, `/compact` le résume, `/clear` le vide.
- **Plan mode** : Claude propose un plan sans rien modifier (`Maj+Tab`).
- **Permission** : Claude demande ton accord avant une action qui n'est pas autorisée d'avance. La liste est dans `.claude/settings.json`.
- **`CLAUDE.md`** : la mémoire permanente du projet, lue au début de chaque session.
- **Skill** : une procédure écrite que Claude suit quand on l'appelle (`/spec`, `/tdd-task`), dans `.claude/skills/`.
- **Hook** : un script qui s'exécute tout seul à un moment précis (avant un commit, à la fin d'une réponse) et s'impose à Claude.
- **Sous-agent** : un second agent avec son propre rôle et un contexte vierge, par exemple le `relecteur` (`.claude/agents/relecteur.md`).
