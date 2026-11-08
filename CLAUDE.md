# CLAUDE.md

Application des JOJ Dakar 2026 (résultats et médailles) : API NestJS (`apps/api`), front React (`apps/web`), schémas Zod partagés (`packages/shared`), monorepo pnpm. Commandes détaillées et déploiement : `README.md`, `deploy/*/README.md`.

<!-- >>> artist-signature >>> -->

@AGENTS.md

**Spécificités Claude Code**

- Test navigateur : extension **Claude in Chrome**, boucle du skill `browser-validation` (copie dans `.claude/skills/`). Pour l'app locale (`localhost`), aucune session de Cherif n'est nécessaire ; `playwright-cli` est le second moteur.
- Tu ne sollicites pas Cherif avant le vert : parcours réel dans le navigateur, console propre, `pnpm check` vert. Sa validation finale est un filet de sécurité, jamais une session de debug.

<!-- <<< artist-signature <<< -->

## Mode de travail : autonome jusqu'à la livraison

- Une fonctionnalité demandée se mène seul, de bout en bout : cadrage, code, tests, QA dans le navigateur, relecture, rapport. **Aucune pause de validation entre deux étapes** (ni PRD, ni spec, ni plan, ni playbook : les statuts passent seuls à « Validé(e) » quand `pnpm spec:check` est vert).
- Une ambiguïté se tranche en énonçant l'hypothèse (spec, « Questions ouvertes ») et se remonte dans le rapport. Pas de question en cours de route. Seuls arrêts légitimes : secret de production, action externe irréversible, passage sur `main` (voir Livraison), blocage après deux boucles de correction.
- Pas de hook bloquant ni de rituel dans ce dépôt. Les garde-fous sont `pnpm verify` (lefthook, avant chaque commit) et `pnpm check` (avant de livrer).
- Rapport final de 5 à 8 lignes : fait (SHA), preuves (tests, QA, captures), hypothèses à contester, ce qu'il te faut (une ligne). Le détail va dans la spec, un playbook ou la PR, pas dans le message.

## Équipe : qui fait quoi

La session principale orchestre (rôle de `cherif`) et appelle les agents l'un après l'autre : un sous-agent n'en lance pas d'autre. Chaque délégation porte objectif, périmètre, contraintes, critères d'acceptation, fichiers et livrable ; chaque retour porte résultat, preuves, écarts et décisions. Un « c'est bon » sans preuve est refusé.

1. **sofia** : avant toute interface nouvelle ou refonte (pas pour un correctif sans UI). Ses décisions vivent dans `specs/design/`.
2. **ibrahima** : conçoit et code en TDD (scénarios, plan, tâches, commits, playbook).
3. **cherif-qa** : après le code. Joue `playbooks/` sur la vraie pile (méthode : `.claude/agents/testeur.md`), puis teste l'imprévisible (`playbooks/transverse.md`). Il rapporte avec preuves, il ne corrige pas.
4. **relecteur** (local) : en dernier, contexte vierge. Ne lui donne que `Base : <base>. Spec : specs/NNN-nom.`, jamais ton résumé.

Un écart bloquant retourne à ibrahima, puis re-test ciblé. Deux boucles au plus avec le même agent, ensuite tu escalades à Cherif avec les faits. Aucun agent ne certifie son propre travail.

## Cycle d'une fonctionnalité

Les skills `/prd`, `/spec`, `/spec-plan`, `/playbook`, `/tdd-task`, `/converge` sont les outils d'ibrahima ; il les enchaîne sans s'arrêter et en dose l'usage : un correctif = test rouge, code, `pnpm verify` ; une fonctionnalité = ce qui suit.

