#!/usr/bin/env bash
# Build the frontend and ship frontend + backend + workflow to the demo server.
# Needs a `Host origins` entry in ~/.ssh/config. Keys stay on the server and are never synced.
set -euo pipefail

cd "$(dirname "$0")/.."
HOST="${DEPLOY_HOST:-origins}"

(cd frontend && npm run build)
(cd backend && npx tsc --noEmit)

rsync -az --exclude node_modules --exclude keys --exclude target --exclude proofs --exclude 'src/id.rs' chain/ "${HOST}:~/silentclaim/chain/"
rsync -az --exclude node_modules --exclude data --exclude .env backend/ "${HOST}:~/silentclaim/backend/"
rsync -az --delete frontend/dist/ "${HOST}:/var/www/silentclaim/"

ssh "${HOST}" 'cd ~/silentclaim/backend && ~/.bun/bin/bun install --silent && sudo systemctl restart silentclaim && sleep 2 && systemctl is-active silentclaim'
echo "deployed to ${HOST}"
