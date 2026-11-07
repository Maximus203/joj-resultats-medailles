#!/usr/bin/env bash
# Déploie l'API JOJ sur alpha depuis ce poste :  bash deploy/alpha/deploy.sh [ref-git]
# Prérequis : `ssh alpha` fonctionne. Livre le contenu d'un commit (HEAD par défaut).
# `--worktree` livre l'arbre de travail (fichiers suivis ou non, hors ignorés) : à réserver aux tests.
set -euo pipefail

MODE=ref; REF="${1:-HEAD}"
[ "$REF" = "--worktree" ] && { MODE=worktree; REF=HEAD; }
HOST="${DEPLOY_HOST:-alpha}"
DIR="${DEPLOY_DIR:-/opt/joj-api}"
API_HOST="${API_HOST:-api-joj.artist-dev.com}"
cd "$(git rev-parse --show-toplevel)"
SHA="$(git rev-parse --short "$REF")"
[ "$MODE" = worktree ] && SHA="$SHA-wt"

echo "→ Livraison de $SHA vers $HOST:$DIR"
ssh "$HOST" "mkdir -p '$DIR/src' && cd '$DIR' && [ -f .env ] || { umask 077; printf 'POSTGRES_PASSWORD=%s\nAPI_HOST=%s\n' \"\$(openssl rand -hex 24)\" '$API_HOST' > .env; echo '.env créé (mot de passe Postgres généré)'; }"
ssh "$HOST" "rm -rf '$DIR/src'/* '$DIR/src'/.[!.]* 2>/dev/null || true"
if [ "$MODE" = worktree ]; then
  comm -23 <(git ls-files -co --exclude-standard | sort -u) <(git ls-files -d | sort -u)     | tar -c -T - | ssh "$HOST" "tar -x -C '$DIR/src'"
else
  git archive "$REF" | ssh "$HOST" "tar -x -C '$DIR/src'"
fi
scp -q deploy/alpha/docker-compose.yml "$HOST:$DIR/docker-compose.yml"

echo "→ Build et démarrage"
ssh "$HOST" "cd '$DIR' && IMAGE_TAG='$SHA' docker compose --env-file .env up -d --build --remove-orphans && docker tag joj-api:'$SHA' joj-api:latest"

echo "→ Attente de l'état healthy"
for _ in $(seq 1 30); do
  state="$(ssh "$HOST" "docker inspect -f '{{.State.Health.Status}}' joj-api 2>/dev/null" || true)"
  [ "$state" = healthy ] && break
  sleep 3
done
echo "joj-api : ${state:-inconnu}"
[ "${state:-}" = healthy ] || { ssh "$HOST" "docker logs --tail 60 joj-api; docker logs --tail 30 joj-migrate"; exit 1; }

echo "→ Vérification publique"
# Le premier certificat Let's Encrypt met quelques secondes à être émis.
for _ in $(seq 1 12); do
  curl -fsS --max-time 10 "https://$API_HOST/api/health" && { echo; break; } || sleep 5
done || echo "(HTTPS pas joignable : vérifier le DNS de $API_HOST et les logs Traefik)"
echo "✔ $SHA déployé"
