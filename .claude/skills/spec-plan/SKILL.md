---
name: spec-plan
description: Écrit le plan technique d'une spec validée (résumé, fichiers par couche, données, erreurs, un test par scénario, six tâches au plus) dans specs/NNN-nom/plan.md, puis s'arrête pour validation humaine. À lancer par l'utilisateur avec /spec-plan [specs/NNN-nom].
argument-hint: '[specs/NNN-nom]'
---

# /spec-plan : planifier

Spec visée : $ARGUMENTS (par défaut, le plus grand `specs/NNN-*`).

## 1. Lire

- `specs/constitution.md`, et le `CLAUDE.md` du dépôt s'il existe.
- `spec.md` de la spec. **Si son statut n'est pas `Validée`, arrête-toi** : dis quel statut tu as lu, et que la spec doit d'abord être relue et validée (`/spec`). N'écris rien.
- Le module modèle : `apps/api/src/modules/disciplines/` (domain, application, infra, http), `packages/shared/src/disciplines.ts`, `apps/api/test/disciplines.e2e.spec.ts`, `apps/web/src/mocks/` et `apps/web/src/features/disciplines/`. Reprends ses noms et sa structure.

## 2. Rédiger `plan.md`

Copie `.claude/skills/spec-plan/plan-template.md` dans le dossier de la spec et remplis ses six sections numérotées, dans l'ordre.

**Écris pour un junior qui découvre le dépôt.** Des phrases complètes, qui disent ce qu'elles décrivent : « On crée le module `volunteers`, organisé comme le module Disciplines. » plutôt que « Sur le modèle de `disciplines/`. ». Pas de raccourcis du type « créneau = `Slot` » ni de parenthèses elliptiques : les correspondances entre les mots de la spec et les noms du code vont dans le tableau du résumé. Chaque section commence par une phrase qui dit ce qu'elle contient ; chaque fichier listé est suivi de son rôle.

1. **Résumé** : trois à cinq phrases (ce qu'on construit, ce que l'utilisateur pourra faire à la fin, le découpage en tâches, ce qui est laissé de côté), puis le tableau des mots de la spec et de leur nom dans le code.
2. **Fichiers par couche** : shared → domain → application → infra → http → web. Seulement ce qu'il faut pour les scénarios. Pour chaque route : méthode, chemin, effet et réponse.
3. **Données** : tables, colonnes, contraintes (unicité, clés étrangères), et la règle que chaque contrainte protège.
4. **Erreurs** : une ligne par refus métier. Code stable en majuscules, catégorie AppError (VALIDATION 400, NOT_FOUND 404, CONFLICT 409, BUSINESS_RULE 422), situation, scénario. Quand la spec donne le code et le statut d'un refus, reprends-les tels quels, avec la catégorie qui donne ce statut.
5. **Tests par scénario** : chaque `ASn` de la spec a une ligne, avec fichier, niveau (unitaire, intégration, e2e, écran) et ce que le test vérifie. Choisis le niveau le plus bas qui prouve le « Alors ».
6. **Tâches** : six au plus, dans l'ordre des couches, format `- [ ] T01 [NNN-AS1] Écrire d'abord <fichier de test> (« NNN-AS1: … »), puis <code>`. Une tâche tient dans un commit et cite les scénarios qu'elle fait avancer : `[NNN-AS2]`, ou `[NNN-AS2, AS3, AS4]` si son test en couvre plusieurs (une route qui porte plusieurs règles). Le front fait une tâche à part entière s'il est dans la spec.

Le plan ne rajoute aucun besoin : ce qui n'est pas dans la spec n'y est pas.

## 3. Vérifier

`pnpm spec:check specs/NNN-nom`, puis `pnpm format`. Corrige jusqu'à ce que `spec:check` soit vert.

## 4. S'arrêter

Montre à l'utilisateur, dans cet ordre :

1. le résumé du plan (section 1, tel quel) ;
2. les routes ou écrans ajoutés ;
3. les erreurs prévues (code, statut HTTP, scénario) ;
4. la liste des tâches, une ligne chacune ;
5. les choix que tu as faits sans que la spec les impose, pour qu'il puisse les contester.

Puis demande-lui de relire `plan.md`.

**Ne passe pas à la suite.** Le statut reste `Brouillon` tant que l'utilisateur n'a pas dit explicitement qu'il valide. Une remarque n'est pas une validation : corrige le plan et redemande.

Sur accord explicite seulement : `**Statut** : Validé`, `pnpm spec:check`, puis `git add specs/NNN-nom && git commit -m "docs(<module>): add validated plan NNN"`, et termine par :

> Plan validé. Prochaine étape : `/tdd-task` (toutes les tâches) ou `/tdd-task T01`
