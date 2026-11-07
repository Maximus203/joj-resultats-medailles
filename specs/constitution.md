# Constitution

Six principes, lus par chaque skill (`/prd`, `/spec`, `/spec-plan`, `/tdd-task`, `/converge`). Le CLAUDE.md du dépôt, s'il existe, s'applique aussi ; les skills ne le répètent pas.

1. **Le PRD dit pour qui et pourquoi, et découpe en tranches. La spec dit le quoi d'une tranche, sans technique. Le plan dit le comment.**
   La vision du PRD est celle de l'humain : l'agent la challenge, il ne l'invente pas. Pas de besoin dans `spec.md` hors de sa tranche ; pas de route, de table ni de composant dans `spec.md` ; pas de nouveau besoin dans `plan.md`.

2. **Test d'abord.**
   Aucun code de production sans un test vu en échec pour la bonne raison : `pnpm tdd:red <fichier>` le prouve.

3. **Chaque scénario d'acceptation a un test dont le titre commence par son identifiant.**
   `it('001-AS2: rejects a full slot', …)`. `pnpm spec:check <spec> --trace` le vérifie.

4. **`domain/` reste en TypeScript pur ; les controllers sont fins ; toute erreur métier est une `AppError`.**
   Le module `disciplines` sert de modèle.

5. **Une tâche = un commit Conventional Commits qui cite la tâche et son scénario.**
   `feat(benevoles): T03 refuse a full slot (001-AS2)`. Jamais de `--no-verify`.

6. **Celui qui produit ne valide pas.**
   Le sous-agent `relecteur` relit avec un contexte vierge : la base git et le dossier de la spec, rien d'autre.
