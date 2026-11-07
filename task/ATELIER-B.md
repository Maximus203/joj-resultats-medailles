# Atelier B : de la spécification au code

**Durée** : 1 h.

**Ce que tu construis** : l'application Bénévoles, tranche par tranche. Le PRD décrit le produit complet en trois tranches ; tu implémentes ensuite une spec par tranche, dans l'ordre. L'objectif de l'atelier est la tranche 1 : ouvrir un créneau pour une discipline, y inscrire un bénévole, et refuser toute inscription sur un créneau complet. Les tranches 2 et 3 suivent, si tu as le temps.

**Ce que tu utilises** :

- les cinq commandes du cycle : `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge` ;
- la [grille de relecture](GRILLE-RELECTURE.md), avant chaque « je valide » ;
- ton `CLAUDE.md` de l'atelier A, que Claude lit tout seul.

Claude écrit le code. Ton travail : donner le besoin, relire et valider le PRD, la spec puis le plan, et vérifier le résultat. **Ton coach construit avec toi** : il fait chaque étape à l'écran en même temps que toi, et s'arrête avec toi à chaque « je valide ». C'est la répétition de l'atelier C : même cycle, sur un sujet imposé et plus petit.

## Le besoin

**Pourquoi.** Chaque discipline a besoin de bénévoles pour accueillir le public et aider à l'organisation. Les responsables ouvrent des créneaux, et les bénévoles s'y inscrivent. Aujourd'hui tout se fait sur papier, et des créneaux débordent.

**Les trois tranches du produit.**

| Tranche | Ce que l'on peut faire                                                                                                                                   | Règle métier                                                                                                | Spec  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| `TR1`   | Ouvrir un créneau pour une discipline existante (début, fin après le début, capacité d'au moins 1), et y inscrire un bénévole avec son nom et son email. | On n'inscrit personne sur un créneau complet : refus `409`, code `SLOT_FULL`.                               | `001` |
| `TR2`   | Consulter un créneau : ses horaires, sa capacité, ses places restantes et ses inscrits dans l'ordre d'inscription.                                       | On n'inscrit pas deux fois le même email sur un créneau : refus `409`, code `VOLUNTEER_ALREADY_REGISTERED`. | `002` |
| `TR3`   | Se désinscrire d'un créneau, et faire tout cela depuis un écran de l'application web : voir un créneau, s'y inscrire, s'en désinscrire.                  | On ne désinscrit que quelqu'un d'inscrit : refus `404`, code `VOLUNTEER_NOT_REGISTERED`.                    | `003` |

**Un exemple pour relire les scénarios.** Un créneau de Lutte, le 2 novembre 2026 de 9 h à 12 h, avec une capacité de 2.

1. Awa s'inscrit : c'est accepté, il reste 1 place.
2. Moussa s'inscrit : c'est accepté, il ne reste aucune place.
3. Fatou essaie de s'inscrire : c'est refusé, avec `SLOT_FULL`.

**Hors périmètre** : la modification ou la suppression d'un créneau, l'envoi d'un email de confirmation, les comptes des bénévoles.

## Les étapes

Chaque commande s'arrête et attend ta réponse avant l'étape suivante. Les trois « je valide » sont ton vrai travail : ce que la spec oublie, aucun test ne le vérifiera. Une seule réponse « non » à la grille suffit pour ne pas valider : dis à Claude ce qui manque, puis relis.

### 1. Préparer ton dépôt (2 min)

1. `git status` : l'arbre est propre, sur la branche `journee`, avec ton `CLAUDE.md` commité.
2. `/clear` dans Claude, pour repartir d'une conversation vide.

### 2. Le PRD du produit complet : `/prd` (8 min)

1. Colle ce texte tel quel :

   ```
   /prd Bénévoles. Problème : chaque discipline a besoin de bénévoles pour accueillir le public ; les responsables de discipline gèrent les inscriptions sur papier, et des créneaux débordent. Utilisateurs : le responsable de discipline, qui ouvre des créneaux, et le bénévole, qui s'y inscrit. Proposition : le responsable ouvre un créneau avec une capacité, les bénévoles s'y inscrivent, et l'application refuse toute inscription au-delà de la capacité. Succès : pendant la démo, un créneau de capacité 2 accepte deux bénévoles et refuse le troisième. Tranche 1 : ouvrir un créneau et y inscrire un bénévole, jamais au-delà de la capacité. Tranche 2 : consulter un créneau et ses inscrits, sans inscrire deux fois le même email. Tranche 3 : se désinscrire d'un créneau, et un écran pour voir un créneau, s'y inscrire et s'en désinscrire. Hors périmètre : la modification ou la suppression d'un créneau, les emails de confirmation, les comptes des bénévoles.
   ```

2. Claude écrit `specs/prd-<nom>.md` et te donne ses objections. Le texte couvre chaque section : il ne devrait pas poser de question.
3. Relis le PRD avec les cinq questions PRD de la grille.
4. Vérifie qu'il a trois tranches, `TR1`, `TR2` et `TR3`, puis écris « je valide ».

### 3. La spec de la tranche 1 : `/spec TR1` (12 min)

