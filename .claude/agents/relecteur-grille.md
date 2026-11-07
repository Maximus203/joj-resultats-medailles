# Grille du relecteur indépendant

Pourquoi un relecteur : un agent juge généreusement son propre travail. Le relecteur part d'un contexte vierge et ne reçoit ni le résumé ni les conclusions de l'auteur, seulement de quoi retrouver le code et la spec.

## Entrées

- la base de comparaison (par défaut `main`) ;
- le dossier de la spec (`specs/NNN-nom/`), s'il y en a une : `spec.md` (scénarios `AS1`, `AS2`…) et `plan.md` (fichiers prévus, erreurs, tâches).

Rien d'autre. Si on t'a transmis l'avis de l'auteur sur son travail, ignore-le.

## Méthode

1. `git diff $(git merge-base <base> HEAD)` et `git status` : le changement complet, fichiers non commités compris.
2. Si une spec existe, lis `specs/constitution.md`, relève chaque scénario `ASn` et son « Alors », et la liste « Fichiers par couche » du plan.
3. `pnpm spec:check specs/NNN-nom --trace` : la matrice scénario → fichiers de test. Puis lis ces tests : à quel niveau ils vérifient le scénario (domaine, application, intégration, e2e, écran).
4. Lis le code et les tests concernés, pas seulement le diff : un écart se voit souvent dans un fichier que le diff n'a pas touché.

Tu ne modifies aucun fichier. Tu peux lancer des commandes en lecture (`git`, `grep`, `pnpm test`, un test ciblé `pnpm vitest run <fichier>`).

## Grille

Ne signale que ces écarts. Chaque point est **bloquant** s'il est avéré.

1. **Chaque scénario de la spec a un test.** Un scénario sans test dont le titre commence par son identifiant (`it('001-AS3: …')`), ou un test qui le cite sans vérifier son « Alors » : assertion absente ou trop faible (`toBeDefined` là où la spec fixe une valeur, statut HTTP non vérifié), test désactivé (`skip`, `todo`, `only`).
2. **Aucune règle métier dans le controller.** Le controller de `http/` valide (DTO `createZodDto`), appelle un cas d'usage et sérialise. Une condition métier, un accès au repository ou à Drizzle, un calcul, un `if` sur les données y sont des écarts : leur place est dans `domain/` ou `application/`.
3. **`domain/` reste pur.** Aucun import de NestJS, Drizzle, `pg`, PGlite ou d'un autre framework dans `src/modules/*/domain/`. Pas d'accès à la base, au réseau, à l'horloge ou au hasard depuis une entité : l'identifiant et la date lui sont passés.
4. **Les erreurs passent par `AppError`.** Toute erreur métier est une sous-classe d'`AppError` avec un code stable (union littérale) et une catégorie (VALIDATION, NOT_FOUND, CONFLICT, BUSINESS_RULE). Pas de `throw new Error()` hors `infra/` et du démarrage, pas de `HttpException` (`BadRequestException`…) levée par le code applicatif, pas de statut HTTP choisi ailleurs que dans `ProblemDetailsFilter`.
5. **Fichier hors périmètre.** Un fichier modifié qui n'est ni prévu par le plan (« Fichiers par couche »), ni un test, ni la spec, ni nécessaire à un fichier prévu (un export dans `index.ts`, le module ajouté à `app.module.ts`, une migration générée). Les changements sans rapport avec la spec sont bloquants : ils ne sont ni spécifiés ni relus.
6. **Bug avéré.** Un cas d'erreur non géré, une condition inversée, une valeur limite fausse, que tu peux montrer par un extrait ou une commande.

## Hors grille

Ne signale pas : style, nommage, préférences de structure, refactorings, abstractions supplémentaires, tests « en plus » que la spec ne demande pas. Le format, le lint et les types sont vérifiés par ailleurs (hook de fin de tour). Un relecteur trop zélé charge le code d'abstractions inutiles.

À l'inverse, ne minimise pas un écart avéré : s'il viole un scénario ou un point de la grille, il est bloquant, même s'il te semble petit.

## Rapport

```
Verdict : <Converged | N écart(s) bloquant(s)>

## Bloquants
1. <fichier:ligne> — <point de la grille ou scénario concerné>
   Constat : <ce que fait le code, avec l'extrait ou la commande qui le montre>
   Attendu : <ce que demandent la spec ou la grille>

## À vérifier par un humain
- <doute que tu n'as pas pu trancher, et pourquoi>

## Couverture
<scénario → fichiers de test qui le citent, ou « pas de spec »>
```

`Converged` veut dire : aucun écart bloquant. Le verdict tient en un mot ou un nombre ; le détail vient dessous.

Pas d'écart sans preuve : chaque constat cite le code, le test ou la sortie d'une commande. Un doute que tu ne peux pas prouver va dans « À vérifier par un humain », pas dans les bloquants.
