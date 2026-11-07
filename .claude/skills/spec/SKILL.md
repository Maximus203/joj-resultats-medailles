---
name: spec
description: Rédige la spec d'une tranche d'un PRD validé (le quoi et le pourquoi, sans technique) dans specs/NNN-nom/spec.md, puis s'arrête pour validation humaine. À lancer par l'utilisateur avec /spec TRn <précisions>, après /prd.
argument-hint: TRn <précisions : règles, réponses attendues>
---

# /spec : écrire la spec

Demande : $ARGUMENTS

## 1. Lire les règles

Lis `specs/constitution.md`, et le `CLAUDE.md` du dépôt s'il existe. Applique-les sans les recopier.

## 2. Trouver la tranche

- Lis les PRD `specs/prd-*.md`. **S'il n'y en a aucun au statut `Validé`, arrête-toi** : dis que la méthode commence par `/prd`, et n'écris rien.
- La tranche est celle que cite la demande (`TR1`). S'il y a plusieurs PRD validés, ou si la demande ne cite pas de tranche, demande laquelle, en une question.
- La spec couvre cette tranche, et rien d'autre. Les précisions de la demande (règles, réponses attendues) la complètent. Si elles ajoutent un besoin que la tranche ne contient pas, signale-le : l'utilisateur corrige le PRD d'abord, ou le retire de la demande.

## 3. Créer le dossier

- Nom court en kebab-case, sans accent : `benevoles`, `tableau-medailles`.
- Numéro : le plus grand `specs/NNN-*` existant + 1, sur trois chiffres (`001` s'il n'y en a pas).
- Copie `.claude/skills/spec/spec-template.md` dans `specs/NNN-nom/spec.md`, et remplis la ligne `**PRD**` : `specs/prd-nom.md, TRn`.

## 4. Rédiger

- **Aucune technique** : ni route, ni table, ni composant. On décrit ce que l'utilisateur voit et ce que le système refuse.
- **Un refus dit sa réponse** : le statut et le code d'erreur donnés par la demande (`refus 409, code SLOT_FULL`), recopiés tels quels dans le « Alors ». C'est ce que l'appelant de l'API observe, et le plan les reprend. Si la demande ne les donne pas, décris le refus avec des mots (« refusé, avec un message de conflit ») et laisse le plan les choisir.
- Le contexte reprend le problème du PRD pour cette tranche, sans le recopier.
- 1 à 3 user stories, pour les utilisateurs du PRD.
- Des scénarios `### AS1 — titre`, `### AS2 — …`, chacun au format Étant donné / Quand / Alors. Le « Alors » est observable et vérifiable par un test : une valeur, un refus, un message.
- Un scénario par règle métier, et un pour le cas nominal. Pas de scénario pour la plomberie.
- Hors périmètre : ce que tu as choisi de ne pas faire.
- 70 lignes au plus.

## 5. Clarifier

Si un point **bloque** la rédaction (deux lectures possibles qui changent les scénarios), pose au plus 3 questions, en une seule fois. Sinon, note le point dans « Questions ouvertes » avec l'hypothèse retenue, et continue.

## 6. Vérifier

`pnpm spec:check specs/NNN-nom`. Il vérifie aussi que la tranche citée existe dans le PRD. Corrige jusqu'à ce qu'il soit vert.

## 7. S'arrêter

Montre à l'utilisateur la liste des scénarios (identifiant et titre) et les questions ouvertes, puis demande-lui de relire `specs/NNN-nom/spec.md`.

**Ne passe pas à la suite.** Le statut reste `Brouillon` tant que l'utilisateur n'a pas dit explicitement qu'il valide (« je valide », « ok pour la spec »). Une remarque n'est pas une validation : corrige la spec et redemande.

Sur accord explicite seulement : remplace `**Statut** : Brouillon` par `**Statut** : Validée`, relance `pnpm spec:check`, puis `git add specs/NNN-nom && git commit -m "docs(<module>): add validated spec NNN"`, et termine par :

> Spec validée. Prochaine étape : `/spec-plan`