1. Colle ce texte tel quel :

   ```
   /spec TR1 Bénévoles : ouvrir un créneau (début, fin, capacité maximale d'au moins 1) pour une discipline existante, et inscrire un bénévole (nom, email) sur ce créneau. On ne peut pas inscrire quelqu'un sur un créneau complet : refus 409 avec le code SLOT_FULL. Pas d'écran : seulement l'API.
   ```

2. Claude écrit `specs/001-<nom>/spec.md` : des scénarios `AS1`, `AS2`… au format Étant donné / Quand / Alors.
3. Relis avec les questions spec de la grille. La spec doit au moins dire ce qui se passe quand :
   - on inscrit quelqu'un normalement (le cas nominal) ;
   - on inscrit quelqu'un sur un créneau complet (`409`, `SLOT_FULL`) ;
   - on inscrit quelqu'un sur un créneau qui n'existe pas ;
   - on inscrit la dernière personne d'un créneau (la place restante passe à 0, sans refus) ;
   - la capacité vaut 0, ou la fin n'est pas après le début.
4. Fais corriger ce qui manque, puis écris « je valide ».

### 4. Le plan : `/spec-plan` (8 min)

1. Lance `/spec-plan`. Claude écrit `plan.md` : fichiers par couche, tables, erreurs, un test par scénario, six tâches au plus.
2. Relis avec les questions plan de la grille : `SLOT_FULL` est en `409`, chaque scénario a un test prévu, les fichiers suivent le module `disciplines`.
3. Écris « je valide ».

### 5. Le code : `/tdd-task` (15 min)

1. Lance `/tdd-task`. Pour chaque tâche, Claude écrit le test, prouve qu'il échoue (`pnpm tdd:red`), écrit le code, vérifie (`pnpm verify`) et commite.
2. Regarde passer les tâches. Tu peux interrompre avec `Échap`, puis lancer une seule tâche avec `/tdd-task T02`.

### 6. La vérification : `/converge` (10 min)

- **Toutes les tâches sont cochées** : lance `/converge`. Il lance `pnpm spec:check --trace` et `pnpm check`, puis fait relire la branche par le sous-agent `relecteur`. S'il ajoute des tâches de correction, relance `/tdd-task`, puis `/converge`. C'est fini quand il répond **Converged** : la spec passe au statut `Implémentée`.
- **Il reste des tâches** : ne force pas. Demande à Claude « relis cette branche avec le relecteur » : le sous-agent relit ce qui est fait et dit ce qui manque. Tu finiras pendant la pause déjeuner.

### 7. Sauvegarder (5 min)

1. `git log --oneline` : un commit par tâche, chacun avec un message qui cite sa tâche et son scénario (par exemple `feat(volunteers): T03 refuse a full slot (001-AS2)`).
2. `pnpm spec:check specs/001-<nom> --trace` : chaque scénario pointe vers au moins un test.
3. `git push` : ton travail est sauvegardé sur ton dépôt GitHub avant la pause.

**Réussi si** le PRD est validé avec trois tranches, la spec `001` a un scénario pour le cas nominal et un pour le créneau complet, elle passe la grille de relecture, le plan prévoit `SLOT_FULL` en `409`, et `/converge` répond « Converged ».

## Les tranches suivantes

Le PRD est déjà validé : pour chaque tranche, `/clear`, puis reprends à l'étape 3 avec le texte de la tranche, et va jusqu'à `/converge`.

**Tranche 2** (spec `002`) :

```
/spec TR2 Bénévoles, suite : consulter un créneau avec ses horaires, sa capacité, ses places restantes et ses inscrits dans l'ordre d'inscription. On ne peut pas inscrire deux fois le même email sur un créneau, sans tenir compte des majuscules (awa@joj.sn et Awa@JOJ.sn sont le même email) : refus 409 avec le code VOLUNTEER_ALREADY_REGISTERED. Pas d'écran : seulement l'API.
```

**Tranche 3** (spec `003`) :

```
/spec TR3 Bénévoles, fin : un bénévole se désinscrit d'un créneau avec son email, et sa place se libère. Désinscrire un email qui n'est pas inscrit sur ce créneau : refus 404 avec le code VOLUNTEER_NOT_REGISTERED. Un écran dans l'application web montre un créneau (horaires, places restantes, inscrits) et permet de s'y inscrire et de s'en désinscrire ; il affiche le refus quand le créneau est complet.
```

## Si ça bloque

- **`/tdd-task` s'arrête après deux échecs sur une tâche** : lis son explication. Le plus souvent, la tâche est trop grosse ou le plan est ambigu. Corrige le plan à la main, puis relance `/tdd-task Tnn`.
- **`/converge` en est à son deuxième passage sans converger** : il s'arrête et te demande de trancher. Tu peux accepter l'écart, changer la spec, ou appeler ton coach.
- **Un commit est refusé** : lis le message du hook. Il dit ce qui ne va pas (format, lint, test, message de commit). N'utilise jamais `--no-verify`.
- **Claude demande une permission inattendue** (supprimer des fichiers, `pnpm install`) : refuse, et demande-lui pourquoi il en a besoin.
- **Bloqué plus de 10 minutes** : appelle ton coach.

Pour le détail des commandes, voir la section « Méthode » du [README](../README.md#méthode).
