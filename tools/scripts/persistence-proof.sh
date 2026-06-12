#!/usr/bin/env bash
#
# Persistence proof: floppies.json is a pure projection of the YAML source of
# truth, so any mutation that does NOT reach YAML is lost on regenerate.
#
# Strategy:
#   1. NEGATIVE CONTROL -- inject a field straight into floppies.json (not YAML)
#      and run a full regenerate; it must be WIPED (proving JSON is rebuilt from
#      YAML alone).
#   2. POSITIVE -- exercise every mutation endpoint, run the SAME regenerate, and
#      assert the change SURVIVES (proving each endpoint writes YAML).
#   3. STATIC -- assert no saveCatalog() call is reachable from live code.
#
# Requires the dev server running on :3000 (make import). Run from repo root:
#   bash tools/scripts/persistence-proof.sh
#
set -u
cd "$(dirname "$0")/../.."   # repo root
PASS=0; FAIL=0
ck(){ if [ "$2" = "$3" ]; then echo "  PASS - $1"; PASS=$((PASS+1)); else echo "  FAIL - $1 (got '$2' expected '$3')"; FAIL=$((FAIL+1)); fi; }
REGEN(){ (cd tools && node dist/cli.js rebuild-catalog >/dev/null 2>&1); }   # full regenerate from YAML
INJSON(){ node -e "const c=require('./catalog/floppies.json');const e=c.find(x=>x.id==='$1');console.log($2)"; }
API=http://127.0.0.1:3000

if [ "$(curl -s -o /dev/null -w '%{http_code}' $API/ 2>/dev/null)" != "200" ]; then
  echo "Dev server not reachable on :3000 -- start it with 'make import' first."; exit 2
fi
if [ "$(node -e 'console.log(require("./catalog/floppies.json").length)')" -lt 2 ]; then
  echo "Need at least 2 floppies in the catalog to run the proof (import some first)."; exit 2
fi

FID=$(node -e 'const c=require("./catalog/floppies.json");console.log(c[0].id)')
YAML=$(node -e 'const c=require("./catalog/floppies.json");console.log(c[0].storage.git.yamlPath)')
FID2=$(node -e 'const c=require("./catalog/floppies.json");const e=c.find(x=>!x.productId)||c[1];console.log(e.id)')
YAML2=$(node -e "const c=require('./catalog/floppies.json');console.log(c.find(x=>x.id==='$FID2').storage.git.yamlPath)")
cp "$YAML" /tmp/proof_snap1.yaml; cp "$YAML2" /tmp/proof_snap2.yaml

echo "### NEGATIVE CONTROL ###"
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('catalog/floppies.json'));c.find(x=>x.id==='$FID').__injectedOnlyInJson='ZZZ';fs.writeFileSync('catalog/floppies.json',JSON.stringify(c,null,2))"
REGEN
ck "non-YAML field is WIPED by regenerate (JSON rebuilt purely from YAML)" "$(grep -c __injectedOnlyInJson catalog/floppies.json)" "0"

echo "### POSITIVE: every mutation must SURVIVE the same regenerate ###"
curl -s -X POST $API/api/tags/assign -H 'Content-Type: application/json' -d "{\"floppyIds\":[\"$FID\"],\"tags\":[\"PROOF-tag\"]}" -o /dev/null; REGEN
ck "tags/assign survives"            "$(grep -c PROOF-tag catalog/floppies.json)" "1"
curl -s -X POST $API/api/match/confirm -H 'Content-Type: application/json' -d "{\"floppyIds\":[\"$FID\"],\"target\":{\"productId\":\"ND-210628\"}}" -o /dev/null; REGEN
ck "match/confirm product survives"  "$(INJSON $FID 'e.productId')" "ND-210628"
curl -s -X PATCH "$API/api/catalog-entry?id=$FID" -H 'Content-Type: application/json' -d '{"mediaRole":"proof-media-role"}' -o /dev/null; REGEN
ck "PATCH mediaRole survives"        "$(INJSON $FID 'e.mediaRole')" "proof-media-role"
curl -s -X PATCH "$API/api/catalog-entry?id=$FID" -H 'Content-Type: application/json' -d '{"provenance":{"notes":"proof-note"}}' -o /dev/null; REGEN
ck "PATCH provenance survives"       "$(INJSON $FID 'e.provenance&&e.provenance.notes')" "proof-note"
curl -s -X POST $API/api/match/skip -H 'Content-Type: application/json' -d "{\"floppyIds\":[\"$FID2\"]}" -o /dev/null; REGEN
ck "match/skip tag survives"         "$(INJSON $FID2 "(e.tags||[]).includes('reviewed-unassigned')")" "true"

echo "### STATIC: no saveCatalog reachable from live code ###"
ck "zero saveCatalog in server/import-runner/interactive" \
   "$(grep -rlE 'saveCatalog\(' tools/src/server.ts tools/src/api/import-runner.ts tools/src/interactive-import.ts 2>/dev/null | wc -l)" "0"

echo "### RESTORE ###"
cp /tmp/proof_snap1.yaml "$YAML"; cp /tmp/proof_snap2.yaml "$YAML2"; REGEN
echo "================  RESULT: $PASS passed, $FAIL failed  ================"
[ "$FAIL" = 0 ]
