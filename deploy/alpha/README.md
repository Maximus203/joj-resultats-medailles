# Déploiement de l'API sur alpha

Front sur Vercel, API (NestJS + PostgreSQL) en conteneurs sur alpha, derrière le Traefik partagé.

```bash
bash deploy/alpha/deploy.sh            # déploie HEAD
bash deploy/alpha/deploy.sh <ref>      # un autre commit ou tag
bash deploy/alpha/deploy.sh --worktree # l'arbre de travail (tests uniquement)
```

- Serveur : `/opt/joj-api` (compose, `.env` avec le mot de passe Postgres généré au premier passage, `src/`).
- Conteneurs : `joj-postgres` (volume `joj-api_postgres-data`, aucun port publié), `joj-migrate` (migrations + seed idempotent, à chaque déploiement), `joj-api`.
- Domaine : `API_HOST` (défaut `api-joj.artist-dev.com`) : un enregistrement DNS A vers alpha est requis pour le certificat Let's Encrypt.
- Retour arrière : `IMAGE_TAG=<sha> docker compose up -d` dans `/opt/joj-api` (les images des déploiements précédents sont conservées).
- Front : `apps/web/vercel.json` réécrit `/api/*` vers l'API ; sur Vercel, répertoire racine `apps/web`.
