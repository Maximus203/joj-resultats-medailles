# Prise en main : comprendre et utiliser Claude Code

**Durée** : 30 min. **Objectif** : savoir à quoi sert chaque fonctionnalité de Claude Code, et l'avoir utilisée sur ce dépôt. Chaque manipulation part d'un problème : ce que l'agent fait mal si on le laisse faire, et ce qui le corrige. Le cycle `/spec` des ateliers B et C n'est pas au programme.

**Avant de commencer**, lis [README.md](README.md) et le [glossaire](GLOSSAIRE.md) de ce dossier : ils donnent les mots du projet (couche, cas d'usage, `AppError`…) que Claude emploie dès la première manipulation.

Lance `claude --permission-mode manual` à la racine du dépôt, après `pnpm install`. Si `claude --version` est antérieure à 2.1.283, lance d'abord `claude update`.

Vérifie « manual mode on » sous la zone de saisie : toute la prise en main se fait en mode Manuel, sinon les manipulations 3, 6 et 8 ne se déroulent pas comme prévu.

Avant la première manipulation, dans ton dépôt (le fork créé à la Mission 0), crée ta branche de la journée et envoie-la sur GitHub : `git switch -c journee`, puis `git push -u origin journee`. Tout ce que tu feras aujourd'hui (prise en main, `CLAUDE.md`, ateliers B et C) y sera commité.

Avant chaque manipulation : `git status` doit être propre (sinon `git stash -u`).

## 1. Référence @fichier (3 min)

**Problème** : l'agent ne regarde pas les bons fichiers.

1. Garde le [glossaire](GLOSSAIRE.md) ouvert. Demande : « Explique l'architecture de ce dépôt : les applications, et les couches d'un module de l'API. »
2. Puis : « Que vérifie `@apps/api/src/modules/disciplines/domain/discipline.ts` ? » (`@` attache le fichier : tape `@disc` et choisis-le dans la liste).

**Réussi si** tu sais nommer les quatre couches d'un module (domain, application, infra, http) et le fichier où une `AppError` devient une réponse HTTP.

## 2. Plan mode (4 min)

**Problème** : il part trop vite dans le code.

1. Passe en plan mode : depuis le mode Manuel, deux pressions sur `Maj+Tab` (`Shift+Tab`), jusqu'à voir « plan mode » sous la zone de saisie.
2. **Tâche A** : « Ajoute `GET /api/disciplines/:id/similaires` : les autres disciplines de la même catégorie, triées par nom, sans la discipline elle-même. Si l'id est inconnu, 404. Quels fichiers, quel test d'abord ? »
3. Lis le plan, pose une question dessus, puis refuse de l'exécuter. Sors du plan mode : appuie sur `Maj+Tab` jusqu'à revoir « manual mode on » (une seule pression mène en auto).

**Réussi si** le plan nomme les fichiers de chaque couche et le test à écrire, que `git status` ne montre aucun changement, et que tu es revenu en Manuel. Cette tâche sera construite à l'[atelier A](ATELIER-A.md), avec ton `CLAUDE.md`.

## 3. Confier et relire (7 min)

**Problème** : il se déclare fini sans vérifier.

1. **Tâche B**, avec un critère de vérification à la fin : « Ajoute `GET /api/disciplines/par-categorie` : pour chacune des cinq catégories, le nombre de disciplines, y compris les catégories qui n'en ont aucune (0). Suis le module `disciplines` : un cas d'usage, un controller fin, un test e2e dans `apps/api/test/`. Lance les tests et corrige. »
2. Relis le diff (`git diff`, ou demande « montre-moi le diff ») : le controller est-il fin ? une catégorie à 0 est-elle testée ? Si quelque chose ne va pas, refuse et dis à Claude quoi corriger.
3. Quand le diff te convient, demande : « commite avec un message Conventional Commits ». Lis la commande avant d'accepter, puis `git push`. La demande d'accord n'apparaît qu'en Manuel : en auto, le commit peut passer sans question.

**Réussi si** `pnpm test` est vert, `git log --oneline` montre le commit de Claude, et tu as lu le diff avant de l'accepter.

## 4. Échap et /rewind (4 min)

**Problème** : il part dans la mauvaise direction.

1. **Tâche C** : « Trie la liste des disciplines côté front : par catégorie, puis par nom. »
2. Dès que Claude commence à modifier un fichier, appuie sur `Échap`. Redirige : « Seulement dans `discipline-list.tsx`, sans toucher à l'API. »
3. Tape `/rewind` (ou `Échap Échap` sur une zone de saisie vide) et choisis le message d'avant la tâche C (« Trie la liste des disciplines… »). Dans le menu, prends **Restore code and conversation** (la première option) : **Restore conversation** remet seulement l'échange en arrière et laisse les fichiers modifiés. `/rewind` n'annule que ce que Claude a modifié avec ses outils d'édition ; s'il est passé par une commande shell, ou si un fichier reste modifié, `git restore .` fait le travail hors de Claude.

**Réussi si** après `/rewind`, `git status` ne montre plus les fichiers de la tâche C, tu sais dire la différence entre `Échap` (interrompre) et `/rewind` (revenir en arrière), et ce que restaure chacune des trois premières options du menu.

## 5. Contexte (3 min)

**Problème** : il sature et oublie le début de la conversation.

1. `/context` : note la part du contexte utilisée (la ligne `56.2k/…`, par exemple : la taille totale dépend du modèle). Un token est un morceau de mot : 1 000 tokens font environ 700 mots.
2. `/compact` : la conversation est résumée. Tu peux lui donner une consigne : `/compact garde les décisions sur la tâche B`. Relance `/context` et compare la ligne **Messages** : c'est la seule qui baisse.
3. `/clear`, puis demande « quelle route as-tu planifiée à la tâche A ? ». Claude ne s'en souvient plus : le plan n'a jamais été écrit dans le dépôt. La route de la tâche B, elle, est commitée : il la retrouve en lisant le code. Seul ce qui est écrit dans le dépôt survit à `/clear` : c'est le rôle du `CLAUDE.md` de l'atelier A.

Comment lire `/context` : la grille de symboles est une jauge (une case, environ 1 %), et le détail par catégorie se lit ainsi :

| Ligne                              | Ce que c'est                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| System prompt, System tools        | les instructions de Claude Code et la description de ses outils (lire, modifier, lancer une commande) |
| MCP tools, MCP server instructions | les outils de services externes branchés à Claude ; absentes si tu n'en as pas                        |
| Custom agents                      | les sous-agents disponibles, dont le `relecteur` du dépôt (`.claude/agents/`)                         |
| Skills                             | le nom et la description de chaque skill ; leur contenu n'est chargé que quand on les appelle         |
| Messages                           | la conversation : tes messages, ses réponses, et surtout ce que ses outils ont lu (fichiers, sorties) |
| Free space                         | la place libre                                                                                        |
| Autocompact buffer                 | une réserve : quand la conversation l'atteint, Claude lance `/compact` tout seul                      |

Tout ce qui précède **Messages** est chargé avant ton premier message, et ne bouge pas avec `/compact` ni `/clear`.

**Réussi si** tu sais quand utiliser chacune : `/compact` pour continuer la même tâche, `/clear` pour en commencer une autre.

## 6. Permissions (3 min)

**Problème** : il peut lancer une action risquée.

Rappel : tu dois voir « manual mode on » sous la zone de saisie. `Maj+Tab` fait défiler les quatre modes : auto, Manuel, accepter les modifications, plan. Les règles de `.claude/settings.json` valent dans tous les modes, y compris en auto.

1. Dans ton terminal (pas dans Claude) : `mkdir tmp-exercice` puis crée un fichier factice dedans (`tmp-exercice/notes.txt`).
2. Demande à Claude : « Supprime le dossier `tmp-exercice/`, puis réinstalle les dépendances. »
3. Claude demande la permission, en une ou deux fois. Lis la commande en entier avant de répondre : un `&&` enchaîne deux actions dans une seule demande. **Refuse** (`No`), et dis-lui pourquoi. Ne choisis jamais « Yes, and don't ask again » sans y penser : la règle est enregistrée dans `.claude/settings.local.json`, et Claude ne te demandera plus rien pour ces commandes (`/permissions` pour la retirer).
4. Ouvre `/permissions` : retrouve les commandes autorisées sans confirmation (`pnpm verify`, `pnpm test`, `pnpm spec:*`, `pnpm tdd:*`) et constate que ni `rm` ni `pnpm install` n'y sont. Supprime toi-même `tmp-exercice/`.

**Réussi si** le dossier n'a pas été supprimé par Claude, et tu sais où une permission est accordée (`.claude/settings.json`) ou refusée.

## 7. Skills (2 min)

**Problème** : il refait une procédure à sa façon, différente à chaque fois.

1. Ouvre `.claude/skills/spec/SKILL.md`. En tête, `description` dit quand l'utiliser ; le reste est la procédure, étape par étape.
2. Cherche l'étape où la skill s'arrête pour attendre ta validation.

**Réussi si** tu sais dire ce qu'est une skill : une procédure écrite, que l'agent suit quand on l'appelle (`/spec`, `/tdd-task`). Tu les utiliseras aux ateliers B et C.

## 8. Hooks (2 min)

**Problème** : il « oublie » une règle obligatoire.

1. Demande à Claude : « fais un commit vide (`--allow-empty`) avec **exactement** le message `ajout compteur`, sans le modifier ».
2. Le hook refuse la commande, et Claude affiche son explication. S'il propose un autre message, **refuse** la permission (`No`) : le but est de voir le refus, pas de faire le commit.
3. Ouvre `.claude/settings.json`, rubrique `hooks` : retrouve le script qui vient de refuser le commit.
4. Facultatif (1 min) : passe en auto (`Maj+Tab`) et redemande le même commit vide avec le message `ajout compteur`. Le hook refuse quand même. Reviens en Manuel (`Maj+Tab` jusqu'à « manual mode on »).

Ce hook ne contrôle que les commandes de Claude : le même commit, tapé par toi, passerait. Le hook git du dépôt (`lefthook.yml`), lui, s'applique à tout le monde, mais il vérifie le code (format, lint, types, tests), pas le message.

**Réussi si** tu sais dire ce qu'est un hook : un script qui s'exécute tout seul, à un moment précis, et qui s'impose à l'agent, qu'il y pense ou non ; tu sais dire à qui s'applique chacun des deux hooks du commit ; et tu sais dire pourquoi un hook s'impose même en auto.

## 9. Sous-agent (2 min)

**Problème** : il se relit mal lui-même.

1. Ouvre `.claude/agents/relecteur.md` : son rôle, ses outils (lecture seule), et ce qu'on ne lui transmet pas (le résumé et l'avis de l'auteur).

**Réussi si** tu sais dire ce qu'est un sous-agent : un second agent, avec son propre rôle et son propre contexte. `/converge` le lance aux ateliers B et C pour relire ton travail.

## Quiz (2 min)

« Quelle différence entre une skill et un hook ? À quel problème répond chacun ? »

## Et ensuite

L'[atelier A](ATELIER-A.md) : écrire le `CLAUDE.md` du projet. Sa vérification construit la tâche A, cette fois sans consignes techniques : c'est ton `CLAUDE.md` qui les donne.
