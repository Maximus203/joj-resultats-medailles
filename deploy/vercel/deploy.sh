#!/usr/bin/env bash
# Déploie le front sur Vercel (projet joj-resultats-medailles) :  bash deploy/vercel/deploy.sh
# Prérequis : CLI Vercel connectée (`vercel login`). Le build se fait ici ; Vercel ne sert que
# le dossier statique, avec apps/web/vercel.json (réécriture /api vers l'API sur alpha + repli SPA).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

pnpm --filter @joj/web build
cp apps/web/vercel.json apps/web/dist/
cd apps/web/dist
vercel link --yes --project joj-resultats-medailles >/dev/null
url="$(vercel deploy --prod --yes)"
echo "Déployé : $url"

base=https://joj-resultats-medailles.vercel.app
curl -fsS --max-time 20 "$base/api/health" && echo " ← $base/api/health"
