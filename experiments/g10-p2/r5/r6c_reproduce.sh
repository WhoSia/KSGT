#!/usr/bin/env bash
set -euo pipefail
# Run in the existing R5 experiment directory (with R5q/R6a/R6b modules) and a private archive path.
# No corpus export. Outputs aggregate metrics and original authored TypeScript examples only.
archive=${1:?private NIKL v1.1 archive path required}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
go build -o "$tmp/lattice" r6c_edit_lattice.go
python r6c_lattice_replay.py "$archive" "$tmp/lattice"
tsc --strict --target ES2022 --module commonjs --outDir "$tmp/ts" r6c_discourse_plan.ts r6c_discourse_cases.ts
node "$tmp/ts/r6c_discourse_cases.js"
