---
name: tdd-task
description: Réalise les tâches d'un plan validé en TDD, une par une, avec un commit par tâche. Avec un identifiant (/tdd-task T03), seulement cette tâche ; sans argument, toutes les tâches non cochées. À lancer par l'utilisateur.
argument-hint: '[Tnn]'
---

# /tdd-task : réaliser les tâches en TDD

Tâche demandée : $ARGUMENTS (vide = toutes les tâches non cochées, dans l'ordre).

## Avant de commencer

- Lis `specs/constitution.md`, et le `CLAUDE.md` du dépôt s'il existe.
- Prends la spec au plus grand numéro `specs/NNN-*` (ou celle que l'utilisateur a nommée). Lis `spec.md` et `plan.md`.
- **Si le plan n'est pas au statut `Validé`, arrête-toi** et dis-le : il faut d'abord `/spec-plan`.
- Les tâches sont les lignes `- [ ] Tnn [NNN-ASk] …` (ou `[NNN-ASk, ASm]`) de `plan.md` (sections « Tâches » puis « Corrections »).

## Pour chaque tâche

1. **Annonce** : `Tnn [NNN-ASk] — <fichier de test>`.
2. **Test d'abord** : écris seulement le test nommé par la tâche. Son titre commence par l'identifiant : `it('NNN-ASk: …')` ; une tâche qui cite plusieurs scénarios a un test par scénario. Il vérifie le « Alors » du scénario (valeur, statut HTTP, code d'erreur), pas seulement qu'« il se passe quelque chose ».
3. **Rouge** : `pnpm tdd:red <fichier de test>`.
   - « ne se charge pas » ou « pas pour la bonne raison » : écris le squelette demandé (modules et exports typés, corps `throw new Error('non implémenté')`), puis relance.
   - « passe déjà » : le test ne prouve rien ; renforce-le.
   - N'écris pas le code de production tant que `tdd:red` n'a pas répondu « rouge pour la bonne raison ».
4. **Vert** : le code minimal qui fait passer ce test, en suivant le plan et le module `disciplines`. Puis `pnpm verify` (format, lint, types, tests liés). `pnpm format` règle le format.
5. **Refactoriser** si c'est utile, puis `pnpm verify` à nouveau.
6. **Contrôler le périmètre** : `git status --short`. Chaque fichier modifié doit appartenir à la tâche (plan, « Fichiers par couche »). Sinon, annule ce qui déborde.
7. **Commiter** : coche la tâche dans `plan.md` (`- [x]`), puis
   `git add -A && git commit -m "<type>(<module>): Tnn <résumé en anglais> (NNN-ASk)"`.
   Si lefthook échoue, corrige la cause et recommite. Jamais `--no-verify`, `-n` ni `LEFTHOOK=0`.
8. **Bilan**, une ligne : `✓ Tnn — <fichier de test> — <hash court du commit>`.

## En cas de blocage

Après **deux échecs** sur la même tâche (rouge impossible à obtenir, vert impossible, verify ou commit qui échoue encore après une correction), arrête-toi. Ne passe pas à la tâche suivante. Explique : ce que tu as essayé, l'erreur exacte, et ce qu'il faudrait décider (changer le plan, découper la tâche…).

Ne modifie ni `spec.md` ni les tâches d'un plan validé pour te débloquer : c'est à l'humain de trancher.

## À la fin

Quand il ne reste aucune tâche non cochée, termine par :

> Toutes les tâches sont faites. Prochaine étape : `/converge`
