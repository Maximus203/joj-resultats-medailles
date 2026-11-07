# 001 — Podium : les états de la maquette « Cachet »

> Spec : specs/001-podium · Statut : 🟡 · Build : journee @177f1eb + maquettes non commitées (le développeur a modifié les 4 pages et cachet.css pendant la campagne, dernière modif 16:48 ; version rejouée en fin de campagne : sha1 01=007eb987 02=64688a2d 03=8b83d0d4 04=abe31720 css=e94904ca) · Testé : 2026-11-07
> Surfaces : [WEB] · Profils : journaliste, supporter

Ce playbook joue la **maquette statique** (`specs/design/maquettes/`) servie sur `http://127.0.0.1:3500/`, pas l'application. Il vérifie que chaque scénario d'acceptation de la spec 001 a son état à l'écran, lisible et accessible, avant l'implémentation. Il ne remplace pas `001-podium.md`, qui joue l'application réelle.

## Préconditions

- Serveur statique : `python -m http.server 3500 --bind 127.0.0.1` lancé dans `specs/design/maquettes`. Pas de `pnpm dev`.
- Page de saisie : `http://127.0.0.1:3500/01-saisie-podium.html`. Les états se basculent par l'ancre : `#vide`, `#invalide`, `#regle`, `#conflit`, `#chargement`, `#succes`, `#horsligne`. Le formulaire ne s'envoie pas (maquette) : on constate l'état, pas l'enregistrement.
- Mobile d'abord : 375 px, puis 320 px, puis desktop.

## Scénarios

### 001-AS1.4 — [WEB] L'état « podium enregistré » montre le podium relisible

**Profil** : journaliste
**Priorité** : critique
**Technique** : nominal
**Action** : ouvrir `01-saisie-podium.html#succes` à 375 px.
**Attendu** : un message de succès (`role=status`) dit que le podium est enregistré ; le podium relu montre l'épreuve, sa discipline, son jour et les trois médaillés avec médaille et pays (Or, Argent, Bronze) ; une action propose d'en enregistrer un autre.
**Observé** : Joué à 375 px puis 320 px, thème clair (`?theme=light`) puis sombre. Bandeau « Podium enregistré. Relisez-le : c'est ce que le public voit. » en `role=status` (seul `status` visible) ; podium relu « Lutte filles 52 kg · Lutte · jeudi 5 novembre 2026 » avec Or SEN, Argent JPN, Bronze FRA (pastille + libellé + plaque : la couleur n'est pas le seul signal) ; boutons « Enregistrer un autre podium » (mène à `#vide`, formulaire revenu) et « Voir les résultats du 5 novembre ». Aucun débordement horizontal, cibles ≥ 44 px, aucun texte sous le seuil de contraste (calcul sur tous les textes visibles, pastilles comprises). Retour arrière navigateur depuis `#vide` : `#succes` restauré. Captures : `.test-shots/001-AS1.4-succes-375-light-after.jpg`, `-375-dark-after.jpg`, `-320-light-after.jpg`.
**Verdict** : ✅
**Issue** : —

### 001-AS1.5 — [WEB] L'aperçu suit la saisie

