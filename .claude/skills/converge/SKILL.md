---
name: converge
description: Vérifie qu'une fonctionnalité est terminée (traçabilité scénario → tests, pnpm check, relecture indépendante). Répond « Converged » et passe la spec à Implémentée, ou ajoute les manques comme nouvelles tâches. À lancer par l'utilisateur avec /converge après /tdd-task.
argument-hint: '[specs/NNN-nom]'
---

# /converge : vérifier et conclure

Spec visée : $ARGUMENTS (par défaut, le plus grand `specs/NNN-*`).

## 1. Préparer

- Lis `specs/constitution.md`, et le `CLAUDE.md` du dépôt s'il existe. Lis `spec.md` et `plan.md`.
- S'il reste des tâches non cochées dans `plan.md`, arrête-toi : il faut d'abord `/tdd-task`.
- Compte les sections `### Passage N` sous « Corrections » de `plan.md`. **S'il y en a déjà 2**, arrête-toi : résume les écarts encore ouverts et demande à l'humain de trancher (accepter, changer la spec, ou corriger à la main).

## 2. Vérifier

Lance, et garde les sorties :

1. `pnpm spec:check specs/NNN-nom --trace` : chaque scénario a un test, aucun test ne cite un scénario absent.
2. `pnpm check` : format, lint, types, tous les tests, build.

## 3. Faire relire

Trouve la base : le commit qui précède l'ajout de la spec, pour que le relecteur ne voie que cette fonctionnalité, même si la branche en contient d'autres.

```bash
git log --diff-filter=A --format=%h -1 -- specs/NNN-nom/spec.md
```

La base est ce hash suivi de `^` (par exemple `3f2a1c9^`). Si la commande ne renvoie rien (spec jamais commitée), la base est `main`.

Lance le sous-agent `relecteur` avec **seulement** ce message :

> Base : <base>. Spec : specs/NNN-nom.

Ne lui donne ni résumé, ni liste de fichiers, ni ton avis. Il rend un verdict : `Converged`, ou des écarts bloquants avec fichier et ligne.

## 4. Conclure

**Si les deux commandes sont vertes et que le verdict est `Converged`** :

- `**Statut** : Implémentée` dans `spec.md`, puis `pnpm spec:check specs/NNN-nom` ;
- `git add -A && git commit -m "docs(<module>): mark spec NNN as implemented"` ;
- réponds par le mot **Converged**, suivi de la matrice scénario → tests.

**Sinon** :

- ajoute à la fin de `plan.md` (en créant `## 7. Corrections` si besoin) une section `### Passage N` ;
- une tâche par manque, numérotée à la suite (`- [ ] T07 [NNN-AS2] Écrire d'abord … puis …`), qui cite le scénario concerné (pour une hypothèse des « Questions ouvertes », le scénario dont elle relève) et la preuve (commande en échec, ou fichier:ligne du relecteur) ;
- `pnpm spec:check specs/NNN-nom`, puis `git add -A && git commit -m "docs(<module>): add corrections from converge pass N"` ;
- termine par :

> Pas encore convergé : N tâche(s) ajoutée(s). Prochaine étape : `/tdd-task`, puis `/converge`
