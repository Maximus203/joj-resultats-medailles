# AGENTS.md

Instructions communes à Claude Code, Codex et Copilot pour ce dépôt (JOJ Dakar 2026 : résultats et médailles). Commandes, architecture, mode de travail et livraison : `CLAUDE.md`.

<!-- >>> artist-signature >>> -->

## Signature l'Artist

Le code est une œuvre signée. L'objectif n'est pas de produire du code vite : c'est de
maximiser la qualité, la maintenabilité, la scalabilité, la sécurité et la valeur métier.

Trois temps, non négociables : **on réfléchit avant de coder**, **on code selon trois
lois**, **on ne livre rien sans l'avoir éprouvé**. Une garde humaine au bout.

> La doctrine dit _comment_ travailler. Le **niveau d'exigence** (UX, performance,
> disponibilité, sécurité, ambition design) est fixé par le **Brief Fondateur §3**.
> Doctrine = méthode ; Brief = la barre à franchir.

---

## Avant de coder — pourquoi, contexte, architecture

Ne jamais ouvrir un fichier de code avant d'avoir répondu à ça. Et si une ambiguïté
risque de te faire produire le mauvais truc : **tranche en énonçant ton hypothèse** —
pas une avalanche de questions. On ne fait pas la navette.

### Pourquoi (produit avant technique)

- Quel objectif métier ? Quel utilisateur final ? Quels critères de succès et d'acceptation ?
- Réponds à « **pourquoi on construit ça ?** » avant « comment ? ».

### Contexte (jamais à l'aveugle)

- Lire la structure, les conventions, les patterns déjà en place, les dépendances, la doc.
- **N'introduis jamais un pattern incohérent** avec le code existant.
- S'il manque du contexte qui changerait la solution, dis explicitement lequel manque.

### Architecture (avant la première ligne)

- Composants, responsabilités, frontières, flux de données.
- Points de montée en charge, points d'extension futurs.
- **L'architecture se pose avant le code**, pas après.

---

## Les trois lois

### 1. Ne te répète pas

- Avant d'écrire, cherche si la logique, le composant ou le style existe déjà. Réutilise — ne recopie pas.
- Factorise par les patterns : back → Repository / Service / Action ; front → composants et hooks réutilisables.
- Une règle métier vit à **un seul endroit**.

### 2. Centralise tout

- **Zéro valeur en dur.** Aucune couleur, taille, URL, clé ou chaîne magique dispersée dans le code.
- Couleurs, espacements, typographie → tokens / thème central.
- Configuration → variables d'environnement ou fichier de config unique. Jamais en dur dans un composant.
- Si une valeur peut changer selon l'environnement, elle est centralisée, pas répétée.

### 3. Aucun log fantôme

- Pas de `console.log` ni de log sauvage laissé dans le code.
- Tout logging passe par **un wrapper unique** qui respecte l'environnement : verbeux en dev, silencieux ou structuré en prod.
- Un log non gouverné par l'environnement est un bug, pas un oubli.

> **Craft, par-dessus les trois lois :** SOLID, séparation des responsabilités, noms clairs,
> et **pas de complexité gratuite**. Le code le plus simple qui tient les exigences gagne.

---

## Workflow de livraison d'une fonctionnalité

Tu codes **et** tu testes ce que tu codes. Comportement de base, pas une option. On ne
prompte pas une fonctionnalité morceau par morceau : tu la mènes jusqu'au bout, seul.
**Ne saute aucune étape.** Chaque étape ci-dessous, c'est une casquette différente
(produit, archi, back, front, QA, sécurité, perf, revue) — porte-les une par une,
sérieusement, pas en survol.

1. **Code** la fonctionnalité en respectant les trois lois et le craft.
2. **Teste en code** : unit + intégration + **cas limites** + **cas négatifs**. Pars du
   principe que toute fonctionnalité finira par casser, et conçois les tests pour ça. Du rouge au vert.
3. **Teste dans le navigateur** — boucle, voir le skill `browser-validation`. Parcours
   réellement la fonctionnalité comme l'utilisateur. Tant qu'il reste une barrière (bug
   fonctionnel, friction UX, défaut UI, incohérence visuelle), corrige et recommence.
4. **Vérifie la console** une fois le parcours fluide : erreurs **et** warnings, requêtes
   réseau échouées. La moindre alerte cachée → corrige et reboucle. Zéro erreur cachée.
5. **Revue sécurité** : authentification, autorisation, validation des entrées, gestion des
   secrets, injections, exposition de données. Signale le risque **avant** de passer la main.
6. **Revue performance** : requêtes base de données, mémoire, appels réseau, complexité
   algorithmique. Repère les goulots avant qu'ils n'atteignent la prod.
7. **Auto-revue senior** : relis ton propre code comme un reviewer exigeant — bugs, dette
   technique, anti-patterns, occasions de refactor. **Ne suppose jamais que ton code est correct.**
8. **Documente** ce qui ne se lit pas dans le code : décisions, hypothèses, arbitrages,
   limites. Un dev qui arrive après doit comprendre sans poser de question.
9. **Passe la main** seulement quand le parcours est utilisable par un humain sans **aucune**
   barrière, que la console est propre, et que les revues 5-7 sont passées.

---

## Garde humaine

- Rien n'est « fait » sans ma validation finale. Mon test n'est qu'un **filet de sécurité** : tout doit déjà avoir été testé en code et dans le navigateur.
- **Aucun push en production sans mon feu vert explicite.**

<!-- <<< artist-signature <<< -->

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

<!-- >>> artist-agents >>> -->

## Agents disponibles pour ce projet (`$CLAUDE_AGENTS_ROOT`)

- `cherif` — orchestrateur : cadre la mission, route, fait respecter les contrats de passage. Voir `$CLAUDE_AGENTS_ROOT/cherif.md`.
- `ibrahima` — développeur senior et architecte : conçoit et code en TDD. Voir `$CLAUDE_AGENTS_ROOT/ibrahima.md`.
- `sofia` — directrice artistique : avant toute interface nouvelle ou refonte. Voir `$CLAUDE_AGENTS_ROOT/sofia.md`.
- `cherif-qa` — testeur sceptique : joue les playbooks puis l'imprévisible, ne corrige jamais. Voir `$CLAUDE_AGENTS_ROOT/cherif-qa.md`.
- `relecteur` — relecteur indépendant local au projet, contexte vierge, ne modifie rien. Voir `.claude/agents/relecteur.md`.

<!-- <<< artist-agents <<< -->
