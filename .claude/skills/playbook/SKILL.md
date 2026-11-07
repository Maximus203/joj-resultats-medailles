---
name: playbook
description: Écrit le playbook de test d'une spec validée (un scénario de playbook au moins par scénario d'acceptation, par profil, refus attendus compris) dans playbooks/NNN-nom.md, puis s'arrête pour relecture humaine. À lancer par l'utilisateur avec /playbook [specs/NNN-nom], après /spec-plan. L'exécution est celle du sous-agent testeur.
argument-hint: '[specs/NNN-nom]'
---

# /playbook : écrire le playbook de test d'une tranche

Spec demandée : $ARGUMENTS (vide = la spec au plus grand numéro `specs/NNN-*`).

## Avant de commencer

- Lis `specs/constitution.md`, le `CLAUDE.md`, `playbooks/README.md` (format, verdicts), `playbooks/profils.md` et un playbook existant (`playbooks/001-podium.md`) comme modèle de ton et de niveau de détail.
- **Si la spec n'est pas au statut `Validée`, arrête-toi** et dis-le.
- Lis `spec.md` et `plan.md` (routes, codes d'erreur, champs) : les scénarios `[API]` en citent les valeurs exactes.

## Ce que tu écris

Un fichier `playbooks/NNN-nom.md` au format du README :

1. **Un scénario de playbook au moins par scénario `ASn`** de la spec, identifié `NNN-ASn.k`. Reprends fidèlement le « Étant donné / Quand / Alors » dans Action et Attendu ; ne les reformule pas pour les rendre plus faciles.
2. **Un jumeau par surface** : `[WEB]` si un écran existe ou est prévu, `[API]` pour la route. Un écran non livré reste écrit (il sera ⏭️ à l'exécution), il n'est pas omis.
3. **Un refus attendu est un scénario `erreur`** de priorité `critique` ; ajoute les valeurs limites et les combinaisons que la spec ne détaille pas (casse, espaces, bornes, paires), en `normal`.
4. **Profil** : celui du PRD qui vit le scénario, tiré de `profils.md`. Si un profil manque, ajoute-le à `profils.md` d'abord.
5. Les champs **Observé / Verdict / Issue** restent `_(à remplir)_ / ⬜ / —`. Tu n'exécutes rien.
6. Un renvoi à `transverse.md` pour la session imprévisible. N'y copie pas ses lignes ; ajoute-y une ligne seulement si l'écran de la tranche a un geste propre à tester.

## Vérifier, puis t'arrêter

- `pnpm playbook:check NNN` doit passer.
- `pnpm format` sur les fichiers écrits.
- Commit : `docs(playbooks): add playbook NNN`. Pas de code de production, pas de modification de la spec.
- **Arrête-toi pour validation humaine** : le playbook est la spec du test, c'est l'humain qui le valide. Ne lance pas le testeur toi-même.