1. **Cadrer** : lire `specs/prd-resultats-medailles.md` et `specs/constitution.md`, puis écrire `specs/NNN-nom/spec.md` (scénarios `ASn`, sans technique) et `plan.md` (six tâches au plus).
2. **Réaliser** : un test d'abord, vu en échec (`pnpm tdd:red <fichier>`), puis le code minimal, `pnpm verify`, un commit par tâche.
3. **Tester** : `playbooks/NNN-nom.md` (`pnpm playbook:check NNN`), joué par cherif-qa sur la vraie pile, mobile d'abord (375 puis 320 px).
4. **Converger** : `pnpm spec:check specs/NNN-nom --trace`, `pnpm check`, relecteur → « Converged ».
5. **Rapporter**.

## Spécificités projet

Commandes (Node ≥ 24.11, pnpm 10) : `pnpm dev` (API :3000, front :5173) · `pnpm test` · `pnpm lint` · `pnpm format` · `pnpm typecheck` · `pnpm build` · `pnpm verify` (fichiers modifiés) · `pnpm check` (tout) · `pnpm db:generate --name=<sujet>` / `db:seed` / `db:reset` / `db:scrape` · `pnpm spec:check` · `pnpm playbook:check` · `pnpm tdd:red <fichier>`.

Modules existants, qui servent de modèle : `podiums` et `users`. Pour un nouveau module, partir de `apps/api/src/modules/podiums/`, `packages/shared/src/podiums.ts`, `apps/api/test/podiums.e2e.spec.ts`, `apps/web/src/features/{podiums,medals}/` et `apps/web/src/mocks/`.

Architecture :

- Un module par domaine dans `apps/api/src/modules/<domaine>/`, en `domain/`, `application/`, `infra/`, `http/`, plus `<domaine>.module.ts` dans les `imports` de `src/app.module.ts`.
- `domain/` est du TypeScript pur (ni NestJS ni Drizzle, le lint le vérifie). `application/` dépend d'un port (`<entité>.repository.ts`), jamais de Drizzle ; l'implémentation est dans `infra/`.
- Le socle commun est dans `apps/api/src/core/` (configuration, base, erreurs, santé, sécurité) : on l'utilise, on ne le duplique pas.
- Schémas d'entrée et de sortie dans `packages/shared/src/<domaine>.ts`, exportés par `index.ts`, partagés par l'API et le front.
- Front : `apps/web/src/features/<domaine>/` (`api/` puis `components/`), pages dans `apps/web/src/routes/`, fausse API dans `apps/web/src/mocks/` (mêmes schémas et codes d'erreur que l'API, avec son test).

Conventions (elles prolongent les trois lois de la signature) :

- **Tokens** : couleurs, espacements, typographie dans le design system Cachet (`apps/web/src/styles/cachet.css`) ; aucune valeur en dur dans un composant.
- **Config** : `apps/api/src/core/config/app-config.ts` ; les valeurs sensibles viennent de `apps/api/.env`, jamais du code.
- **Logs** : `Logger` de NestJS dans `apps/api/src`, aucun `console.*`. Les scripts `apps/api/scripts/` sont des outils en ligne de commande : leur sortie console est leur interface, et tout code qu'ils partagent avec l'API passe par `Logger`.
- Typage strict : pas de `any`, pas de `as` pour faire taire le compilateur. Une classe par cas d'usage, une seule méthode publique `execute()`. Entités créées par `create()`, relues par `restore()`. Controllers fins : valider, appeler un cas d'usage, sérialiser.
- Toute erreur métier est une sous-classe d'`AppError` (code stable préfixé par l'entité, catégorie VALIDATION, NOT_FOUND, CONFLICT ou BUSINESS_RULE) ; seul `ProblemDetailsFilter` produit la réponse HTTP. Jamais de `HttpException`. Toute entrée est validée par un schéma Zod de `packages/shared` (DTO `createZodDto`).
- Une migration se génère, elle ne s'écrit jamais à la main.
- Tests : domaine en unitaire, cas d'usage avec le repository en mémoire (`application/testing/`), Drizzle et e2e sur PGlite en mémoire (`apps/api/test/`). Nommage : `*.spec.ts`, `*.int.spec.ts`, `*.e2e.spec.ts`, `*.test.tsx` ; titres en anglais préfixés du scénario : `it('001-AS2: rejects a full trip')`.
- Fichiers en kebab-case, classes en PascalCase, un cas d'usage est un verbe suivi de l'entité (`CreateBooking`), codes d'erreur en majuscules (`BOOKING_NOT_FOUND`).

