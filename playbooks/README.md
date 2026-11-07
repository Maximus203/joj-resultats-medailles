# Playbooks de test

Un playbook est un fichier Markdown qui décrit comment **jouer** les scénarios d'acceptation d'une tranche sur l'application réelle. Les scénarios de la spec (`specs/NNN-nom/spec.md`) disent _quoi_ ; le playbook dit _comment le constater_, profil par profil. Il est exécuté par le sous-agent [`testeur`](../.claude/agents/testeur.md), qui remplit ce qu'il observe.

| Fichier                          | Rôle                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| [`profils.md`](profils.md)       | les profils testés et leur point d'entrée                        |
| [`transverse.md`](transverse.md) | la session « utilisateur imprévisible », valable pour tout écran |
| `NNN-nom.md`                     | un playbook par tranche, dérivé de `specs/NNN-nom/spec.md`       |

## Lancer une campagne

```bash
pnpm playbook:check          # format et couverture des scénarios, sans navigateur
```

Puis demander au sous-agent : « lance le testeur sur `playbooks/001-podium.md` » (ou sur `specs/001-podium`). Il démarre `pnpm dev`, joue chaque scénario dans un vrai navigateur, écrit **Observé / Verdict** dans le fichier et dépose les captures dans `.test-shots/` (ignoré par git). Écrire un playbook : `/playbook specs/NNN-nom`.

## Format

```markdown
# NNN — Titre

> Spec : specs/NNN-nom · Statut : ⬜ · Build : — · Testé : —

## Préconditions

- ...

## Scénarios

### NNN-ASn.k — [WEB] Titre du scénario

**Profil** : journaliste
**Priorité** : critique | normal | secondaire
**Technique** : nominal | erreur | valeurs-limites | partition-équivalence | table-décision | transition-état
**Action** : ce que fait le testeur, par l'écran
**Attendu** : ce qu'il doit voir (repris du « Alors » de la spec)
**Vérif [BE]** : (facultatif) contrôle après coup : réponse HTTP, base, logs
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
```

- **Identifiant** : `NNN-ASn.k` — `NNN-ASn` est le scénario de la spec, `.k` numérote les variantes (`.1` écran, `.2` API, …). `pnpm playbook:check` exige au moins un scénario de playbook par scénario de la spec.
- **Surface** : `[WEB]` écran dans un navigateur · `[API]` requête HTTP · `[BE]` base ou logs.
- **Profil** : un identifiant de `profils.md`.
- **Le testeur ne touche jamais** à Action, Attendu, Vérif : ils sont la spec. Il écrit Observé, Verdict, Issue et l'en-tête (`Statut`, `Build`, `Testé`).
- **Un refus attendu est un test** : `Technique : erreur`. S'il réussit, c'est un ❌.

## Verdicts

| Symbole | Sens                                                     |
| ------- | -------------------------------------------------------- |
| ⬜      | non testé                                                |
| ✅      | vu fonctionner, preuve à l'appui                         |
| 🟡      | fonctionne, avec un défaut mineur ou d'ergonomie         |
| ❌      | KO                                                       |
| ⏭️      | non jouable (écran non livré, etc.), raison dans Observé |

Statut d'en-tête : ❌ si au moins un ❌ ; sinon 🟡 si au moins un 🟡 ; sinon ✅ si tout est ✅ ou ⏭️ ; sinon ⬜.

## Règles

- Données créées par l'interface, jamais injectées en base ; build frais ; la fausse API des mocks ne prouve pas un scénario `[WEB]`.
- Mobile d'abord : 375 px, 320 px, puis desktop.
- Celui qui a écrit le code ne joue pas le playbook : c'est le `testeur`, avec un contexte vierge.
