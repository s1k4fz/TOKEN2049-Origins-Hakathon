#!/usr/bin/env bash
# Run one claim end to end against a running backend: bash scripts/e2e.sh [exploit|honest]
set -euo pipefail

API="${API:-http://127.0.0.1:8787/api}"
MODE="${1:-exploit}"

sample="$(curl -sf -XPOST "${API}/sample-tx" -H 'content-type: application/json' -d "{\"mode\":\"${MODE}\"}")"
body="$(echo "${sample}" | jq -c '{bountyId: "vault", payout: .payout, tx: .tx}')"
id="$(curl -sf -XPOST "${API}/claims" -H 'content-type: application/json' -d "${body}" | jq -r .id)"
echo "claim ${id}"

for _ in $(seq 1 80); do
  sleep 3
  claim="$(curl -sf "${API}/claims/${id}")"
  if echo "${claim}" | jq -e '[.events[].type] | any(. == "settled" or . == "rejected" or . == "failed")' >/dev/null; then
    break
  fi
done

echo "${claim}" | jq -c '.events[] | if .type == "log" then {at, line} else . end' | cut -c1-260