## Livraison et git

- Branche de travail : `journee`. Un commit par tâche, en Conventional Commits qui cite tâche et scénario (`feat(bookings): T03 refuse a full trip (001-AS2)`), dans la voix de Cherif, sans trailer ni mention d'IA. Jamais `--no-verify`. Pousse la branche à chaque commit.
- Ce dépôt n'a pas de CI GitHub : la preuve de « fait » est locale (`pnpm check` vert, QA jouée sur la vraie pile, relecteur « Converged »).
- `main` est déployée toute seule (Vercel pour le front, `joj-api-watch` toutes les 5 min sur alpha pour l'API). Fusionner ou pousser sur `main` = production, donc feu vert de Cherif. Après ce feu vert : vérifier `journalctl -u joj-api-watch` et les URLs publiques (voir `deploy/alpha/README.md`).

## Garde-fous restants

- Hook `secret-guard` (écritures de fichiers) : refuse un secret probable. Les vraies valeurs vont dans `apps/api/.env`, ignoré par git. Les valeurs de test évidentes passent.
- lefthook : `pnpm verify --staged` avant chaque commit.

<!-- >>> artist-agents >>> -->

## Agents disponibles pour ce projet (`$CLAUDE_AGENTS_ROOT`)

- `cherif` — orchestrateur : cadre la mission, route, fait respecter les contrats de passage. Voir `$CLAUDE_AGENTS_ROOT/cherif.md`.
- `ibrahima` — développeur senior et architecte : conçoit et code en TDD. Voir `$CLAUDE_AGENTS_ROOT/ibrahima.md`.
- `sofia` — directrice artistique : avant toute interface nouvelle ou refonte. Voir `$CLAUDE_AGENTS_ROOT/sofia.md`.
- `cherif-qa` — testeur sceptique : joue les playbooks puis l'imprévisible, ne corrige jamais. Voir `$CLAUDE_AGENTS_ROOT/cherif-qa.md`.
- `relecteur` — relecteur indépendant local au projet, contexte vierge, ne modifie rien. Voir `.claude/agents/relecteur.md`.

<!-- <<< artist-agents <<< -->

<!-- >>> artist-brief >>> -->
<!-- snapshot du Brief Fondateur (coffre Obsidian : 00-Socle/Brief Fondateur — Contexte Canonique (l'Artist)) — généré le 2026-11-08 -->

**Qui** : [nom retiré], alias « l'Artist » — [profil retiré]
[profil retiré]

**Standards non-négociables (Definition of Done, §3 du Brief)** :

- UX/UI exigence haute — jamais l'apparence "template par défaut", mobile-first, hiérarchie
  visuelle nette, micro-interactions soignées, accessibilité. Vitrines → niveau Awwwards 2026.
- Performance : chargement perçu rapide, pas de jank, lazy-loading, requêtes optimisées.
- Disponibilité : pensé pour tourner en prod (santé, logs, dégradation gracieuse).
- Sécurité validée par défaut (entrées, authz/authn, secrets, surface d'attaque) — pas une
  option de fin de projet.
- Doctrine de code : TDD, design patterns, Clean Architecture — non négociables.

**Préférences de livraison (§4 du Brief)** :

- Jamais de commandes à taper manuellement pour une grosse config/séquence : un
  `CLAUDE.md`/prompt prêt pour Claude Code, ou un script bash autonome en une seule action.
- Aller à l'essentiel, pas de remplissage — repère le bullshit.
- Décision structurante en jeu → 2-3 options tranchées avec arbitrages, pas de "ça dépend".

Note canonique (source de vérité, à re-consulter si ce snapshot date) :
Coffre Obsidian « Cerveau » — 00-Socle/Brief Fondateur — Contexte Canonique (l'Artist).md
<!-- <<< artist-brief <<< -->
