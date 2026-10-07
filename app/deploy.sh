#!/usr/bin/env bash
# Build the web app and ship web + api + CRE workflow to the demo server.
# Needs a `Host origins` entry in ~/.ssh/config. Keys stay on the server and are never synced.
set -euo pipefail

cd "$(dirname "$0")/.."
HOST="${DEPLOY_HOST:-origins}"

(cd app/web && npm run build)
(cd app/api && npx tsc --noEmit)

rsync -az --exclude node_modules --exclude keys --exclude target --exclude proofs --exclude 'src/id.rs' \
  protocol/ "${HOST}:~/silentclaim/protocol/"
rsync -az --exclude node_modules --exclude data --exclude .env app/api/ "${HOST}:~/silentclaim/api/"
rsync -az --delete app/web/dist/ "${HOST}:/var/www/silentclaim/"

ssh "${HOST}" 'cd ~/silentclaim/api && ~/.bun/bin/bun install --silent \
  && (cd ../protocol/workflow && ~/.bun/bin/bun install --silent --frozen-lockfile) \
  && sudo systemctl restart silentclaim && sleep 2 && systemctl is-active silentclaim'
echo "deployed to ${HOST}"