**Profil** : journaliste
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : ouvrir `#vide`, saisir « Lutte filles 52 kg », « Lutte », un jour, puis SEN, JPN, FRA dans les trois champs pays.
**Attendu** : l'aperçu « avant enregistrement » reflète ce qui est saisi, médaille par médaille ; les champs pays sont bien rattachés à leur médaille (étiquettes accessibles « Pays de l'or », etc.).
**Observé** : 375 px, clair, saisie réelle au clavier dans le navigateur. Après « Lutte filles 52 kg », « Lutte », SEN (tapé « sen » : passé en majuscules dans le champ et l'aperçu), JPN, FRA : titre, « Lutte · jeudi 5 novembre 2026 » et plaques SEN, JPN, FRA suivent à chaque frappe, chacune sur sa ligne Or, Argent, Bronze. Jour changé au 13 novembre : « vendredi 13 novembre 2026 » répercuté. Étiquettes `label[for]` présentes (« Pays de l'or, trois lettres », « Pays de l'argent… », « Pays du bronze… »). Remarques sans changer le verdict : l'état `#vide` arrive avec le jour déjà rempli au 5 novembre (pas vraiment vide) ; `aria-live=polite` est posé sur tout l'aperçu, donc relecture probable à chaque frappe au lecteur d'écran (non testé avec un lecteur). Cas limites de l'aperçu : voir 001-AS1.7. Capture : `.test-shots/001-AS1.5-vide-375-light-after.jpg`.
**Verdict** : ✅
**Issue** : —

### 001-AS2.4 — [WEB] L'état « conflit » refuse clairement un second podium

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : ouvrir `01-saisie-podium.html#conflit`.
**Attendu** : un bandeau d'erreur (`role=alert`) dit que l'épreuve a déjà un podium et que le podium enregistré n'a pas changé ; un chemin mène au podium existant ; la saisie reste affichée. Le message est aussi relié au champ Épreuve (limite connue de la maquette : à noter en 🟡 si absent).
**Observé** : 375 px, 320 px, clair et sombre. Bandeau `role=alert` « Cette épreuve a déjà un podium. Le podium enregistré n'a pas changé. Pour le modifier, utilisez la correction. » avec icône d'erreur + texte ; lien « Voir le podium enregistré » (vers `03-resultats-jour.html`, sans ancre sur l'épreuve) ; saisie conservée (Lutte filles 52 kg, Lutte, SEN/JPN/FRA), champ Épreuve en rouge (`aria-invalid=true`). 🟡 : le message n'est PAS relié au champ Épreuve : `aria-describedby="nom-aide nom-err"` mais `#nom-err` reste masqué dans cet état, donc le champ est rouge et annoncé invalide sans aucun message à côté (limite annoncée). 🟡 : le lien « Voir le podium enregistré » ne mesure que 18 px de haut (cible tactile < 44 px, mesuré à 320/375/1280). Le chemin vers la « correction » est cité en texte mais n'est pas un lien vers `04-correction-podium.html`. Captures : `.test-shots/001-AS2.4-conflit-375-light-after.jpg`, `-375-dark-after.jpg`, `-320-dark-after.jpg`.
**Verdict** : 🟡
**Issue** : —

### 001-AS3.5 — [WEB] L'état « règle » refuse un pays répété

**Profil** : journaliste
**Priorité** : critique
**Technique** : erreur
**Action** : ouvrir `01-saisie-podium.html#regle`.
**Attendu** : un bandeau d'erreur (`role=alert`) dit qu'un pays ne peut pas figurer deux fois, nomme SEN, et précise qu'aucun podium n'a été enregistré ; un message près des champs or et argent le répète ; la couleur n'est pas le seul signal (icône et texte).
**Observé** : 375 px, 320 px, clair et sombre. Bandeau `role=alert` « Un pays ne peut pas figurer deux fois. SEN apparaît en or et en argent. Aucun podium n'a été enregistré pour cette épreuve. » ; champs or et argent en rouge (`aria-invalid`), message « L'or et l'argent sont le même pays : SEN. » avec icône, placé sous la ligne bronze ; icône + texte + bordure : la couleur n'est pas le seul signal ; l'aperçu montre bien SEN deux fois. 🟡 : le champ Argent porte `aria-describedby="ar-err"` mais cet id n'existe pas dans la page (référence orpheline, vue sur les 7 états de la page) : seul le champ Or est relié au message. 🟡 mineur : un seul message, sous les trois lignes, et non au contact des champs or et argent. Captures : `.test-shots/001-AS3.5-regle-375-light-after.jpg`, `-champs-375-light-after.jpg`, `-champs-375-dark-after.jpg`.
**Verdict** : 🟡
**Issue** : —

### 001-AS3.6 — [WEB] L'état « invalide » distingue la validation d'entrée de la règle métier

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : ouvrir `01-saisie-podium.html#invalide`.
**Attendu** : le bandeau annonce le nombre de champs à corriger ; chaque champ en cause porte son propre message (nom obligatoire, pays « SE » à trois lettres) ; le texte de l'erreur diffère de celui de l'état « règle ».
**Observé** : 375 px, 320 px, clair et sombre. Bandeau `role=alert` « 2 champs à corriger. Le nom de l'épreuve est obligatoire, et un pays s'écrit avec trois lettres. » ; message propre sous Épreuve (« Indiquez le nom de l'épreuve. », relié par `aria-describedby`) et sous le champ bronze (« « SE » n'est pas un code pays : trois lettres, par exemple SEN. », relié) ; deux champs en rouge, icône + texte ; texte distinct de l'état « règle » (pas de « un pays ne peut pas figurer deux fois »). Capture : `.test-shots/001-AS3.6-invalide-champs-375-light-after.jpg`.
**Verdict** : ✅
**Issue** : —

### 001-AS1.6 — [WEB] Le supporter lit sans saisir

**Profil** : supporter
**Priorité** : secondaire
**Technique** : transition-état
**Action** : en profil supporter, partir de `index.html`, ouvrir « Résultats » puis « Médailles » (barre d'onglets du bas), puis chercher comment atteindre la saisie.
**Attendu** : constat seulement : les deux pages de lecture s'ouvrent sans formulaire ; décrire comment la saisie est présentée (le PRD accepte qu'elle ne soit pas protégée pour la démo) ; 🟡 si elle est mise au même niveau que la lecture sans distinction.
**Observé** : Constat. `index.html` n'a pas de barre d'onglets : on y choisit une carte (« 3 · Résultats d'une journée ») ; la barre d'onglets du bas n'existe que sur les pages. Résultats (`03`) puis Médailles (`02`) s'ouvrent : aucun `<form>` ni `<input>` (seul contrôle de lecture : le sélecteur « Mon pays » sur 02). La barre du bas ne compte que 2 onglets (Résultats, Médailles) ; la saisie est présentée à part, par le bouton « Espace journaliste » dans l'en-tête de marque, un clic suffit pour l'ouvrir (`01-saisie-podium.html`), sans protection, et par URL directe (accepté par le PRD). C'est le bouton noir plein le plus contrasté de l'écran de lecture, mais il est séparé des onglets de lecture : pas de mise au même niveau, donc pas de 🟡. Les pages 01 et 04 affichent un 3e onglet « Journaliste ». Captures : `.test-shots/001-AS1.6-index-375-light.jpg`, `-resultats-375-dark.jpg`, `-medailles-375-dark.jpg`.
**Verdict** : ✅
**Issue** : —

### 001-AS1.7 — [WEB] L'aperçu tient les saisies limites (ajouté par le testeur)

**Profil** : journaliste
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : ouvrir `#vide` à 375 px, saisir dans Épreuve (limite 100 caractères) : 100 « A » sans espace ; puis 4 espaces seuls ; puis un nom long avec espaces ; puis un nom en arabe avec emojis.
**Attendu** : la page ne déborde jamais horizontalement et le titre de l'aperçu reste lisible ; une saisie d'espaces seuls retombe sur « Épreuve à saisir » ; texte arabe et emojis s'affichent sans casser la mise en page.
**Observé** : 375 px, clair. Nom long avec espaces (≈115 caractères) : retour à la ligne correct, pas de débordement. Arabe + emojis (« هذه مباراة المصارعة للفتيات 🥇🥈🥉 ») : affichés sans débordement. 🟡 : 100 « A » sans espace : le titre de l'aperçu ne se coupe pas, la page passe de 375 à 1029 px de large (défilement horizontal, titre rogné dans la carte) ; le champ Épreuve accepte pourtant ce cas (`maxlength=100`). 🟡 : 4 espaces seuls : le titre de l'aperçu devient vide au lieu de « Épreuve à saisir ». Capture : `.test-shots/T6-nom-100-caracteres-sans-espace-apercu-375-light.jpg`.
**Verdict** : 🟡
**Issue** : —

## Gestes transversaux sur la maquette

À jouer sur les quatre pages et les états, selon [`transverse.md`](transverse.md). Lignes sans objet pour une maquette (réseau, API arrêtée, double envoi) : ⏭️. Lignes pertinentes : T5 (liens et pages), T12 (375 px et 320 px, rien ne déborde, cibles ≥ 44 px), T13 (zoom 200 %), T14 (clavier, focus visible, lien d'évitement), T15 (console).

Contrôles propres à la maquette : contraste des textes et des pastilles Or/Argent/Bronze (clair et `?theme=dark`), mode sombre lisible, états vide, chargement, hors ligne et erreur présents sur les pages 02 et 03, liens de l'index tous vivants.

### Résultats des gestes transversaux (testeur, 2026-11-07)

Pages jouées : `index`, 01 (7 états), 02 (6 états), 03 (7 états), 04 (5 états), à 320, 375 et 1280 px, thèmes clair et sombre (audit par script dans des cadres de largeur imposée, plus lecture à l'écran, clavier et captures). Gestes de `transverse.md` réellement exécutés : T3, T5, T6 (aperçu seulement), T12, T13, T14, T15, T16.

| #   | Observé                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Verdict |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| T1  | Non jouable : le formulaire ne s'envoie pas. Seul constat statique : en `#chargement` le bouton est `disabled` (« Enregistrement en cours… », `aria-busy=true`), texte gris à 3,97:1 en clair (exempté car désactivé) et aucun indicateur de progression visible. Capture `01-chargement-375-light.jpg`.                                                                                                                                                                                                                                                                                                                                 | ⏭️      |
| T2  | Sans objet (aucun enregistrement) ; un rechargement conserve l'état porté par l'ancre.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ⏭️      |
| T3  | Sur 01 : `#succes` → « Enregistrer un autre podium » → `#vide`, puis retour arrière : `#succes` restauré (bandeau + podium relu).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ✅      |
| T4  | Sans objet (maquette).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ⏭️      |
| T5  | Les 4 pages et l'index s'ouvrent en accès direct ; 6 cibles de liens internes testées, toutes en 200 ; images et fonts en 200. Route inconnue (`/inconnu.html`) : page d'erreur par défaut de Python (« Error response », en anglais, sans lien de retour) : la maquette ne dessine aucun écran 404. Les 7 liens à ancre d'état de la barre de maquette sont voulus. Les jours de la bande de `03` pointent tous vers `#jour` (sans effet : maquette).                                                                                                                                                                                   | 🟡      |
| T6  | Joué sur l'aperçu seulement : voir 001-AS1.7 (débordement à 1029 px avec 100 caractères sans espace, espaces seuls non rattrapés).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 🟡      |
| T7  | Sans objet (maquette) : l'aperçu reprend la saisie telle quelle (`lutte FILLES 52 kg` conservé avec espaces et casse).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ⏭️      |
| T8  | Constat seulement : un code est mis en majuscules à la frappe, `sén` devient `SÉN` et est accepté dans l'aperçu (accent) ; la validation réelle sera celle de l'API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ⏭️      |
| T9  | Non joué (champ date natif, `min`/`max` du 31 octobre au 13 novembre, aucune validation en maquette).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ⏭️      |
| T10 | Sans objet pour la maquette ; états hors ligne et erreur dessinés et lus : 01 `#horsligne` (bandeau `role=status`, bouton « Enregistrer (connexion requise) » désactivé), 02 et 03 `#horsligne` (bandeau + données conservées), 02 et 03 `#erreur` (`role=alert`, « Le serveur ne répond pas pour le moment », bouton « Réessayer »).                                                                                                                                                                                                                                                                                                    | ⏭️      |
| T11 | Idem T10 (messages en français, aucun spinner infini : les squelettes de 02/03 `#chargement` portent un `role=status`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ⏭️      |
| T12 | Aucun défilement horizontal de page à 320 et 375 px sur les 4 pages, tous états, clair et sombre (la bande des jours de 03 défile à l'intérieur de son bandeau : voulu). Cibles < 44 px : lien « Voir le podium enregistré » 18 px (01 `#conflit`), lien « Voir l'historique » 18 px (04 `#succes`), bouton « Corrigé 5 nov. » 32 px (03). Texte de 10 px (« ex æquo », 02) et 11 px (légende de marque, métas). Les liens de la barre de maquette (hors périmètre produit) sont aussi < 44 px.                                                                                                                                          | 🟡      |
| T13 | Zoom 200 % simulé à 188 px de large : les 4 pages débordent (01 de 11 px, 04 de 8 px, 03 de 79 px, 02 de 78 px : le tableau n'est pas dans un conteneur défilant). Au seuil WCAG de 320 px, aucun débordement. Paysage 812 px : rien ne déborde (hors bande des jours). Écart sous le seuil de 320 px : faible gravité.                                                                                                                                                                                                                                                                                                                  | 🟡      |
| T14 | 01 : ordre logique (lien d'évitement → marque → Épreuve → Discipline → Jour → Or → Argent → Bronze → Enregistrer → onglets), focus visible (contour plein bleu de 2,7 px sur chaque arrêt), lien d'évitement visible au focus et efficace. 🟡 : 03 `#correction` : la modale d'historique (`role=dialog`, `aria-modal`) ne reçoit pas le focus, Tab parcourt au moins 17 éléments de la page derrière avant d'atteindre « Fermer », Échap ne la ferme pas. 🟡 : le lien d'évitement `#contenu` écrase l'état d'ancre de la maquette (`#conflit` devient `#contenu`, état perdu) : artefact de la maquette. Envoi au clavier non jouable. | 🟡      |
| T15 | Aucune erreur ni avertissement JavaScript. Une seule erreur console sur chaque page : `GET /favicon.ico` en 404 (aucune balise `<link rel="icon">` dans les pages). Choix : 🟡 et non ❌, parce que sans effet fonctionnel ; à corriger dans la maquette pour une console vierge.                                                                                                                                                                                                                                                                                                                                                        | 🟡      |
| T16 | Constat : le supporter atteint la saisie par URL directe (`01-saisie-podium.html`) et par le bouton « Espace journaliste » visible sur les pages de lecture ; aucune protection (accepté par le PRD pour la démo). Pas un échec.                                                                                                                                                                                                                                                                                                                                                                                                         | ✅      |

Contrôles propres à la maquette (résultat) : contraste calculé sur tous les textes visibles hors zone d'image, 3 largeurs, 2 thèmes : aucun échec, sauf le texte des boutons désactivés en clair (3,97:1, exempté) ; texte sur les motifs d'en-tête vérifié à l'œil seulement (lisible). Pastilles Or/Argent/Bronze : numéro + libellé, contraste suffisant en clair et en sombre. Mode sombre lisible sur toutes les pages. États vide, chargement, hors ligne, erreur présents sur 02 et 03 (plus « mise à jour » sur 02, « jour vide », « résumé indisponible », « correction » sur 03) ; l'état `#vide` de 02 et `#jour-vide` de 03 portent un message et une action. Liens de l'index : 4 cartes, toutes vivantes.

Fait notable de campagne : la maquette a changé pendant le test (16:48 : ajout d'un `nav.nav-haut` sur les 4 pages, d'abord sans style : liens bleus soulignés collés « RésultatsMédailles » à 1024 px, puis stylé dans `cachet.css` à 16:48:35). Les constats ci-dessus ont été vérifiés à nouveau sur la version finale ; captures de l'état transitoire : `01-succes-desktop-light-avant-nav.jpg`, `03-jour-desktop-dark-avant-nav.jpg` ; version finale : `01-succes-desktop-light.jpg`.
