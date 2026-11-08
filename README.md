# JOJ Dakar 2026 : point de départ de l'atelier C

Un monorepo pnpm : une API NestJS, un front React et des schémas partagés. Le socle technique est prêt (configuration, base, erreurs, client HTTP, fausse API des tests) ; aucun module métier n'est écrit. Le module de référence, qui montre toute la chaîne du schéma partagé à l'écran, se lit sur la branche `main` (voir `CLAUDE.md`).

L'énoncé de l'atelier C est dans [`task/ATELIER-C.md`](task/ATELIER-C.md).

## Prérequis

- **Node 24 LTS** (`node -v` doit afficher `v24.x`). Avec nvm : `nvm use`.
- **pnpm**, via corepack (fourni avec Node) : `corepack enable`.
- **Git**.

Docker est facultatif (voir [Base de données](#base-de-données)).

## Installer et lancer

```bash
pnpm install
pnpm dev
```

Puis ouvrir :

- le front : http://localhost:5173
- l'API : http://localhost:3000/api (santé : `/api/health`)
- la doc de l'API (Swagger, pour essayer les routes) : http://localhost:3000/api/docs

Pour charger des données de démo (voir [Base de données](#base-de-données)) : arrêter `pnpm dev` (Ctrl+C), lancer `pnpm db:seed`, puis relancer `pnpm dev`.

## Commandes

| Commande           | Effet                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| `pnpm dev`         | API (port 3000) et front (port 5173) en parallèle                                   |
| `pnpm test`        | tous les tests (Vitest), sans Docker ni réseau                                      |
| `pnpm test:watch`  | les tests en continu                                                                |
| `pnpm lint`        | oxlint                                                                              |
| `pnpm format`      | formate tout (oxfmt) ; `pnpm format:check` vérifie seulement                        |
| `pnpm typecheck`   | TypeScript sur tout le repo                                                         |
| `pnpm build`       | build de l'API (SWC) et du front (Vite)                                             |
| `pnpm check`       | tout le dépôt : format, lint, types, tous les tests, build                          |
| `pnpm verify`      | les seuls fichiers modifiés : format, lint, types, tests liés                       |
| `pnpm db:generate` | génère une migration après un changement de schéma Drizzle                          |
| `pnpm db:seed`     | applique les migrations et charge `apps/api/data/*.json`                            |
| `pnpm db:reset`    | vide la base locale, applique les migrations et recharge les données                |
| `pnpm db:scrape`   | lit le site officiel et écrit `apps/api/data/podiums.json` (même code que l'import) |

## Structure

```
apps/
  api/                      NestJS 11 + Drizzle
    src/core/               transverse : config, erreurs (AppError, RFC 9457), base, santé
    src/modules/<domaine>/  un module Nest par domaine (voir ci-dessous)
    migrations/             générées par drizzle-kit, jamais éditées à la main
    data/                   jeux de données JSON chargés par db:seed
    test/                   tests e2e de l'API (supertest)
  web/                      React 19 + Vite
    src/routes/             pages (TanStack Router, un fichier = une route)
    src/features/<nom>/     api/ (appels HTTP et hooks TanStack Query) et components/
    src/components/ui/      composants shadcn
    src/lib/api/            client HTTP typé
    src/mocks/              la fausse API des tests (MSW), au même contrat que apps/api
    src/test/               setup Vitest, fonctions de rendu, audit d'accessibilité
packages/
  shared/                   schémas Zod et types partagés par l'API et le front
specs/                      constitution et specs des fonctionnalités (voir Méthode)
task/                       énoncé de l'atelier C, pistes et grille de relecture
tools/sdd/                  scripts des skills : spec:check, tdd:red, verify
.claude/                    garde-fou secrets, skills et sous-agents (relecteur, testeur) de Claude Code
```

Un module de domaine de l'API, `src/modules/<domaine>/` :

```
domain/        entités et règles métier, TypeScript pur (aucun import de Nest ni de Drizzle : vérifié par le lint)
  <entité>.ts              <Entité>.create() applique les règles, <Entité>.restore() relit la base
  <domaine>.errors.ts      <Entité>Error extends AppError : codes stables et catégorie
application/   cas d'usage, un par classe, méthode execute()
  <entité>.repository.ts   port : classe abstraite, ce dont les cas d'usage ont besoin
  use-cases/               un fichier par action : create-<entité>.ts, list-<domaine>.ts…
  testing/                 repository en mémoire, pour tester sans base
infra/         persistance
  <domaine>.schema.ts      table Drizzle (lue par drizzle-kit)
  <entité>.mapper.ts       toDomain() et toRow()
  drizzle-<entité>.repository.ts
http/          controller fin : valider (DTO zod), appeler un cas d'usage, sérialiser
<domaine>.module.ts        relie le port à son implémentation Drizzle
```

Une erreur métier est une `AppError` (code stable + catégorie VALIDATION, NOT_FOUND, CONFLICT ou BUSINESS_RULE). Le `ProblemDetailsFilter` est le seul endroit où elle devient une réponse HTTP (400, 404, 409, 422, au format RFC 9457).

## Base de données

**Par défaut : PGlite**, un PostgreSQL complet qui tourne dans le process de l'API. Rien à installer. Les données sont dans `apps/api/.data/` (ignoré par git), et les migrations sont appliquées au démarrage de l'API. PGlite n'accepte qu'un process à la fois : arrêter `pnpm dev` avant `pnpm db:seed` ou `pnpm db:reset` (le script le vérifie).

**Avec Docker : un vrai PostgreSQL 17.**

```bash
docker compose up -d
```

Puis créer `apps/api/.env` à partir de `apps/api/.env.example` et y décommenter `DATABASE_URL=postgres://joj:joj@localhost:5432/joj`. Relancer `pnpm dev`. Pour revenir à PGlite, recommenter la ligne. Si le port 5432 est déjà pris : `POSTGRES_PORT=5433` dans un fichier `.env` à la racine, et le même port dans `DATABASE_URL`.

Le code ne dépend pas du mode : un seul provider Nest fournit l'instance Drizzle (`src/core/database/`). Les tests utilisent toujours PGlite en mémoire.

**Données de démo** : un fichier `apps/api/data/<table>.json` par table, qui contient un tableau de lignes dont les clés sont les noms des colonnes en base (`created_at`). Un préfixe fixe l'ordre de chargement si une table en référence une autre (`01-pays.json`, `02-athletes.json`). Relancer `db:seed` ignore les lignes déjà présentes.

**Import automatique des résultats officiels** (module `scraping`) : l'API lit elle-même le site officiel des résultats (calendrier, puis page « Medallists » de chaque finale terminée) et enregistre les podiums sans doublon. Éteint par défaut en développement et en test (`SCRAPING_ENABLED=false`) ; en production il tourne chaque soir à 23:00 (Africa/Dakar) du 1er au 14 novembre 2026 et rattrape au démarrage une exécution manquée. Règle de conflit : un podium saisi à la main ou corrigé par le journaliste n'est jamais écrasé, l'écart est seulement listé. Variables `SCRAPING_*` : voir `apps/api/.env.example` ; déploiement : `deploy/alpha/README.md`. `GET /api/scraping` montre la dernière exécution (importés, mis à jour, identiques, écarts, absents de la source, finales ignorées et pourquoi) ; `POST /api/scraping/runs` en lance une à la demande (écriture : protégée en production). Les tests simulent le site : aucun appel réseau.

## Ajouter une fonctionnalité

Dans cet ordre, en écrivant chaque test avant le code et en le voyant échouer. Les titres des tests (`describe`, `it`) s'écrivent en anglais et commencent par l'identifiant du scénario, précédé du numéro de la spec : `it('001-AS2: rejects a full trip', …)`. Modèle : le module de référence de la branche `main` (voir `CLAUDE.md`). Avec Claude Code, la [méthode](#méthode) suit cet ordre pour toi.

1. **Schéma partagé** : `packages/shared/src/<nom>.ts` (schémas Zod d'entrée et de réponse), exporté par `index.ts`.
2. **Entité et son test** : `domain/<entité>.ts`, `domain/<nom>.errors.ts`, `domain/<entité>.spec.ts`.
3. **Cas d'usage et leur test** avec le repository en mémoire : `application/<entité>.repository.ts` (port), `application/testing/in-memory-….ts`, `application/use-cases/*.ts`, `application/<nom>.application.spec.ts`.
4. **Table et migration** : `infra/<nom>.schema.ts`, puis `pnpm db:generate --name=<sujet>`.
5. **Repository Drizzle** : `infra/<entité>.mapper.ts`, `infra/drizzle-….repository.ts` et son test d'intégration `*.int.spec.ts` (PGlite en mémoire).
6. **Controller et test e2e** : `http/<nom>.controller.ts`, `<nom>.module.ts` ajouté aux `imports` de `src/app.module.ts`, puis `test/<nom>.e2e.spec.ts`.
7. **Fausse API** : les routes dans `apps/web/src/mocks/handlers.ts` (mêmes schémas, mêmes codes d'erreur que l'API), leurs données dans `fixture.ts`, et `handlers.test.ts`.
8. **Écran** : dans `apps/web/src/features/<nom>/`, `api/<nom>.api.ts` (appels HTTP), `api/<nom>.queries.ts` (hooks) et leur test, puis `components/` et leurs tests, puis la route dans `apps/web/src/routes/` et son audit `*.a11y.test.tsx`.

## Tests du front

Un test s'appelle `<fichier>.test.tsx` et se place à côté de ce qu'il teste. Il commence par un court commentaire qui dit ce qu'il prouve.

- **Une seule fausse API** (`src/mocks/`), servie par MSW à tous les tests. Une requête qu'elle ne connaît pas fait échouer le test. Elle garde ses données en mémoire : un test les prépare en modifiant `fixture` (`fixture.trips = []`). `mockControl` simule une latence (`setLatency(50)`) ou une panne (`failNext('GET /api/trips')`, `failPersistently(...)`). Tout est remis à zéro après chaque test.
- **Rendre** (`src/test/utils.tsx`) : `renderRoute({ initialEntries: ['/trajets'] })` monte l'application à une adresse, comme `main.tsx`. `renderWithProviders(<Composant />)` monte un composant seul, avec Query et un vrai router.
- **Vérifier ce qui part sur le réseau** : `trackRequests()` enregistre méthode, chemin et corps de chaque requête ; `writes(seen)` ne garde que les écritures.
- **Hooks** : `renderHook` avec un `QueryClient`, pour vérifier ce qui est invalidé dans le cache.
- **Accessibilité** : `expect(axeFindings(await runAxe())).toEqual([])` audite toute la page, boîtes de dialogue comprises. Un audit par état de l'écran.

Côté API, les tests s'appellent `*.spec.ts` (unitaires), `*.int.spec.ts` (intégration) et `*.e2e.spec.ts`.

Un composant shadcn de plus : `pnpm dlx shadcn@latest add <composant>` dans `apps/web`.

## Claude Code : agents, garde-fous et relecteur

Le travail se fait en autonomie, par les agents de `CLAUDE.md` : ibrahima code, sofia dessine, cherif-qa teste, le relecteur local relit. Il n'y a plus de hook de fin de tour ni de contrôle du message de commit. Les garde-fous sont :

- **Avant une écriture de fichier** : le hook `secret-guard` (`.claude/hooks/`, testé par `pnpm test`) refuse d'écrire un secret probable (clé d'API, token, mot de passe en clair, clé privée). Les vraies valeurs vont dans `apps/api/.env`, ignoré par git.
- **Avant chaque commit** : lefthook lance `pnpm verify --staged` (format, lint, types et tests liés aux fichiers commités).
- **Avant de livrer** : `pnpm check`.

Le sous-agent **relecteur** (`.claude/agents/relecteur.md`) relit une fonctionnalité dans un contexte vierge. Il ne modifie rien et rend un verdict, preuves à l'appui, selon une grille courte (`relecteur-grille.md`) : chaque scénario a un test, aucune règle métier dans le controller, `domain/` reste pur, les erreurs passent par `AppError`.

## Méthode

Développement guidé par la spec, en cinq commandes Claude Code que l'agent enchaîne seul, sans pause de validation :

```
/prd <idée>     → specs/prd-nom.md : la vision, en tranches TR1, TR2…
/spec TRn       → specs/NNN-nom/spec.md : le quoi, en scénarios AS1, AS2…
/spec-plan      → plan.md : fichiers, erreurs, tests, 6 tâches au plus
/tdd-task [Tnn] → pour chaque tâche : test rouge → code → vert → un commit
/converge       → traçabilité + pnpm check + QA (cherif-qa) + relecteur → « Converged »
```

- **`/prd <idée>`** : pour qui, quel problème, quelle solution, et le découpage en tranches ; les points faibles de la vision deviennent des hypothèses écrites, à contester dans le rapport final.
- **`/spec TRn`** : le quoi d'une tranche du PRD, sans technique, avec des scénarios `AS1`, `AS2`…
- **`/spec-plan`** : le comment, sur le modèle des modules existants (`podiums`), un test prévu par scénario.
- **`/tdd-task`** : une tâche (`/tdd-task T03`) ou toutes ; `pnpm tdd:red` prouve que le test échoue pour la bonne raison.
- **`/converge`** : si un manque reste, il devient une tâche ; après deux passages, l'agent escalade.

Les règles communes sont dans `specs/constitution.md`. Les scripts `pnpm spec:check`, `tdd:red` et `verify` (`tools/sdd/`) sont les outils des skills ; pour toi, une seule commande : `pnpm check`.

Ces commandes sont une version réduite de [Spec Kit](https://github.com/github/spec-kit) : `/spec` ≈ `/speckit.specify`, `/spec-plan` ≈ `/speckit.plan` + `/speckit.tasks`, `/tdd-task` ≈ `/speckit.implement`, `/converge` ≈ `/speckit.analyze` plus une relecture. Pour passer au cycle complet après la formation (constitution, clarify, checklist), installe la CLI `specify` (Python, via `uv`) et lance `specify init --here --ai claude` dans ton projet.
