# NNN — Nom de la fonctionnalité : plan

**Statut** : Brouillon

## 1. Résumé

En trois à cinq phrases complètes : ce que l'on construit, ce que l'utilisateur pourra faire une fois les tâches terminées, comment c'est découpé (combien de tâches, dans quel ordre) et ce qui est laissé de côté.

Les mots de la spec et leur nom dans le code :

| Dans la spec | Dans le code | Ce que c'est              |
| ------------ | ------------ | ------------------------- |
| <mot>        | `<Nom>`      | <définition en une ligne> |

## 2. Fichiers par couche

Une phrase pour dire quel module on crée et lequel sert de modèle (par exemple : « On crée le module `<nom>`, organisé comme le module Disciplines : un dossier par couche. »). Puis, couche par couche, chaque fichier créé ou modifié suivi de son rôle en une phrase.

- **shared** : `packages/shared/src/<nom>.ts` contient les schémas Zod des données échangées entre l'API et le front.
- **domain** : …
- **application** : …
- **infra** : …
- **http** : … Pour chaque route : la méthode, le chemin, ce qu'elle fait et ce qu'elle renvoie.
- **web** : … (ou « rien : l'écran est hors périmètre »)

## 3. Données

Une phrase sur ce que l'on stocke. Puis chaque table, ses colonnes et ses contraintes, en disant quelle règle chaque contrainte protège. Migration : `pnpm db:generate --name=<sujet>`.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`), avec un code stable et un statut HTTP.

| Code AppError | Catégorie | HTTP | Quand                        | Scénario |
| ------------- | --------- | ---- | ---------------------------- | -------- |
| `<NOM>_…`     | CONFLICT  | 409  | <la situation, en une ligne> | AS2      |

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit.

| Scénario | Fichier de test                   | Niveau   | Ce que le test vérifie |
| -------- | --------------------------------- | -------- | ---------------------- |
| AS1      | `apps/api/test/<nom>.e2e.spec.ts` | e2e      | <le « Alors »>         |
| AS2      | `…/domain/<entité>.spec.ts`       | unitaire | <le « Alors »>         |

## 6. Tâches

Six au plus, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre (`[NNN-AS2, AS3]` s'il y en a plusieurs) ; elle tient dans un commit.

- [ ] T01 [NNN-AS1] Écrire d'abord `<fichier de test>` (« NNN-AS1: … »), puis <le code>
- [ ] T02 [NNN-AS2] Écrire d'abord `<fichier de test>` (« NNN-AS2: … »), puis <le code>
